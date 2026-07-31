import { describe, expect, it } from 'vitest';
import { calculateGitHubTalentScore } from '../../src/services/talent-score.service.js';

describe('calculateGitHubTalentScore', () => {
  it('scores only the supplied GitHub evidence and stays within its documented range', () => {
    const score = calculateGitHubTalentScore({
      repos: [
        { description: 'A documented API', size: 1200, stars: 35, forks: 8, pushedAt: new Date('2026-07-30') },
        { description: null, size: 50, stars: 0, forks: 0, pushedAt: new Date('2026-07-15') },
      ],
      commits: Array.from({ length: 20 }, () => ({ committedAt: new Date('2026-07-30') })),
      languages: [{ language: 'TypeScript', repoCount: 2 }, { language: 'Python', repoCount: 1 }],
      followers: 40,
      identityVerified: true,
    }, new Date('2026-08-01'));

    expect(score.score).toBeGreaterThan(0);
    expect(score.score).toBeLessThanOrEqual(100);
    expect(score.confidence).toBeGreaterThan(0);
    expect(score.components).toHaveLength(5);
    expect(score.evidence).toMatchObject({ repositories: 2, commits: 20, languages: 2, stars: 35, forks: 8 });
  });

  it('does not invent strength where no GitHub evidence exists', () => {
    const score = calculateGitHubTalentScore({ repos: [], commits: [], languages: [], followers: 0 }, new Date('2026-08-01'));
    expect(score.score).toBe(0);
    expect(score.confidence).toBe(0);
  });
});
