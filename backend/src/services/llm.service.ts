import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

/**
 * Optional LLM adapter.
 *
 * Every agent in this platform produces a complete, explainable result from its
 * own deterministic analyser. This adapter is only ever used to *enrich* that
 * result with narrative text or a second opinion, so the platform stays fully
 * functional when no provider is configured. Nothing here throws: a failure or
 * a missing key simply returns null and the caller keeps its deterministic
 * output.
 */

export type LlmProvider = 'anthropic' | 'openai' | 'none';

export interface CompletionRequest {
  system?: string;
  prompt: string;
  maxTokens?: number;
  /** Aborts the request if the provider takes longer than this. */
  timeoutMs?: number;
}

const DEFAULT_MAX_TOKENS = 1024;
const DEFAULT_TIMEOUT_MS = 20_000;

export function activeProvider(): LlmProvider {
  if (env.ANTHROPIC_API_KEY) return 'anthropic';
  if (env.OPENAI_API_KEY) return 'openai';
  return 'none';
}

export const isLlmEnabled = () => activeProvider() !== 'none';

/** Reports which engine produced a result, for storage alongside agent output. */
export const engineName = () => (isLlmEnabled() ? `llm:${activeProvider()}` : 'deterministic');

async function callAnthropic(request: CompletionRequest, signal: AbortSignal): Promise<string | null> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    signal,
    headers: {
      'content-type': 'application/json',
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: env.LLM_MODEL || 'claude-opus-5',
      max_tokens: request.maxTokens ?? DEFAULT_MAX_TOKENS,
      ...(request.system ? { system: request.system } : {}),
      messages: [{ role: 'user', content: request.prompt }],
    }),
  });

  if (!response.ok) {
    logger.warn('Anthropic completion failed', { status: response.status });
    return null;
  }

  const data = (await response.json()) as { content?: Array<{ type: string; text?: string }> };
  const text = (data.content || [])
    .filter((block) => block.type === 'text' && block.text)
    .map((block) => block.text)
    .join('\n')
    .trim();
  return text || null;
}

async function callOpenAI(request: CompletionRequest, signal: AbortSignal): Promise<string | null> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    signal,
    headers: { 'content-type': 'application/json', authorization: `Bearer ${env.OPENAI_API_KEY}` },
    body: JSON.stringify({
      model: env.LLM_MODEL || 'gpt-4o-mini',
      max_tokens: request.maxTokens ?? DEFAULT_MAX_TOKENS,
      messages: [
        ...(request.system ? [{ role: 'system', content: request.system }] : []),
        { role: 'user', content: request.prompt },
      ],
    }),
  });

  if (!response.ok) {
    logger.warn('OpenAI completion failed', { status: response.status });
    return null;
  }

  const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
  return data.choices?.[0]?.message?.content?.trim() || null;
}

/** Returns generated text, or null when no provider is configured or the call fails. */
export async function complete(request: CompletionRequest): Promise<string | null> {
  const provider = activeProvider();
  if (provider === 'none') return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), request.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  try {
    return provider === 'anthropic'
      ? await callAnthropic(request, controller.signal)
      : await callOpenAI(request, controller.signal);
  } catch (error) {
    logger.warn('LLM completion errored; falling back to deterministic output', error);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Extracts the first JSON object or array from a model response. */
export function parseJsonResponse<T>(text: string | null): T | null {
  if (!text) return null;
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = (fenced ? fenced[1] : text).trim();
  const start = candidate.search(/[[{]/);
  if (start === -1) return null;
  const opener = candidate[start];
  const closer = opener === '{' ? '}' : ']';
  const end = candidate.lastIndexOf(closer);
  if (end <= start) return null;
  try {
    return JSON.parse(candidate.slice(start, end + 1)) as T;
  } catch {
    return null;
  }
}

/** Convenience wrapper that asks for JSON and parses it, returning null on any failure. */
export async function completeJson<T>(request: CompletionRequest): Promise<T | null> {
  const text = await complete({
    ...request,
    system: `${request.system ? `${request.system}\n\n` : ''}Reply with JSON only. No prose, no code fences.`,
  });
  return parseJsonResponse<T>(text);
}
