export const logger = {
  info: (message: string, meta?: unknown) => console.info(message, meta),
  warn: (message: string, meta?: unknown) => console.warn(message, meta),
  error: (message: string, meta?: unknown) => console.error(message, meta),
  debug: (message: string, meta?: unknown) => console.debug(message, meta),
};