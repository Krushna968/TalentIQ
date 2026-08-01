import { inflateSync, inflateRawSync } from 'node:zlib';
import JSZip from 'jszip';
import { logger } from '../utils/logger.js';

/**
 * Text extraction for candidate-supplied documents.
 *
 * Extraction is best-effort by design: a document we cannot read yields empty
 * text rather than an error, and the calling agent falls back to whatever text
 * the candidate typed in directly.
 */

export interface ExtractedDocument {
  text: string;
  /** Slide or page count where the format exposes one. */
  sections: number;
  format: 'pdf' | 'pptx' | 'docx' | 'text' | 'unknown';
}

const decodeXmlEntities = (value: string) =>
  value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&amp;/g, '&');

const collapseWhitespace = (value: string) => value.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();

/** Pulls the text runs out of an Office Open XML part. */
function textFromOoxml(xml: string) {
  const runs = xml.match(/<(?:a|w):t(?:\s[^>]*)?>([\s\S]*?)<\/(?:a|w):t>/g) || [];
  return runs
    .map((run) => decodeXmlEntities(run.replace(/<[^>]+>/g, '')))
    .filter(Boolean)
    .join(' ');
}

export async function extractPptx(buffer: Buffer): Promise<ExtractedDocument> {
  const zip = await JSZip.loadAsync(buffer);
  const slideNames = Object.keys(zip.files)
    .filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
    .sort((a, b) => {
      const order = (value: string) => Number(value.match(/slide(\d+)\.xml$/)?.[1] || 0);
      return order(a) - order(b);
    });

  const slides: string[] = [];
  for (const name of slideNames) {
    const xml = await zip.files[name].async('string');
    slides.push(textFromOoxml(xml));
  }

  return { text: collapseWhitespace(slides.join('\n\n')), sections: slides.length, format: 'pptx' };
}

export async function extractDocx(buffer: Buffer): Promise<ExtractedDocument> {
  const zip = await JSZip.loadAsync(buffer);
  const part = zip.files['word/document.xml'];
  if (!part) return { text: '', sections: 0, format: 'docx' };
  const xml = await part.async('string');
  const text = collapseWhitespace(textFromOoxml(xml));
  return { text, sections: text ? text.split(/\n{2,}/).length : 0, format: 'docx' };
}

/** Decodes the PDF string-showing operators inside one content stream. */
function textFromPdfStream(stream: string) {
  const out: string[] = [];
  // Tj / TJ operands are parenthesised strings, possibly with escapes.
  const matches = stream.match(/\((?:\\.|[^\\()])*\)/g) || [];
  for (const match of matches) {
    const body = match
      .slice(1, -1)
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '\r')
      .replace(/\\t/g, '\t')
      .replace(/\\([()\\])/g, '$1')
      .replace(/\\(\d{1,3})/g, (_, code) => String.fromCharCode(parseInt(code, 8)));
    if (body.trim()) out.push(body);
  }
  return out.join(' ');
}

/**
 * Extracts text from PDFs whose content streams are either uncompressed or
 * Flate-compressed. Scanned or font-subset-encoded PDFs return empty text; the
 * caller should ask the candidate to paste the text instead.
 */
export function extractPdf(buffer: Buffer): ExtractedDocument {
  const raw = buffer.toString('latin1');
  const pages = (raw.match(/\/Type\s*\/Page[^s]/g) || []).length;
  const chunks: string[] = [];

  const streamPattern = /stream\r?\n?([\s\S]*?)endstream/g;
  let match: RegExpExecArray | null;
  while ((match = streamPattern.exec(raw)) !== null) {
    const body = Buffer.from(match[1], 'latin1');
    let decoded: string | null = null;
    try {
      decoded = inflateSync(body).toString('latin1');
    } catch {
      try {
        decoded = inflateRawSync(body).toString('latin1');
      } catch {
        // Not compressed, or a compression filter we do not handle.
        decoded = body.includes(0) ? null : body.toString('latin1');
      }
    }
    if (decoded && /\bT[Jj]\b/.test(decoded)) chunks.push(textFromPdfStream(decoded));
  }

  return { text: collapseWhitespace(chunks.join('\n')), sections: pages, format: 'pdf' };
}

const sniff = (buffer: Buffer, fileName?: string): ExtractedDocument['format'] => {
  const name = (fileName || '').toLowerCase();
  if (buffer.subarray(0, 5).toString('latin1') === '%PDF-') return 'pdf';
  if (buffer.subarray(0, 2).toString('latin1') === 'PK') {
    if (name.endsWith('.docx')) return 'docx';
    return 'pptx';
  }
  if (name.endsWith('.txt') || name.endsWith('.md')) return 'text';
  return 'unknown';
};

/** Extracts plain text from a base64 upload, choosing the parser by content sniffing. */
export async function extractDocument(base64: string, fileName?: string): Promise<ExtractedDocument> {
  let buffer: Buffer;
  try {
    buffer = Buffer.from(base64.replace(/^data:[^;]+;base64,/, ''), 'base64');
  } catch {
    return { text: '', sections: 0, format: 'unknown' };
  }
  if (!buffer.length) return { text: '', sections: 0, format: 'unknown' };

  const format = sniff(buffer, fileName);
  try {
    if (format === 'pdf') return extractPdf(buffer);
    if (format === 'pptx') return extractPptx(buffer);
    if (format === 'docx') return extractDocx(buffer);
    const text = collapseWhitespace(buffer.toString('utf8'));
    return { text, sections: text ? text.split(/\n{2,}/).length : 0, format: 'text' };
  } catch (error) {
    logger.warn('Document extraction failed', { fileName, format, error });
    return { text: '', sections: 0, format };
  }
}
