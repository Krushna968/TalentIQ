import { extname } from 'node:path';
import mammoth from 'mammoth';
import { PDFParse } from 'pdf-parse';

const MAX_EXTRACTED_CHARACTERS = 30_000;
const ALLOWED_EXTENSIONS = new Set(['.pdf', '.docx', '.txt']);

type ResumeFile = Pick<Express.Multer.File, 'buffer' | 'originalname'>;

type ExtractedResume = {
  text: string;
  format: 'pdf' | 'docx' | 'txt';
  name: string;
};

export class ResumeUploadError extends Error {
  constructor(message: string, public readonly status = 400) { super(message); }
}

function formatFor(filename: string): ExtractedResume['format'] {
  const extension = extname(filename).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(extension)) {
    throw new ResumeUploadError('Upload a PDF, DOCX, or TXT resume.');
  }
  return extension.slice(1) as ExtractedResume['format'];
}

function normaliseExtractedText(value: string) {
  const text = value.replaceAll(String.fromCharCode(0), '').replace(/\r\n/g, '\n').trim().slice(0, MAX_EXTRACTED_CHARACTERS);
  if (!text) {
    throw new ResumeUploadError('No readable text was found. For a scanned PDF, upload a text-based PDF or DOCX version.');
  }
  return text;
}

function safeFilename(filename: string) {
  return filename.replace(/[^a-z0-9._ -]/gi, '_').slice(0, 160) || 'resume';
}

export async function extractResumeText(file: ResumeFile): Promise<ExtractedResume> {
  const format = formatFor(file.originalname);
  let rawText: string;

  try {
    if (format === 'txt') {
      rawText = file.buffer.toString('utf8');
    } else if (format === 'docx') {
      const result = await mammoth.extractRawText({ buffer: file.buffer });
      rawText = result.value;
    } else {
      const parser = new PDFParse({ data: file.buffer });
      try {
        rawText = (await parser.getText()).text;
      } finally {
        await parser.destroy();
      }
    }
  } catch {
    throw new ResumeUploadError(`We could not read this ${format.toUpperCase()} file. Please upload a valid resume document.`);
  }

  return { text: normaliseExtractedText(rawText), format, name: safeFilename(file.originalname) };
}