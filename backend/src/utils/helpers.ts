import { randomUUID } from 'node:crypto';

export const generateId = (): string => randomUUID();

export const slugify = (text: string): string =>
  String(text ?? '')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

export const calculatePercentage = (value: number, total: number): number => {
  if (!Number.isFinite(value) || !Number.isFinite(total) || total === 0) return 0;
  return Math.round((value / total) * 1000) / 10;
};

/** Strips tags and entity-encodes the remaining text for safe rendering. */
export const sanitizeHtml = (input: string): string =>
  String(input ?? '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .trim();

/** Bounds a value and rounds it, since every score in this platform is an integer 0-100. */
export const clamp = (value: number, min = 0, max = 100): number => {
  if (!Number.isFinite(value)) return min;
  return Math.round(Math.min(max, Math.max(min, value)));
};

export const round = (value: number, places = 1): number => {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
};

export const average = (values: number[]): number =>
  values.length ? values.reduce((total, value) => total + value, 0) / values.length : 0;

export const unique = <T>(values: T[]): T[] => Array.from(new Set(values));

export const safeJsonParse = <T>(value: string | null | undefined, fallback: T): T => {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};
