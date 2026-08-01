import { describe, expect, it } from 'vitest';
import { decryptSecret, encryptSecret } from '../../src/services/secret-crypto.service.js';

describe('provider credential encryption', () => {
  it('round-trips a provider token without keeping it in plaintext', () => {
    const token = 'github-token-for-test-only';
    const encrypted = encryptSecret(token);

    expect(encrypted).not.toContain(token);
    expect(decryptSecret(encrypted)).toBe(token);
  });

  it('allows a legacy plaintext token to be migrated by the next sync', () => {
    expect(decryptSecret('legacy-token')).toBe('legacy-token');
  });
});
