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
import { ROUTES } from './paths.js';

const moduleRoute = (path, module) => <Route path={path} element={<ProductModule module={module} />} />;

export default function AppRoutes() {
  return <Routes>
    <Route path={ROUTES.HOME} element={<LandingPage />} />
    <Route path={ROUTES.AUTH} element={<AuthScreen />} />
    <Route path={ROUTES.CANDIDATE_OVERVIEW} element={<CandidateDashboard />} />
    {moduleRoute(ROUTES.CANDIDATE_PROFILE, productModules.candidateProfile)}
    {moduleRoute(ROUTES.CANDIDATE_ROADMAP, productModules.candidateRoadmap)}
    {moduleRoute(ROUTES.CANDIDATE_RESUME, productModules.resumeBuilder)}
    {moduleRoute(ROUTES.CANDIDATE_JOBS, productModules.jobRecommendations)}
    <Route path={ROUTES.RECRUITER_SEARCH} element={<RecruiterSearch />} />
    {moduleRoute(ROUTES.RECRUITER_PIPELINE, productModules.recruiterPipeline)}
    {moduleRoute(ROUTES.RECRUITER_COMPARE, productModules.recruiterCompare)}
    {moduleRoute(ROUTES.VERIFICATION, productModules.verification)}
    {moduleRoute(ROUTES.MATCHING, productModules.matching)}
    {moduleRoute(ROUTES.ANALYTICS, productModules.analytics)}
    {moduleRoute(ROUTES.TEAM_CONTRIBUTIONS, productModules.teamContributions)}
    {moduleRoute(ROUTES.PRESENTATIONS, productModules.presentations)}
    {moduleRoute(ROUTES.HACKATHONS, productModules.hackathons)}
    {moduleRoute(ROUTES.TRUST, productModules.trustFraud)}
    <Route path={ROUTES.INTERVIEW} element={<AIInterview />} />
    {moduleRoute(ROUTES.INTERVIEW_REPORT, productModules.interviewReport)}
    <Route path="/report/:id" element={<TalentReport />} />
    <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
  </Routes>;
}
