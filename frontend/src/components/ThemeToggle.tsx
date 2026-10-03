import React from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import { toggleTheme, setDarkAccent, DarkAccent } from '../store/uiSlice';
import { Sun, Moon } from 'lucide-react';

const darkAccentOptions: { id: DarkAccent; name: string; bgClass: string }[] = [
  { id: 'emerald', name: 'Pinkish Cream (Default)', bgClass: 'bg-pink-400 shadow-pink-500/50' },
  { id: 'cyan', name: 'Glacier Cyan', bgClass: 'bg-cyan-400 shadow-cyan-500/50' },
  { id: 'violet', name: 'Cosmic Violet', bgClass: 'bg-indigo-400 shadow-indigo-500/50' },
  { id: 'amber', name: 'Midnight Slate', bgClass: 'bg-slate-400 shadow-slate-500/50' },
];

export const ThemeToggle: React.FC<{ className?: string; showLabel?: boolean }> = ({ 
  className = '', 
  showLabel = false 
}) => {
  const dispatch = useAppDispatch();
  const theme = useAppSelector((state) => state.ui.theme);
  const darkAccent = useAppSelector((state) => state.ui.darkAccent);
  const isDark = theme === 'dark';

  return (
    <div className={`relative inline-flex items-center gap-1.5 ${className}`}>
      {/* Light / Dark Mode Toggle Button */}
      <button
        onClick={() => dispatch(toggleTheme())}
        className={`relative inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all duration-200 cursor-pointer select-none font-medium text-xs ${
          isDark
            ? 'bg-[#251823] hover:bg-[#2c1c29] border-[#3b2536] text-[#F472B6] hover:text-white shadow-sm'
            : 'bg-white hover:bg-slate-50 border-[#E2E8F0] text-[#2563EB] hover:text-[#1D4ED8] shadow-sm hover:border-blue-300'
        }`}
        title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
        aria-label="Toggle theme mode"
      >
        <div className="relative w-4 h-4 flex items-center justify-center">
          {isDark ? (
            <Sun className="w-4 h-4 text-[#F472B6] animate-spin-slow transition-transform hover:rotate-90 duration-500" />
          ) : (
            <Moon className="w-4 h-4 text-[#2563EB] transition-transform hover:-rotate-12 duration-300" />
          )}
        </div>
        
        {showLabel && (
          <span className="text-xs font-semibold tracking-wide">
            {isDark ? 'Dark Mode' : 'Light Mode'}
          </span>
        )}
        {!showLabel && (
          <span className="hidden xl:inline text-[11px] font-semibold tracking-wide">
            {isDark ? 'Dark' : 'Light'}
          </span>
        )}
      </button>

      {/* Dark Mode Color Palette Options (Visible in Dark Mode) */}
      {isDark && (
        <div 
          className="flex items-center gap-1.5 bg-[#251823] border border-[#3b2536] rounded-xl px-2 py-1.5"
          title="Select Dark Mode Accent"
        >
          {darkAccentOptions.map((opt) => (
            <button
              key={opt.id}
              onClick={() => dispatch(setDarkAccent(opt.id))}
              title={`Dark theme color: ${opt.name}`}
              className={`w-3.5 h-3.5 rounded-full ${opt.bgClass} transition-all duration-200 cursor-pointer ${
                darkAccent === opt.id
                  ? 'ring-2 ring-white scale-125 shadow-md'
                  : 'opacity-40 hover:opacity-100 hover:scale-110'
              }`}
              aria-label={opt.name}
            />
          ))}
        </div>
      )}
    </div>
  );
};
