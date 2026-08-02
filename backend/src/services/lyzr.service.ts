import { env } from '../config/env.js';

export class LyzrServiceError extends Error {
  constructor(message: string, public readonly status = 503) {
    super(message);
  }
}

export interface LyzrChatParams {
  agent_id: string;
  user_id: string;
  session_id: string;
  message: string;
}

export async function chatWithLyzr<T = any>(params: LyzrChatParams): Promise<T> {
  const apiKey = env.LYZR_API_KEY;
  if (!apiKey) {
    throw new LyzrServiceError('Lyzr API key is not configured.');
  }

  const url = `${env.LYZR_BASE_URL}/v3/inference/chat/`;

  let attempt = 0;
  const maxRetries = env.LYZR_MAX_RETRIES;

  while (attempt <= maxRetries) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), env.LYZR_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new LyzrServiceError(`Lyzr API request failed with status: ${response.status}`, response.status === 401 ? 503 : response.status);
      }

      const data = await response.json();

      if (!data || !data.response) {
        throw new LyzrServiceError('Lyzr API returned an invalid response format.', 502);
      }

      let parsed: T;
      try {
        parsed = JSON.parse(data.response);
      } catch {
        throw new LyzrServiceError('Lyzr API returned an invalid JSON response.', 502);
      }

      return parsed;
    } catch (error) {
      if (error instanceof LyzrServiceError && error.status !== 503 && error.status !== 502) {
        throw error; // Don't retry non-transient errors (like 400s)
      }
      if (attempt === maxRetries) {
        if (error instanceof LyzrServiceError) throw error;
        throw new LyzrServiceError(error instanceof Error && error.name === 'AbortError' ? 'Lyzr request timed out.' : 'Lyzr provider is temporarily unavailable.', 503);
      }
    } finally {
      clearTimeout(timeout);
    }

    attempt++;
  }

  throw new LyzrServiceError('Lyzr request failed.');
}
