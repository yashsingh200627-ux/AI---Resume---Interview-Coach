import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../store';
import { setDemoModalOpen, toggleCareerChat } from '../store/uiSlice';
import {
  Sparkles, Bot, FileText, FileSearch, Target, Mic,
  Compass, Award, ArrowRight, CheckCircle2, ShieldCheck,
  TrendingUp, Users, ChevronRight, Zap
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { ToastContainer } from '../components/ToastContainer';
import { LiveDemoModal } from '../components/LiveDemoModal';
import { CareerChatModal } from '../components/CareerChatModal';

export const LandingPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const capabilities = [
    {
      title: '1. AI Resume Builder',
      desc: 'Generate tailored, ATS-compliant resumes with quantifiable achievements and industry keywords.',
      icon: FileText,
      color: 'from-blue-500/20 to-cyan-500/20 text-blue-600 dark:text-cyan-400 border-blue-500/30',
      link: '/resume-builder',
    },
    {
      title: '2. Real Resume Analyzer',
      desc: 'Upload PDF/DOCX to extract text and calculate authentic ATS, content, and keyword scores.',
      icon: FileSearch,
      color: 'from-cyan-500/20 to-blue-500/20 text-cyan-600 dark:text-cyan-300 border-cyan-500/30',
      link: '/resume-analyzer',
    },
    {
      title: '3. Real ATS Optimization',
      desc: 'Compare resumes against job descriptions to discover missing skills, keywords, and formatting flaws.',
      icon: Target,
      color: 'from-sky-500/20 to-blue-500/20 text-blue-600 dark:text-sky-400 border-sky-500/30',
      link: '/ats-analyzer',
    },
    {
      title: '4. Real-Time AI Interview Coach',
      desc: 'Simulate live Technical, HR, and Behavioral interviews with streaming dynamic questions.',
      icon: Mic,
      color: 'from-blue-600/20 to-indigo-600/20 text-blue-600 dark:text-blue-400 border-blue-600/30',
      link: '/interview-coach',
    },
    {
      title: '5. Personalized Feedback & STAR',
      desc: 'Receive immediate answer evaluation on communication, accuracy, structure, and STAR breakdown.',
      icon: Award,
      color: 'from-indigo-500/20 to-blue-500/20 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
      link: '/star-coach',
    },
    {
      title: '6. Career Guidance & Roadmaps',
      desc: 'Actionable 6-month skill development roadmaps and real-time career guidance anchored on your actual profile.',
      icon: Compass,
      color: 'from-cyan-500/20 to-sky-500/20 text-cyan-600 dark:text-cyan-400 border-cyan-500/30',
      link: '/career-roadmap',
    },
  ];

  const workflowSteps = [
    { step: '01', title: 'Build Profile', desc: 'Enter experience, education, skills, and projects into the database.' },
    { step: '02', title: 'Create Resume', desc: 'Generate tailored bullet points and download ATS-friendly PDF resumes.' },
    { step: '03', title: 'Optimize', desc: 'Audit resume against real target job descriptions with keyword alignment.' },
    { step: '04', title: 'Practice', desc: 'Engage in live dynamic AI interviews with real-time feedback & scoring.' },
    { step: '05', title: 'Improve', desc: 'Refine weak points with STAR coaching and strategic career guidance.' },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#181117] text-[#0F172A] dark:text-[#FFF5F7] flex flex-col font-sans transition-colors duration-200 selection:bg-pink-600 selection:text-white">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 lg:pt-20 lg:pb-28 border-b border-[#E2E8F0] dark:border-[#3b2536]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          {/* Tagline Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-pink-50 dark:bg-pink-950/50 border border-pink-200 dark:border-pink-800/40 text-pink-700 dark:text-pink-300 text-xs sm:text-sm font-semibold mb-6 shadow-sm">
            <Sparkles className="w-4 h-4 text-pink-600 dark:text-pink-400" />
            <span>Build Better. Prepare Smarter. Get Hired.</span>
          </div>

          <h1 className="hero-heading text-4xl sm:text-6xl lg:text-7xl font-black max-w-4xl mx-auto leading-[1.12]">
            AI Resume{' '}
            <span className="hero-gradient-text">&amp; Interview Coach</span>
          </h1>

          <p className="hero-subtitle mt-6 text-lg sm:text-xl font-medium max-w-2xl mx-auto leading-relaxed text-[#475569] dark:text-[#E5CCD6]">
            Your AI-powered career preparation partner. Create tailored resumes, audit ATS compatibility, and simulate real-time interviews with instant evaluation.
          </p>

          {/* Primary CTA Buttons */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/resume-builder"
              className="px-6 py-3.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] dark:bg-gradient-to-r dark:from-pink-600 dark:to-rose-600 dark:hover:from-pink-500 dark:hover:to-rose-500 text-white font-bold text-sm sm:text-base shadow-lg shadow-pink-600/25 transition hover:scale-105 flex items-center gap-2"
            >
              <FileText className="w-5 h-5 text-white" />
              <span>Create My Resume</span>
            </Link>

            <Link
              to="/interview-coach"
              className="hero-practice-btn px-6 py-3.5 rounded-xl bg-white hover:bg-slate-100 dark:bg-[#251823] dark:hover:bg-[#2c1c29] border border-slate-200 dark:border-[#3b2536] text-[#0F172A] dark:text-[#FFF5F7] font-bold text-sm sm:text-base transition hover:scale-105 flex items-center gap-2 shadow-sm"
            >
              <Mic className="w-5 h-5 text-[#2563EB] dark:text-[#F472B6] shrink-0" />
              <span className="hero-practice-text">Practice Interview</span>
            </Link>

            <button
              onClick={() => dispatch(setDemoModalOpen(true))}
              className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 border border-pink-500/30 text-white font-bold text-sm sm:text-base transition hover:scale-105 flex items-center gap-2 cursor-pointer shadow-md shadow-pink-600/20"
            >
              <Zap className="w-5 h-5 text-white" />
              <span>🚀 Live AI Demo</span>
            </button>
          </div>

          {/* Trust points */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs sm:text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-pink-600 dark:text-pink-400 shrink-0" />
              <span className="hero-trust-text">No Hard-Coded Demo Data</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-pink-600 dark:text-pink-400 shrink-0" />
              <span className="hero-trust-text">Real-Time LLM Processing</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-pink-600 dark:text-pink-400 shrink-0" />
              <span className="hero-trust-text">ReportLab PDF Resume Engine</span>
            </div>
          </div>
        </div>
      </section>

      {/* Prominent Live AI Interview Highlight */}
      <section className="py-12 bg-gradient-to-b from-blue-50/40 via-[#F8FAFC] to-[#F8FAFC] dark:from-[#181117] dark:via-[#1e131b] dark:to-[#181117] border-b border-[#E2E8F0] dark:border-[#3b2536]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#251823] border border-[#E2E8F0] dark:border-[#3b2536] shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center md:text-left">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-cyan-300 text-xs font-bold border border-blue-200 dark:border-blue-800/40">
                <Mic className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400 animate-pulse" />
                <span>SIGNATURE CAPABILITY</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#0F172A] dark:text-white">
                🎤 Live Real-Time AI Interviewer
              </h2>
              <p className="text-sm text-[#475569] dark:text-[#CBD5E1] max-w-xl">
                Experience a genuine interactive interview with live question generation, conversational follow-ups, and instant multidimensional scoring across Content, Technical Accuracy, and Structure.
              </p>
            </div>

            <button
              onClick={() => navigate('/interview-coach')}
              className="px-6 py-3.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] dark:bg-[#3B82F6] dark:hover:bg-[#2563EB] text-white font-bold text-sm sm:text-base shadow-lg shadow-blue-600/25 transition hover:scale-105 shrink-0 flex items-center gap-2 cursor-pointer"
            >
              <span>Start Live Interview</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Six Platform Capabilities */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="text-xs font-bold uppercase tracking-wider text-[#2563EB] dark:text-[#38BDF8]">
            Platform Capabilities
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0F172A] dark:text-white mt-2">
            Six Connected Capabilities Built for Career Success
          </h2>
          <p className="text-sm sm:text-base text-[#64748B] dark:text-slate-400 mt-3">
            Every feature works directly with your real profile background, uploaded documents, and live AI processing.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {capabilities.map((c, i) => {
            const Icon = c.icon;
            return (
              <div
                key={i}
                className="p-6 rounded-2xl bg-white dark:bg-[#111827] border border-[#E2E8F0] dark:border-[#1E293B] hover:border-blue-500/40 dark:hover:border-cyan-500/40 hover:shadow-lg transition-all duration-200 group flex flex-col justify-between shadow-sm"
              >
                <div>
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br border flex items-center justify-center mb-5 ${c.color} group-hover:scale-110 transition`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-[#0F172A] dark:text-white mb-2">{c.title}</h3>
                  <p className="text-sm text-[#64748B] dark:text-slate-400 leading-relaxed">{c.desc}</p>
                </div>

                <Link
                  to={c.link}
                  className="mt-6 inline-flex items-center gap-1.5 text-xs font-semibold text-[#2563EB] dark:text-[#38BDF8] hover:text-blue-700 dark:hover:text-cyan-300 group-hover:translate-x-1 transition"
                >
                  <span>Explore Feature</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      {/* How It Works Workflow */}
      <section className="py-20 bg-slate-100/50 dark:bg-[#181117] border-t border-b border-[#E2E8F0] dark:border-[#3b2536]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-[#2563EB] dark:text-[#F472B6]">
              Structured Methodology
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0F172A] dark:text-[#FFF5F7] mt-2">
              How It Works: Step-by-Step
            </h2>
            <p className="text-sm sm:text-base text-[#64748B] dark:text-[#E5CCD6] mt-3">
              Follow the proven workflow to transform your qualifications into interviews and offers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {workflowSteps.map((ws, i) => (
              <div
                key={i}
                className="p-5 rounded-2xl bg-white dark:bg-[#251823] border border-[#E2E8F0] dark:border-[#3b2536] relative flex flex-col justify-between group hover:border-pink-500/40 dark:hover:border-pink-500/40 hover:shadow-md transition"
              >
                <div>
                  <span className="text-2xl font-black text-pink-500/30 dark:text-pink-400/40 group-hover:text-pink-600 dark:group-hover:text-[#F472B6] transition">
                    {ws.step}
                  </span>
                  <h4 className="text-base font-bold text-[#0F172A] dark:text-[#FFF5F7] mt-2 mb-1.5">{ws.title}</h4>
                  <p className="text-xs text-[#64748B] dark:text-[#E5CCD6] leading-relaxed">{ws.desc}</p>
                </div>
                {i < 4 && (
                  <div className="hidden md:block absolute -right-2 top-1/2 -translate-y-1/2 z-10 text-slate-400 dark:text-slate-600">
                    →
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-8 border-t border-[#E2E8F0] dark:border-[#3b2536] bg-white dark:bg-[#181117] text-xs text-[#64748B] text-center transition-colors">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-pink-600 dark:text-[#F472B6]" />
            <span className="font-semibold text-[#0F172A] dark:text-[#FFF5F7]">AI Resume &amp; Interview Coach</span>
            <span>—</span>
            <span>Build Better. Prepare Smarter. Get Hired.</span>
          </div>
          <div>
            Built with React, FastAPI, SQLAlchemy &amp; Real-Time AI.
          </div>
        </div>
      </footer>

      <ToastContainer />
      <LiveDemoModal />
      <CareerChatModal />
    </div>
  );
};
