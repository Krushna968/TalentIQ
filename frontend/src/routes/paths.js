/** One source of truth for public URLs. */
export const ROUTES = {
  HOME: '/',
  AUTH: '/auth',

  CANDIDATE_OVERVIEW: '/candidate',
  CANDIDATE_PROFILE: '/candidate/profile',
  CANDIDATE_ROADMAP: '/candidate/roadmap',
  CANDIDATE_RESUME: '/candidate/resume-builder',
  CANDIDATE_JOBS: '/candidate/jobs',
  CANDIDATE_PORTFOLIO: '/candidate/portfolio',

  RECRUITER_SEARCH: '/recruiter',
  RECRUITER_PIPELINE: '/recruiter/pipeline',
  RECRUITER_COMPARE: '/recruiter/compare',
  RECRUITER_JOBS: '/recruiter/jobs',

  VERIFICATION: '/verification',
  MATCHING: '/matching',
  ANALYTICS: '/analytics',
  INTERVIEW: '/interview',
  INTERVIEW_REPORT: '/interview/report',
  TEAM_CONTRIBUTIONS: '/team-contributions',
  PRESENTATIONS: '/presentations/analyze',
  HACKATHONS: '/hackathons',
  TRUST: '/trust',
  REVIEW_QUEUE: '/review-queue',

  TALENT_REPORT: (id) => `/report/${id}`,
  INTERVIEW_SESSION: (id) => `/interview/report/${id}`,
};
