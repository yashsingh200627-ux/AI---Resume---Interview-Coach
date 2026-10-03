import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../store';
import { logout } from '../store/authSlice';
import { setDemoModalOpen, toggleCareerChat } from '../store/uiSlice';
import { ThemeToggle } from './ThemeToggle';
import {
  Sparkles, Bot, LogOut, Settings,
  Mic, Menu, Rocket
} from 'lucide-react';

interface NavbarProps {
  onToggleSidebar?: () => void;
  showSidebarToggle?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar, showSidebarToggle = false }) => {
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#E2E8F0] dark:border-[#3b2536] bg-white/90 dark:bg-[#181117]/90 backdrop-blur-md transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Sidebar toggle (if authenticated) & Logo */}
        <div className="flex items-center gap-3">
          {showSidebarToggle && (
            <button
              onClick={onToggleSidebar}
              className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#251823] transition cursor-pointer"
              aria-label="Toggle Navigation Sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-pink-600 via-rose-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-pink-500/25 group-hover:scale-105 transition-transform duration-200">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-base sm:text-lg tracking-tight text-[#0F172A] dark:text-[#FFF5F7] flex items-center gap-1.5">
                AI Resume <span className="text-[#2563EB] dark:text-[#F472B6]">&amp;</span> Coach
              </span>
              <span className="hidden sm:block text-[11px] font-medium text-[#64748B] dark:text-[#E5CCD6] tracking-wider">
                Build Better. Prepare Smarter. Get Hired.
              </span>
            </div>
          </Link>
        </div>

        {/* Center / Right: Quick Actions + Theme Switcher */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Theme Switcher Button with Accent Selector */}
          <ThemeToggle />

          {/* Live AI Demo Mode Button */}
          <button
            onClick={() => dispatch(setDemoModalOpen(true))}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-pink-50 dark:bg-pink-950/40 border border-pink-200 dark:border-pink-800/50 text-pink-700 dark:text-pink-300 text-xs font-semibold hover:bg-pink-100 dark:hover:bg-pink-900/40 transition shadow-sm cursor-pointer"
            title="Launch Community Demo Walkthrough"
          >
            <Rocket className="w-3.5 h-3.5 text-pink-600 dark:text-pink-400 animate-bounce" />
            <span className="hidden md:inline">🚀 Live AI Demo</span>
            <span className="md:hidden">Demo</span>
          </button>

          {/* Prominent Live AI Interview button */}
          <button
            onClick={() => navigate('/interview-coach')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] dark:bg-gradient-to-r dark:from-pink-600 dark:to-rose-600 dark:hover:from-pink-500 dark:hover:to-rose-500 text-white text-xs sm:text-sm font-semibold shadow-md shadow-pink-600/25 transition hover:scale-[1.02] cursor-pointer"
          >
            <Mic className="w-4 h-4 text-white animate-pulse" />
            <span className="hidden sm:inline">🎤 Live Interview</span>
            <span className="sm:hidden">Interview</span>
          </button>

          {/* Ask AI Career Coach Floating Drawer Trigger */}
          <button
            onClick={() => dispatch(toggleCareerChat())}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-pink-200 dark:border-pink-900/50 bg-pink-50/50 dark:bg-pink-950/30 hover:bg-pink-100/70 dark:hover:bg-pink-950/50 text-slate-800 dark:text-[#FFF5F7] text-xs font-medium transition cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-pink-500 dark:text-[#FFB6C1]" />
            <span className="font-['Fredoka',sans-serif] tracking-wide text-pink-600 dark:text-[#FFB6C1] font-bold">Kuromi AI</span>
          </button>

          {/* Auth State */}
          {isAuthenticated && user ? (
            <div className="flex items-center gap-2 pl-2 border-l border-[#E2E8F0] dark:border-[#3b2536]">
              <Link
                to="/profile"
                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-[#251823] transition text-left"
                title="View Profile"
              >
                <div className="w-8 h-8 rounded-full bg-pink-50 dark:bg-pink-950/60 border border-pink-200 dark:border-pink-800/40 flex items-center justify-center text-xs font-bold text-[#2563EB] dark:text-[#F472B6]">
                  {user.full_name?.charAt(0) || 'U'}
                </div>
                <div className="hidden xl:block">
                  <div className="text-xs font-semibold text-[#0F172A] dark:text-[#FFF5F7] line-clamp-1">{user.full_name}</div>
                  <div className="text-[10px] text-[#64748B] dark:text-[#E5CCD6] line-clamp-1">{user.target_job_role || 'Candidate'}</div>
                </div>
              </Link>

              <Link
                to="/settings"
                className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-[#F472B6] hover:bg-slate-100 dark:hover:bg-[#251823] transition"
                title="Settings &amp; AI Keys"
              >
                <Settings className="w-4 h-4" />
              </Link>

              <button
                onClick={handleLogout}
                className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-[#251823] transition cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 pl-2">
              <Link
                to="/login"
                className="px-3 py-1.5 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-pink-600 dark:hover:text-pink-300 transition"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-[#251823] hover:bg-slate-800 dark:hover:bg-[#2c1c29] border border-transparent dark:border-[#3b2536] text-white text-xs sm:text-sm font-semibold shadow-sm transition"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
