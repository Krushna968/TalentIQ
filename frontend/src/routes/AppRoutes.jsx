import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { productModules } from '../config/productModules.js';
import AuthScreen from '../screens/AuthScreen.jsx';
import CandidateDashboard from '../screens/CandidateDashboard.jsx';
import AIInterview from '../screens/AIInterview.jsx';
import LandingPage from '../screens/LandingPage.jsx';
import ProductModule from '../screens/ProductModule.jsx';
import RecruiterSearch from '../screens/RecruiterSearch.jsx';
import TalentReport from '../screens/TalentReport.jsx';
import { RequireAuth, RequireRole } from '../components/RouteGuards.jsx';
import { ROUTES } from './paths.js';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path={ROUTES.HOME} element={<LandingPage />} />
      <Route path={ROUTES.AUTH} element={<AuthScreen />} />

      {/* Candidate Protected Routes */}
      <Route path={ROUTES.CANDIDATE_OVERVIEW} element={<RequireRole allowedRoles={['CANDIDATE']}><CandidateDashboard /></RequireRole>} />
      <Route path={ROUTES.CANDIDATE_PROFILE} element={<RequireRole allowedRoles={['CANDIDATE']}><ProductModule module={productModules.candidateProfile} /></RequireRole>} />
      <Route path={ROUTES.CANDIDATE_ROADMAP} element={<RequireRole allowedRoles={['CANDIDATE']}><ProductModule module={productModules.candidateRoadmap} /></RequireRole>} />
      <Route path={ROUTES.CANDIDATE_RESUME} element={<RequireRole allowedRoles={['CANDIDATE']}><ProductModule module={productModules.resumeBuilder} /></RequireRole>} />
      <Route path={ROUTES.CANDIDATE_JOBS} element={<RequireRole allowedRoles={['CANDIDATE']}><ProductModule module={productModules.jobRecommendations} /></RequireRole>} />

      {/* Recruiter Protected Routes */}
      <Route path={ROUTES.RECRUITER_SEARCH} element={<RequireRole allowedRoles={['RECRUITER']}><RecruiterSearch /></RequireRole>} />
      <Route path={ROUTES.RECRUITER_PIPELINE} element={<RequireRole allowedRoles={['RECRUITER']}><ProductModule module={productModules.recruiterPipeline} /></RequireRole>} />
      <Route path={ROUTES.RECRUITER_COMPARE} element={<RequireRole allowedRoles={['RECRUITER']}><ProductModule module={productModules.recruiterCompare} /></RequireRole>} />

      {/* Admin Protected Routes */}
      <Route path={ROUTES.TRUST} element={<RequireRole allowedRoles={['ADMIN']}><ProductModule module={productModules.trustFraud} /></RequireRole>} />

      {/* Shared Protected Feature Modules */}
      <Route path={ROUTES.VERIFICATION} element={<RequireAuth><ProductModule module={productModules.verification} /></RequireAuth>} />
      <Route path={ROUTES.MATCHING} element={<RequireAuth><ProductModule module={productModules.matching} /></RequireAuth>} />
      <Route path={ROUTES.ANALYTICS} element={<RequireAuth><ProductModule module={productModules.analytics} /></RequireAuth>} />
      <Route path={ROUTES.TEAM_CONTRIBUTIONS} element={<RequireAuth><ProductModule module={productModules.teamContributions} /></RequireAuth>} />
      <Route path={ROUTES.PRESENTATIONS} element={<RequireAuth><ProductModule module={productModules.presentations} /></RequireAuth>} />
      <Route path={ROUTES.HACKATHONS} element={<RequireAuth><ProductModule module={productModules.hackathons} /></RequireAuth>} />
      <Route path={ROUTES.INTERVIEW} element={<RequireAuth><AIInterview /></RequireAuth>} />
      <Route path={ROUTES.INTERVIEW_REPORT} element={<RequireAuth><ProductModule module={productModules.interviewReport} /></RequireAuth>} />
      <Route path="/report/:id" element={<RequireAuth><TalentReport /></RequireAuth>} />

      <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
    </Routes>
  );
}

