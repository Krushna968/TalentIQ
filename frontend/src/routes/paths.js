/** One source of truth for public URLs. */
export const ROUTES = {
  HOME: '/', AUTH: '/auth',
  CANDIDATE_OVERVIEW: '/candidate', CANDIDATE_PROFILE: '/candidate/profile', CANDIDATE_ROADMAP: '/candidate/roadmap',
  RECRUITER_SEARCH: '/recruiter', RECRUITER_PIPELINE: '/recruiter/pipeline', RECRUITER_COMPARE: '/recruiter/compare',
  VERIFICATION: '/verification', MATCHING: '/matching', ANALYTICS: '/analytics',
  INTERVIEW: '/interview', INTERVIEW_REPORT: '/interview/report', CANDIDATE_RESUME: '/candidate/resume-builder', CANDIDATE_JOBS: '/candidate/jobs', TEAM_CONTRIBUTIONS: '/team-contributions', PRESENTATIONS: '/presentations/analyze', HACKATHONS: '/hackathons', TRUST: '/trust',
  TALENT_REPORT: (id) => '/report/' + id,
};

