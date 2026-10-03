import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAppDispatch } from './store';
import { fetchCurrentUser } from './store/authSlice';
import { fetchCurrentAdmin } from './store/adminAuthSlice';

// Layouts & Guards
import { AppLayout } from './layouts/AppLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminLayout } from './layouts/AdminLayout';
import { AdminProtectedRoute } from './components/AdminProtectedRoute';

// Pages
import { LandingPage } from './pages/LandingPage';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { ProfilePage } from './pages/ProfilePage';
import { ResumeBuilderPage } from './pages/ResumeBuilderPage';
import { ResumeAnalyzerPage } from './pages/ResumeAnalyzerPage';
import { ATSAnalyzerPage } from './pages/ATSAnalyzerPage';
import { JobAnalyzerPage } from './pages/JobAnalyzerPage';
import { JobMatchPage } from './pages/JobMatchPage';
import { InterviewCoachPage } from './pages/InterviewCoachPage';
import { InterviewSessionPage } from './pages/InterviewSessionPage';
import { InterviewHistoryPage } from './pages/InterviewHistoryPage';
import { STARCoachPage } from './pages/STARCoachPage';
import { CareerCoachPage } from './pages/CareerCoachPage';
import { CareerRoadmapPage } from './pages/CareerRoadmapPage';
import { SkillsAnalysisPage } from './pages/SkillsAnalysisPage';
import { SettingsPage } from './pages/SettingsPage';

// Admin Pages
import { AdminLogin } from './pages/admin/AdminLogin';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminUsers } from './pages/admin/AdminUsers';
import { AdminResumes } from './pages/admin/AdminResumes';
import { AdminInterviews } from './pages/admin/AdminInterviews';
import { AdminJobs } from './pages/admin/AdminJobs';
import { AdminLogs } from './pages/admin/AdminLogs';
import { AdminSettings } from './pages/admin/AdminSettings';

export const App: React.FC = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    // If token exists, fetch current user details to keep state in sync
    const token = localStorage.getItem('token');
    if (token) {
      dispatch(fetchCurrentUser());
    }

    const adminToken = localStorage.getItem('adminToken');
    if (adminToken) {
      dispatch(fetchCurrentAdmin());
    }
  }, [dispatch]);

  return (
    <Routes>
      {/* Public Pages */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Authenticated Workspace Pages */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/resume-builder" element={<ResumeBuilderPage />} />
          <Route path="/resume-analyzer" element={<ResumeAnalyzerPage />} />
          <Route path="/ats-analyzer" element={<ATSAnalyzerPage />} />
          <Route path="/job-analyzer" element={<JobAnalyzerPage />} />
          <Route path="/job-match" element={<JobMatchPage />} />
          <Route path="/interview-coach" element={<InterviewCoachPage />} />
          <Route path="/interview/session/:id" element={<InterviewSessionPage />} />
          <Route path="/interview/history" element={<InterviewHistoryPage />} />
          <Route path="/star-coach" element={<STARCoachPage />} />
          <Route path="/career-coach" element={<CareerCoachPage />} />
          <Route path="/career-roadmap" element={<CareerRoadmapPage />} />
          <Route path="/skills-analysis" element={<SkillsAnalysisPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Route>

      {/* Admin Pages */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route element={<AdminProtectedRoute />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          {/* Phase 3 Pages */}
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/resumes" element={<AdminResumes />} />
          <Route path="/admin/interviews" element={<AdminInterviews />} />
          
          {/* Phase 4 Pages */}
          <Route path="/admin/jobs" element={<AdminJobs />} />
          
          {/* Phase 5 Pages */}
          <Route path="/admin/ai-logs" element={<AdminLogs />} />
          <Route path="/admin/settings" element={<AdminSettings />} />
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
