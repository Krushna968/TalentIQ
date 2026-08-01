export const generateId = (): string => crypto.randomUUID();
export const slugify = (text: string): string => text
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .trim()
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');
export const calculatePercentage = (value: number, total: number): number => total > 0 ? Math.round((value / total) * 10_000) / 100 : 0;
export const sanitizeHtml = (input: string): string => input
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');