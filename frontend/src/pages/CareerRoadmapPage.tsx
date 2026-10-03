import React, { useState } from 'react';
import { useAppSelector, useAppDispatch } from '../store';
import { addToast } from '../store/uiSlice';
import { careerApi } from '../services/api';
import { ScoreGauge } from '../components/ScoreGauge';
import {
  Map, Sparkles, Target, Clock, CheckCircle2, ArrowRight,
  Loader2, Award, Calendar, BookOpen
} from 'lucide-react';

export const CareerRoadmapPage: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();

  const [targetRole, setTargetRole] = useState(user?.target_job_role || 'Staff Software Engineer');
  const [timelineMonths, setTimelineMonths] = useState(6);
  const [isLoading, setIsLoading] = useState(false);
  const [roadmap, setRoadmap] = useState<any>(null);

  const handleGenerateRoadmap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetRole.trim()) return;

    setIsLoading(true);
    try {
      const res = await careerApi.getRoadmap({
        target_role: targetRole.trim(),
        timeline_months: Number(timelineMonths),
      });
      setRoadmap(res.data);
      dispatch(addToast({ type: 'success', message: 'Phased Career Roadmap generated!' }));
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to generate roadmap. Verify AI configuration.';
      dispatch(addToast({ type: 'error', message: msg }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Strategic Career Transition Roadmap
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Generate an actionable, phased transition pathway from your current background to your desired senior or specialized role.
        </p>
      </div>

      {/* Control Banner */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
        <form onSubmit={handleGenerateRoadmap} className="flex flex-col sm:flex-row items-end gap-4">
          <div className="flex-1 w-full">
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Target Destination Role</label>
            <input
              type="text"
              required
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder="e.g. Senior Cloud Architect, VP of Engineering, Lead AI Engineer"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="w-full sm:w-48">
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Transition Horizon</label>
            <select
              value={timelineMonths}
              onChange={(e) => setTimelineMonths(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500"
            >
              <option value={3}>3 Months (Accelerated)</option>
              <option value={6}>6 Months (Standard)</option>
              <option value={12}>12 Months (Comprehensive)</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={isLoading || !targetRole.trim()}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs sm:text-sm shadow-md shadow-indigo-600/30 transition flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Synthesizing Strategy...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Strategy Roadmap</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Roadmap Output */}
      {roadmap ? (
        <div className="space-y-6">
          {/* Overview Card */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2">
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                Career Transition Blueprint
              </span>
              <h2 className="text-2xl font-bold text-white">{roadmap.target_role}</h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
                {roadmap.summary}
              </p>
            </div>

            {roadmap.readiness_score && (
              <div className="shrink-0 flex items-center gap-3">
                <ScoreGauge score={roadmap.readiness_score} size="md" label="Current Readiness" />
              </div>
            )}
          </div>

          {/* Key Skill Gaps */}
          {roadmap.key_skill_gaps && roadmap.key_skill_gaps.length > 0 && (
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Target className="w-4 h-4 text-indigo-400" />
                <span>Key Skill Gaps to Bridge</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {roadmap.key_skill_gaps.map((gap: any, i: number) => (
                  <div key={i} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-100">{gap.skill_name}</span>
                      <span
                        className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                          gap.importance === 'Critical'
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                            : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                        }`}
                      >
                        {gap.importance}
                      </span>
                    </div>
                    <p className="text-slate-400">{gap.recommended_action}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Phased Timeline */}
          {roadmap.phases && roadmap.phases.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-400" />
                <span>Phased Action Roadmap</span>
              </h3>

              <div className="space-y-4">
                {roadmap.phases.map((phase: any, idx: number) => (
                  <div key={idx} className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-base font-bold text-white flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 flex items-center justify-center text-xs font-bold">
                          {phase.phase_number || idx + 1}
                        </span>
                        <span>{phase.title}</span>
                      </h4>
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-950 border border-slate-800 text-slate-400">
                        {phase.duration}
                      </span>
                    </div>

                    {/* Goals */}
                    {phase.goals && (
                      <div className="space-y-1 pt-1">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                          Phase Goals:
                        </span>
                        <div className="space-y-1">
                          {phase.goals.map((g: string, i: number) => (
                            <div key={i} className="text-xs text-slate-300 flex items-start gap-2">
                              <span className="text-indigo-400 font-bold">•</span>
                              <span>{g}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action items */}
                    {phase.action_items && (
                      <div className="space-y-1.5 pt-2 border-t border-slate-800/60">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                          Action Items:
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {phase.action_items.map((act: string, i: number) => (
                            <div key={i} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 text-xs text-slate-200 flex items-start gap-2">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                              <span>{act}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Certifications & Routine */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {roadmap.certifications_recommended && roadmap.certifications_recommended.length > 0 && (
              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-400" />
                  <span>Recommended Industry Certifications</span>
                </h4>
                <div className="space-y-2">
                  {roadmap.certifications_recommended.map((c: string, i: number) => (
                    <div key={i} className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 flex items-center gap-2">
                      <span className="text-amber-400 font-bold">★</span>
                      <span>{c}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {roadmap.weekly_routine_suggestion && (
              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-400" />
                  <span>Suggested Weekly Routine</span>
                </h4>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {roadmap.weekly_routine_suggestion}
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="p-12 rounded-2xl bg-slate-900/30 border border-dashed border-slate-800 text-center text-slate-500">
          <Map className="w-12 h-12 mx-auto text-slate-600 mb-3" />
          <p className="text-sm font-medium text-slate-400">No Roadmap Generated</p>
          <p className="text-xs mt-1">Specify your target role and timeline above to create a custom transition plan.</p>
        </div>
      )}
    </div>
  );
};
