import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, UserCircle, FileText, FileSearch, Target,
  Briefcase, CheckSquare, Mic, History, Award, Compass,
  Map, BarChart3, Settings, Sparkles, X
} from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  name: string;
  to: string;
  icon: React.ElementType;
  badge?: string;
  highlight?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const navSections: { title: string; items: NavItem[] }[] = [
    {
      title: 'OVERVIEW',
      items: [
        { name: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
        { name: 'My Profile', to: '/profile', icon: UserCircle },
      ],
    },
    {
      title: 'RESUME & ATS',
      items: [
        { name: 'Resume Builder', to: '/resume-builder', icon: FileText },
        { name: 'Resume Analyzer', to: '/resume-analyzer', icon: FileSearch },
        { name: 'ATS Optimizer', to: '/ats-analyzer', icon: Target },
        { name: 'Job Description Analyzer', to: '/job-analyzer', icon: Briefcase },
        { name: 'Job Match Engine', to: '/job-match', icon: CheckSquare },
      ],
    },
    {
      title: 'INTERVIEW COACHING',
      items: [
        { name: 'AI Interview Coach', to: '/interview-coach', icon: Mic, badge: 'Live', highlight: true },
        { name: 'Interview History & Reports', to: '/interview/history', icon: History },
        { name: 'STAR Method Coach', to: '/star-coach', icon: Award },
      ],
    },
    {
      title: 'CAREER STRATEGY',
      items: [
        { name: 'Career Coach', to: '/career-coach', icon: Compass },
        { name: 'Career Roadmap', to: '/career-roadmap', icon: Map },
        { name: 'Skills Gap Analysis', to: '/skills-analysis', icon: BarChart3 },
      ],
    },
    {
      title: 'SYSTEM',
      items: [
        { name: 'Settings & AI Keys', to: '/settings', icon: Settings },
      ],
    },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-16 bottom-0 left-0 z-40 w-64 border-r border-[#E2E8F0] dark:border-[#3b2536] bg-white/95 dark:bg-[#181117]/95 backdrop-blur-md flex flex-col transition-all duration-300 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-3 border-b border-[#E2E8F0] dark:border-[#3b2536] lg:hidden">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Navigation Menu</span>
          <button onClick={onClose} className="p-1 rounded text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {navSections.map((section) => (
            <div key={section.title}>
              <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-pink-300/60 mb-2">
                {section.title}
              </div>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => onClose()}
                      className={({ isActive }) =>
                        `flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition group ${
                          isActive
                            ? 'bg-[#2563EB] hover:bg-[#1D4ED8] dark:bg-gradient-to-r dark:from-pink-600 dark:to-rose-600 text-white shadow-md shadow-pink-600/20 font-semibold'
                            : item.highlight
                            ? 'text-[#2563EB] dark:text-[#F472B6] hover:bg-blue-50 dark:hover:bg-pink-950/40 border border-blue-200 dark:border-pink-800/40'
                            : 'text-slate-600 dark:text-[#E5CCD6] hover:bg-slate-100 dark:hover:bg-[#251823] hover:text-[#0F172A] dark:hover:text-[#FFF5F7]'
                        }`
                      }
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4 shrink-0 transition group-hover:scale-110" />
                        <span>{item.name}</span>
                      </div>
                      {item.badge && (
                        <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-pink-500/15 text-pink-700 dark:text-pink-300 border border-pink-500/30">
                          {item.badge}
                        </span>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Sidebar footer badge & Theme Switcher */}
        <div className="p-3 border-t border-[#E2E8F0] dark:border-[#3b2536] space-y-2">
          {/* Quick theme switcher for user */}
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-medium text-[#64748B] dark:text-[#E5CCD6]">Theme</span>
            <ThemeToggle showLabel={true} />
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#251823] border border-[#E2E8F0] dark:border-[#3b2536] flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-pink-100 dark:bg-pink-950/80 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-pink-600 dark:text-[#F472B6]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-[#0F172A] dark:text-[#FFF5F7] truncate">AI Engine Active</div>
              <div className="text-[10px] text-[#64748B] dark:text-[#F472B6] truncate">Kuromi Intelligence Ready</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
