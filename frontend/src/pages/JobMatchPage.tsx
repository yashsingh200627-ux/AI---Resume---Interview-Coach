import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppSelector } from '../store';
import { jobMatchApi } from '../services/api';
import { JobMatch } from '../types';
import { ScoreGauge } from '../components/ScoreGauge';
import {
  CheckSquare, Target, CheckCircle2, XCircle, ArrowRight,
  Loader2, Briefcase, Plus
} from 'lucide-react';

export const JobMatchPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const [matches, setMatches] = useState<JobMatch[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<JobMatch | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = async () => {
    setIsLoading(true);
    try {
      const res = await jobMatchApi.getAll();
      setMatches(res.data);
      if (res.data.length > 0) setSelectedMatch(res.data[0]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const getDisplayJobTitle = (title?: string) => {
    if (title && title.trim() && !['unknown', 'unknown position'].includes(title.trim().toLowerCase())) {
      return title;
    }
    return user?.target_job_role || 'Target Software Role';
  };

  const getDisplayCompany = (company?: string) => {
    if (company && company.trim() && !['direct role', 'unknown'].includes(company.trim().toLowerCase())) {
      return company;
    }
    return 'Target Opportunity';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Job Match Engine
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real ATS alignment records calculated between your candidate profile and target job descriptions.
          </p>
        </div>

        <Link
          to="/ats-analyzer"
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-semibold text-xs sm:text-sm shadow-md shadow-pink-600/20 transition flex items-center gap-1.5 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Job Comparison</span>
        </Link>
      </div>

      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
          <p className="text-sm">Fetching genuine job match history from database...</p>
        </div>
      ) : matches.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Matches List */}
          <div className="lg:col-span-5 space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Evaluated Positions ({matches.length})
            </h3>
            {matches.map((m) => (
              <div
                key={m.id}
                onClick={() => setSelectedMatch(m)}
                className={`p-4 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                  selectedMatch?.id === m.id
                    ? 'bg-slate-900 border-pink-500/50 shadow-lg shadow-pink-500/10'
                    : 'bg-slate-900/50 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-white truncate">{getDisplayJobTitle(m.job_title)}</h4>
                  <p className="text-xs text-pink-400 dark:text-[#F472B6] mt-0.5 truncate">{getDisplayCompany(m.company)}</p>
                  <span className="text-[10px] text-slate-500 block mt-1">
                    {m.created_at ? new Date(m.created_at).toLocaleDateString() : 'Recent'}
                  </span>
                </div>
                <div className="shrink-0 text-right">
                  <span className="text-base font-black text-emerald-400">{m.overall_match_score}%</span>
                  <span className="text-[10px] text-slate-500 block">Overall Match</span>
                </div>
              </div>
            ))}
          </div>

          {/* Selected Match Details */}
          <div className="lg:col-span-7">
            {selectedMatch && (
              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-6">
                <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-800">
                  <div>
                    <h3 className="text-xl font-bold text-white">{getDisplayJobTitle(selectedMatch.job_title)}</h3>
                    <p className="text-xs text-pink-400 dark:text-[#F472B6] mt-0.5">{getDisplayCompany(selectedMatch.company)}</p>
                  </div>
                  <Link
                    to="/ats-analyzer"
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition"
                  >
                    Re-run Scan
                  </Link>
                </div>

                {/* Score Gauges */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <ScoreGauge score={selectedMatch.overall_match_score} size="sm" showLabel={false} />
                    <span className="text-xs font-bold text-white mt-1 block">Overall</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <ScoreGauge score={selectedMatch.ats_compatibility_score} size="sm" showLabel={false} />
                    <span className="text-xs font-bold text-white mt-1 block">ATS Read</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <ScoreGauge score={selectedMatch.skill_match_score} size="sm" showLabel={false} />
                    <span className="text-xs font-bold text-white mt-1 block">Skill Match</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <ScoreGauge score={selectedMatch.experience_match_score} size="sm" showLabel={false} />
                    <span className="text-xs font-bold text-white mt-1 block">Experience</span>
                  </div>
                </div>

                {/* Skills Comparison */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Matched Skills ({selectedMatch.matched_skills.length})</span>
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedMatch.matched_skills.map((s, i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 text-xs">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Missing Skills ({selectedMatch.missing_skills.length})</span>
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedMatch.missing_skills.map((s, i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-rose-950/80 border border-rose-500/30 text-rose-300 text-xs">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Alignment Summary */}
                {selectedMatch.alignment_summary && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                      Alignment Analysis
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                      {selectedMatch.alignment_summary}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="p-12 rounded-2xl bg-slate-900/30 border border-dashed border-slate-800 text-center text-slate-500">
          <CheckSquare className="w-12 h-12 mx-auto text-slate-600 mb-3" />
          <p className="text-sm font-medium text-slate-400">No Job Matches Yet</p>
          <p className="text-xs mt-1">
            Compare your resume with a job posting in the ATS Optimizer to see real match scores here.
          </p>
          <Link
            to="/ats-analyzer"
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-semibold text-xs shadow-md shadow-pink-600/20"
          >
            <span>Run ATS Match</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
};
