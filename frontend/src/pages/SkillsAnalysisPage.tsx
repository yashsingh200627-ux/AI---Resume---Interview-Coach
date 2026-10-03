import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { profileApi } from '../services/api';
import { Skill } from '../types';
import {
  BarChart3, Code, Wrench, Users, Plus, CheckCircle2,
  Sparkles, Loader2, Target
} from 'lucide-react';

export const SkillsAnalysisPage: React.FC = () => {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    profileApi.getFullProfile().then((res) => {
      setSkills(res.data.skills || []);
    }).catch(() => {}).finally(() => setIsLoading(false));
  }, []);

  const technical = skills.filter((s) => s.category === 'Technical');
  const tools = skills.filter((s) => s.category === 'Tools' || s.category === 'Technologies');
  const soft = skills.filter((s) => s.category === 'Soft Skills');

  const getProficiencyColor = (p: string) => {
    switch (p.toLowerCase()) {
      case 'expert':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'advanced':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'intermediate':
        return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';
      case 'beginner':
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Skills Profile &amp; Inventory Analysis
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Detailed breakdown of your technical competencies, tools, and professional attributes stored in your profile.
          </p>
        </div>

        <Link
          to="/profile"
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs sm:text-sm shadow-md shadow-indigo-600/20 transition flex items-center gap-1.5 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add More Skills</span>
        </Link>
      </div>

      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          <p className="text-sm">Loading skills inventory...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                <Code className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Technical Skills</span>
                <span className="text-2xl font-black text-white">{technical.length}</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <Wrench className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Tools &amp; Frameworks</span>
                <span className="text-2xl font-black text-white">{tools.length}</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Soft Skills</span>
                <span className="text-2xl font-black text-white">{soft.length}</span>
              </div>
            </div>
          </div>

          {/* Section: Technical Skills */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Code className="w-4 h-4 text-blue-400" />
              <span>Technical Skills ({technical.length})</span>
            </h3>
            {technical.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {technical.map((s) => (
                  <div key={s.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-200">{s.name}</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getProficiencyColor(s.proficiency)}`}>
                      {s.proficiency}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">No technical skills added yet.</p>
            )}
          </div>

          {/* Section: Tools & Frameworks */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Wrench className="w-4 h-4 text-amber-400" />
              <span>Tools &amp; Frameworks ({tools.length})</span>
            </h3>
            {tools.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {tools.map((s) => (
                  <div key={s.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-200">{s.name}</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getProficiencyColor(s.proficiency)}`}>
                      {s.proficiency}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">No tools or frameworks added yet.</p>
            )}
          </div>

          {/* Section: Soft Skills */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-400" />
              <span>Soft Skills &amp; Leadership ({soft.length})</span>
            </h3>
            {soft.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {soft.map((s) => (
                  <div key={s.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-200">{s.name}</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getProficiencyColor(s.proficiency)}`}>
                      {s.proficiency}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">No soft skills added yet.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
