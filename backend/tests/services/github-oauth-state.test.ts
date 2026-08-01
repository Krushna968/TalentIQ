import { describe, expect, it } from 'vitest';
import { createGitHubOAuthState, verifyGitHubOAuthState } from '../../src/services/github-oauth-state.service.js';

describe('GitHub OAuth state', () => {
  it('accepts a valid state once and rejects replay', () => {
    const state = createGitHubOAuthState('candidate-1');

    expect(verifyGitHubOAuthState(state)).toMatchObject({ candidateId: 'candidate-1', provider: 'github' });
    expect(verifyGitHubOAuthState(state)).toBeNull();
  });

  it('rejects a state for a different provider', () => {
    const state = createGitHubOAuthState('candidate-1', 'linkedin');

    expect(verifyGitHubOAuthState(state, 'github')).toBeNull();
  });
});
