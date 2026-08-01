import { describe, expect, it } from 'vitest';
import { scoreResume } from '../../src/services/resume-score.service.js';

describe('scoreResume', () => {
  const resume = `Krushna Rasal
krushna@example.com | github.com/krushna

Experience
Built React and Node.js services with TypeScript, PostgreSQL, Docker, and Git. Improved API response time by 42% and served 10k users.

Projects
Developed a REST platform with CI/CD and automated tests.

Skills
React, TypeScript, Node.js, SQL, PostgreSQL, Docker, Git

Education
Bachelor of Engineering`;

  it('returns an explainable bounded score using only submitted resume text', () => {
    const result = scoreResume({ resumeText: resume, targetRole: 'Senior Full-Stack Engineer' });
    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.components).toHaveLength(4);
    expect(result.matchedSkills).toContain('React');
    expect(result.components[0].detail).toContain('target-role skills');
    expect(result.missingSkills).not.toContain('Communication');
    expect(result.evidence.metrics).toBeGreaterThan(0);
    expect(result.disclaimer).toContain('not a hiring decision');
  });

  it('rejects an empty resume rather than inventing a score', () => {
    expect(() => scoreResume({ resumeText: '', targetRole: 'Developer' })).toThrow('resumeText is required');
  });
});