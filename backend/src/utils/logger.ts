const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 } as const;
type Level = keyof typeof LEVELS;

const configured = (process.env.LOG_LEVEL as Level) || (process.env.NODE_ENV === 'production' ? 'info' : 'debug');
const threshold = LEVELS[configured] ?? LEVELS.info;

/** Field names whose values must never reach a log sink. */
const SECRET_KEYS = /^(password|passwordhash|token|accesstoken|refreshtoken|authorization|secret|clientsecret|apikey|jwt|cookie|tokenhash)$/i;

/** Recursively replaces secret-looking values so credentials never appear in logs. */
export function redact(value: unknown, depth = 0): unknown {
  if (depth > 6 || value === null || value === undefined) return value;
  if (Array.isArray(value)) return value.slice(0, 50).map((item) => redact(item, depth + 1));
  if (value instanceof Error) return { name: value.name, message: value.message };
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      out[key] = SECRET_KEYS.test(key) ? '[redacted]' : redact(item, depth + 1);
    }
    return out;
  }
  return value;
}

function emit(level: Level, message: string, meta?: unknown) {
  if (LEVELS[level] < threshold) return;
  const line = { level, time: new Date().toISOString(), message, ...(meta === undefined ? {} : { meta: redact(meta) }) };
  const serialized = JSON.stringify(line);
  if (level === 'error') console.error(serialized);
  else if (level === 'warn') console.warn(serialized);
  else console.log(serialized);
}

export const logger = {
  debug: (message: string, meta?: unknown) => emit('debug', message, meta),
  info: (message: string, meta?: unknown) => emit('info', message, meta),
  warn: (message: string, meta?: unknown) => emit('warn', message, meta),
  error: (message: string, meta?: unknown) => emit('error', message, meta),
};
