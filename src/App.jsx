import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import LandingPage from './screens/LandingPage.jsx'
import AuthScreen from './screens/AuthScreen.jsx'
import CandidateDashboard from './screens/CandidateDashboard.jsx'
import RecruiterSearch from './screens/RecruiterSearch.jsx'
import TalentReport from './screens/TalentReport.jsx'
import AIInterview from './screens/AIInterview.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/auth" element={<AuthScreen />} />
      <Route path="/candidate" element={<CandidateDashboard />} />
      <Route path="/recruiter" element={<RecruiterSearch />} />
      <Route path="/report/:id" element={<TalentReport />} />
      <Route path="/interview" element={<AIInterview />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
