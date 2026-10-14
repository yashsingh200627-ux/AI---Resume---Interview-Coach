import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../store';
import { addToast } from '../store/uiSlice';
import { dashboardApi } from '../services/api';
import { DashboardStats } from '../types';
import { ScoreGauge } from '../components/ScoreGauge';
import {
  Mic, FileText, FileSearch, Target, Award, Compass,
  TrendingUp, Sparkles, CheckCircle2, ArrowRight,
  Clock, Plus, AlertCircle, BarChart3, ShieldCheck,
  Trash2, X, Loader2
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isClearingActivities, setIsClearingActivities] = useState(false);
  const [deletingActivityId, setDeletingActivityId] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await dashboardApi.getStats();
      setStats(res.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load dashboard metrics.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearAllActivities = async () => {
    if (!window.confirm('Are you sure you want to clear your recent activity history?')) return;
    setIsClearingActivities(true);
    try {
      await dashboardApi.clearAllActivities();
      setStats((prev) => prev ? { ...prev, recent_activities: [] } : null);
      dispatch(addToast({ type: 'info', message: 'Recent activity history cleared.' }));
    } catch (err: any) {
      dispatch(addToast({ type: 'error', message: err.response?.data?.detail || 'Failed to clear activity history.' }));
    } finally {
      setIsClearingActivities(false);
    }
  };

  const handleDeleteActivity = async (activityId: string) => {
    setDeletingActivityId(activityId);
    try {
      await dashboardApi.deleteActivity(activityId);
      setStats((prev) =>
        prev
          ? {
              ...prev,
              recent_activities: prev.recent_activities.filter((a) => a.id !== activityId),
            }
          : null
      );
      dispatch(addToast({ type: 'info', message: 'Activity removed.' }));
    } catch (err: any) {
      dispatch(addToast({ type: 'error', message: err.response?.data?.detail || 'Failed to remove activity.' }));
    } finally {
      setDeletingActivityId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Welcome & Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E2E8F0] dark:border-[#1E293B]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#0F172A] dark:text-[#F8FAFC] tracking-tight">
            Welcome back, {user?.full_name && user.full_name !== 'Alex Rivera' && user.full_name !== 'Alex' ? user.full_name.split(' ')[0] : 'Yash'} 👋
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] dark:text-slate-400 font-semibold mt-1">
            Target Role:{' '}
            <span className="text-[#2563EB] dark:text-[#38BDF8] font-bold">
              {user?.target_job_role || 'Full Stack Engineer'}
            </span>{' '}
            • Level: <span className="text-[#0F172A] dark:text-white font-bold">{user?.experience_level || 'Mid-Level'}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/profile"
            className="px-3.5 py-2 rounded-xl bg-white dark:bg-[#111827] hover:bg-slate-50 dark:hover:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#1E293B] text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC] transition shadow-sm"
          >
            Update Profile
          </Link>
          <Link
            to="/resume-builder"
            className="px-3.5 py-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] dark:bg-[#3B82F6] dark:hover:bg-[#2563EB] text-xs font-semibold text-white transition flex items-center gap-1.5 shadow-md shadow-blue-600/20"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Resume</span>
          </Link>
        </div>
      </div>

      {/* MOST IMPORTANT DEMO FEATURE: Prominent Live AI Interview Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-500/10 via-cyan-500/10 to-blue-500/10 dark:from-blue-950/40 dark:via-cyan-950/30 dark:to-[#181117] border border-blue-200 dark:border-[#3b2536] p-6 sm:p-8 shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 blur-[90px] rounded-full pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-cyan-300 text-xs font-bold border border-blue-200 dark:border-blue-800/40">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <span>MOST IMPORTANT CAPABILITY</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#0F172A] dark:text-white tracking-tight">
              🎤 Live AI Interview Simulation
            </h2>
            <p className="text-xs sm:text-sm text-[#475569] dark:text-[#CBD5E1] max-w-xl leading-relaxed">
              Launch an adaptive, real-time interview with live AI-generated questions tailored to{' '}
              <strong className="text-[#0F172A] dark:text-white">{user?.target_job_role || 'your target role'}</strong>.
              Receive instant dimensional evaluations on technical accuracy, clarity, and structure.
            </p>
          </div>

          <button
            onClick={() => navigate('/interview-coach')}
            className="px-6 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-sm sm:text-base shadow-xl shadow-blue-600/25 transition hover:scale-105 shrink-0 flex items-center justify-center gap-2.5 cursor-pointer"
          >
            <Mic className="w-5 h-5 text-blue-100 animate-pulse" />
            <span>Start Live Interview</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Dynamic Calculated Statistics Cards (Strictly No Fake Data) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Profile Completion */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/90 dark:border-slate-800 flex items-center gap-4 shadow-sm">
          <div className="shrink-0">
            <ScoreGauge
              score={stats?.profile_completion_percentage || 0}
              size="sm"
              showLabel={false}
            />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Profile Setup
            </span>
            <span className="text-lg font-bold text-slate-900 dark:text-white block mt-0.5">
              {stats?.profile_completion_percentage || 0}% Complete
            </span>
            <Link
              to="/profile"
              className="text-[11px] text-[#2563EB] dark:text-[#38BDF8] hover:underline mt-1 inline-block font-medium"
            >
              Add qualifications →
            </Link>
          </div>
        </div>

        {/* Latest Resume Score */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/90 dark:border-slate-800 flex items-center gap-4 shadow-sm">
          <div className="shrink-0">
            {stats?.latest_resume_score !== null && stats?.latest_resume_score !== undefined ? (
              <ScoreGauge score={stats.latest_resume_score} size="sm" showLabel={false} />
            ) : (
              <div className="w-16 h-16 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-500 text-xs font-semibold">
                N/A
              </div>
            )}
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Resume Audit
            </span>
            <span className="text-lg font-bold text-slate-900 dark:text-white block mt-0.5">
              {stats?.latest_resume_score !== null && stats?.latest_resume_score !== undefined
                ? `${stats.latest_resume_score}% Score`
                : 'Not Scanned'}
            </span>
            <Link
              to="/resume-analyzer"
              className="text-[11px] text-[#2563EB] dark:text-[#38BDF8] hover:underline mt-1 inline-block font-medium"
            >
              {stats?.latest_resume_score ? 'View analysis →' : 'Upload resume →'}
            </Link>
          </div>
        </div>

        {/* Latest ATS Match Score */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/90 dark:border-slate-800 flex items-center gap-4 shadow-sm">
          <div className="shrink-0">
            {stats?.latest_ats_score !== null && stats?.latest_ats_score !== undefined ? (
              <ScoreGauge score={stats.latest_ats_score} size="sm" showLabel={false} />
            ) : (
              <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-500 text-xs font-semibold">
                N/A
              </div>
            )}
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              ATS Alignment
            </span>
            <span className="text-lg font-bold text-slate-900 dark:text-white block mt-0.5">
              {stats?.latest_ats_score !== null && stats?.latest_ats_score !== undefined
                ? `${stats.latest_ats_score}% Match`
                : 'Not Tested'}
            </span>
            <Link
              to="/ats-analyzer"
              className="text-[11px] text-[#2563EB] dark:text-[#38BDF8] hover:underline mt-1 inline-block font-medium"
            >
              Match against JD →
            </Link>
          </div>
        </div>

        {/* Interview Average Score */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/90 dark:border-slate-800 flex items-center gap-4 shadow-sm">
          <div className="shrink-0">
            {stats?.average_interview_score !== null && stats?.average_interview_score !== undefined ? (
              <ScoreGauge score={stats.average_interview_score} size="sm" showLabel={false} />
            ) : (
              <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-500 text-xs font-semibold">
                0
              </div>
            )}
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Interview Avg
            </span>
            <span className="text-lg font-bold text-slate-900 dark:text-white block mt-0.5">
              {stats?.average_interview_score !== null && stats?.average_interview_score !== undefined
                ? `${stats.average_interview_score}%`
                : '0 Sessions'}
            </span>
            <Link
              to="/interview/history"
              className="text-[11px] text-[#2563EB] dark:text-[#38BDF8] hover:underline mt-1 inline-block font-medium"
            >
              {stats?.total_interviews_completed
                ? `${stats.total_interviews_completed} finished →`
                : 'Practice now →'}
            </Link>
          </div>
        </div>
      </div>

      {/* Grid: Quick Modules & Activity Log */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: 6 Platform Capabilities Quick Access */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-base font-bold text-[#0F172A] dark:text-[#F8FAFC] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#2563EB] dark:text-[#38BDF8]" />
            <span>Platform Capabilities</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              to="/resume-builder"
              className="p-5 rounded-2xl bg-white dark:bg-[#111827] border border-[#E2E8F0] dark:border-[#1E293B] hover:border-blue-500/40 hover:bg-slate-50 dark:hover:bg-[#1E293B] transition group shadow-sm"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-[#2563EB] dark:text-[#38BDF8] flex items-center justify-center mb-3 group-hover:scale-105 transition">
                <FileText className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-[#0F172A] dark:text-white mb-1">AI Resume Builder</h4>
              <p className="text-xs text-[#64748B] dark:text-slate-400 leading-relaxed">
                Generate action-driven bullets and download formatted PDFs.
              </p>
            </Link>

            <Link
              to="/resume-analyzer"
              className="p-5 rounded-2xl bg-white dark:bg-[#111827] border border-[#E2E8F0] dark:border-[#1E293B] hover:border-blue-500/40 hover:bg-slate-50 dark:hover:bg-[#1E293B] transition group shadow-sm"
            >
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center mb-3 group-hover:scale-105 transition">
                <FileSearch className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-[#0F172A] dark:text-white mb-1">Resume Analyzer</h4>
              <p className="text-xs text-[#64748B] dark:text-slate-400 leading-relaxed">
                Upload real documents for calculated ATS &amp; formatting audits.
              </p>
            </Link>

            <Link
              to="/ats-analyzer"
              className="p-5 rounded-2xl bg-white dark:bg-[#111827] border border-[#E2E8F0] dark:border-[#1E293B] hover:border-blue-500/40 hover:bg-slate-50 dark:hover:bg-[#1E293B] transition group shadow-sm"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-600/20 text-[#2563EB] dark:text-[#38BDF8] flex items-center justify-center mb-3 group-hover:scale-105 transition">
                <Target className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-[#0F172A] dark:text-white mb-1">ATS Optimization</h4>
              <p className="text-xs text-[#64748B] dark:text-slate-400 leading-relaxed">
                Match resumes to specific job descriptions with keyword gap detection.
              </p>
            </Link>

            <Link
              to="/interview-coach"
              className="p-5 rounded-2xl bg-white dark:bg-[#111827] border border-[#E2E8F0] dark:border-[#1E293B] hover:border-blue-500/40 hover:bg-slate-50 dark:hover:bg-[#1E293B] transition group shadow-sm"
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3 group-hover:scale-105 transition">
                <Mic className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-[#0F172A] dark:text-white mb-1">Live Interview Coach</h4>
              <p className="text-xs text-[#64748B] dark:text-slate-400 leading-relaxed">
                Simulate role-specific questions with real-time scoring.
              </p>
            </Link>

            <Link
              to="/star-coach"
              className="p-5 rounded-2xl bg-white dark:bg-[#111827] border border-[#E2E8F0] dark:border-[#1E293B] hover:border-blue-500/40 hover:bg-slate-50 dark:hover:bg-[#1E293B] transition group shadow-sm"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-[#2563EB] dark:text-[#38BDF8] flex items-center justify-center mb-3 group-hover:scale-105 transition">
                <Award className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-[#0F172A] dark:text-white mb-1">STAR Method Coach</h4>
              <p className="text-xs text-[#64748B] dark:text-slate-400 leading-relaxed">
                Deconstruct behavioral answers into Situation, Task, Action, Result.
              </p>
            </Link>

            <Link
              to="/career-roadmap"
              className="p-5 rounded-2xl bg-white dark:bg-[#111827] border border-[#E2E8F0] dark:border-[#1E293B] hover:border-blue-500/40 hover:bg-slate-50 dark:hover:bg-[#1E293B] transition group shadow-sm"
            >
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center mb-3 group-hover:scale-105 transition">
                <Compass className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-[#0F172A] dark:text-white mb-1">Career Roadmap</h4>
              <p className="text-xs text-[#64748B] dark:text-slate-400 leading-relaxed">
                Personalized 6-month skill development plan based on your profile.
              </p>
            </Link>
          </div>
        </div>

        {/* Right: Skills Breakdown & Chronological Recent Activities */}
        <div className="space-y-6">
          {/* Skills Breakdown */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#111827] border border-[#E2E8F0] dark:border-[#1E293B] shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-bold text-[#0F172A] dark:text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#2563EB] dark:text-[#38BDF8]" />
                <span>Recorded Skills</span>
              </h4>
              <Link to="/skills-analysis" className="text-xs text-[#2563EB] dark:text-[#38BDF8] hover:underline font-medium">
                View all ({stats?.total_skills_count || 0})
              </Link>
            </div>

            {stats && Object.keys(stats.skill_categories_breakdown).length > 0 ? (
              <div className="space-y-2.5">
                {Object.entries(stats.skill_categories_breakdown).map(([cat, count]) => (
                  <div key={cat} className="flex items-center justify-between text-xs">
                    <span className="text-[#0F172A] dark:text-slate-300 font-medium">{cat}</span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-[#1E293B] text-slate-600 dark:text-slate-400 border border-[#E2E8F0] dark:border-[#1E293B] font-medium">
                      {count} skills
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-slate-400 text-xs">
                <p>No skills recorded yet.</p>
                <Link
                  to="/profile"
                  className="text-[#2563EB] dark:text-[#38BDF8] hover:underline mt-1.5 inline-block font-semibold"
                >
                  + Add your technical skills
                </Link>
              </div>
            )}
          </div>

          {/* Recent Chronological Database Activities */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#111827] border border-[#E2E8F0] dark:border-[#1E293B] shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-bold text-[#0F172A] dark:text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#2563EB] dark:text-[#38BDF8]" />
                <span>Recent Activity</span>
              </h4>
              {stats?.recent_activities && stats.recent_activities.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAllActivities}
                  disabled={isClearingActivities}
                  className="px-2.5 py-1 text-[11px] font-semibold text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 bg-slate-100 hover:bg-rose-50 dark:bg-slate-800/80 dark:hover:bg-rose-950/40 rounded-lg border border-slate-200 dark:border-slate-700/80 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  title="Clear all recent activity history"
                >
                  {isClearingActivities ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Trash2 className="w-3 h-3" />
                  )}
                  <span>{isClearingActivities ? 'Clearing...' : 'Clear All'}</span>
                </button>
              )}
            </div>

            {stats?.recent_activities && stats.recent_activities.length > 0 ? (
              <div className="space-y-2">
                {stats.recent_activities.map((act, idx) => (
                  <div
                    key={act.id || idx}
                    className="group flex items-center justify-between gap-2.5 text-xs p-2 -mx-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition border border-transparent hover:border-slate-200/60 dark:hover:border-slate-700/50"
                  >
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                      <div className="w-2 h-2 rounded-full bg-[#2563EB] dark:bg-[#38BDF8] mt-1.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[#0F172A] dark:text-slate-200 font-medium truncate">{act.title}</p>
                        <span className="text-[10px] text-[#64748B] dark:text-slate-400">
                          {act.badge} •{' '}
                          {act.timestamp
                            ? new Date(act.timestamp).toLocaleDateString()
                            : 'Recent'}
                        </span>
                      </div>
                    </div>
                    {act.id && (
                      <button
                        type="button"
                        onClick={() => handleDeleteActivity(act.id!)}
                        disabled={deletingActivityId === act.id}
                        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 dark:text-slate-500 dark:hover:text-rose-400 p-1 rounded-lg transition cursor-pointer shrink-0 disabled:opacity-50"
                        title="Delete this activity"
                        aria-label="Delete this activity"
                      >
                        {deletingActivityId === act.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <X className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-slate-400 text-xs">
                <p>No recent activity recorded.</p>
                <span className="text-[11px] text-[#64748B] dark:text-slate-400 block mt-1">
                  Start by building a resume or taking an interview.
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
