import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../store';
import { addToast } from '../store/uiSlice';
import { interviewsApi } from '../services/api';
import { InterviewSession } from '../types';
import {
  Mic, Sparkles, Clock, Target, Play, History,
  Award, Loader2, CheckCircle2, ChevronRight, ShieldCheck
} from 'lucide-react';

export const InterviewCoachPage: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const [targetRole, setTargetRole] = useState(user?.target_job_role || 'Senior Full Stack Developer');
  const [experienceLevel, setExperienceLevel] = useState(user?.experience_level || 'Mid-Level');
  const [interviewType, setInterviewType] = useState('Technical');
  const [difficulty, setDifficulty] = useState('Intermediate');
  const [totalQuestions, setTotalQuestions] = useState(5);
  const [isStarting, setIsStarting] = useState(false);
  const [recentSessions, setRecentSessions] = useState<InterviewSession[]>([]);

  useEffect(() => {
    interviewsApi.getHistory().then((res) => {
      setRecentSessions(res.data);
    }).catch(() => {});
  }, []);

  const handleStartInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetRole.trim()) return;

    setIsStarting(true);
    try {
      const res = await interviewsApi.start({
        target_role: targetRole.trim(),
        experience_level: experienceLevel,
        interview_type: interviewType,
        difficulty: difficulty,
        total_questions: Number(totalQuestions),
      });

      dispatch(
        addToast({
          type: 'success',
          message: 'Interview session created! Opening live room...',
        })
      );
      navigate(`/interview/session/${res.data.session_id}`);
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to start interview session. Please try again.';
      dispatch(addToast({ type: 'error', message: msg }));
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/30 mb-3">
          <Mic className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
          <span>SIGNATURE DEMONSTRATION FEATURE</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Real-Time AI Interview Coach
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Prepare for real interviews with adaptive AI questions, dynamic follow-ups, and instant multidimensional evaluation.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Setup Form */}
        <div className="lg:col-span-7 bg-slate-900/60 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Target className="w-5 h-5 text-indigo-400" />
            <span>Configure Interview Simulation</span>
          </h2>

          <form onSubmit={handleStartInterview} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Target Job Role *</label>
              <input
                type="text"
                required
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g. Senior Backend Engineer, React Developer, Product Manager"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Interview Mode / Type</label>
                <select
                  value={interviewType}
                  onChange={(e) => setInterviewType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="Technical">Technical (Coding, System, Architecture)</option>
                  <option value="Behavioral">Behavioral (STAR Method &amp; Culture)</option>
                  <option value="HR">HR &amp; Fit Screening</option>
                  <option value="Situational">Situational (Problem Solving)</option>
                  <option value="Role-specific">Role-specific Deep Dive</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Difficulty Level</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="Entry">Entry Level (Foundational concepts)</option>
                  <option value="Intermediate">Intermediate (Real-world trade-offs)</option>
                  <option value="Advanced">Advanced (Complex systems &amp; edge cases)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Experience Level</label>
                <select
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="Junior">Junior (1-2 yrs)</option>
                  <option value="Mid-Level">Mid-Level (3-5 yrs)</option>
                  <option value="Senior">Senior (5-8 yrs)</option>
                  <option value="Staff / Lead">Staff / Lead (8+ yrs)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Question Count</label>
                <select
                  value={totalQuestions}
                  onChange={(e) => setTotalQuestions(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value={3}>3 Questions (Quick Sprint)</option>
                  <option value={5}>5 Questions (Standard Session)</option>
                  <option value={8}>8 Questions (Comprehensive)</option>
                  <option value={10}>10 Questions (Full Round)</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={isStarting}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 disabled:opacity-50 text-white font-bold text-sm sm:text-base shadow-xl shadow-indigo-600/30 transition hover:scale-[1.02] flex items-center justify-center gap-2.5 cursor-pointer mt-2"
            >
              {isStarting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>AI Interviewer Preparing Question 1...</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 text-indigo-200 fill-indigo-200" />
                  <span>Start Live Interview Session</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right: How It Works & Recent Sessions */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>Real-Time Interaction Flow</span>
            </h3>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold shrink-0 text-[11px]">1</span>
                <span>AI generates opening question tailored to your role.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold shrink-0 text-[11px]">2</span>
                <span>You type your answer in the real-time chat room.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold shrink-0 text-[11px]">3</span>
                <span>AI evaluates content, technical accuracy, clarity, and STAR structure.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold shrink-0 text-[11px]">4</span>
                <span>AI asks follow-up probes or advances to the next question.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold shrink-0 text-[11px]">5</span>
                <span>End interview to receive a full executive performance report.</span>
              </div>
            </div>
          </div>

          {/* Past Sessions shortcut */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <History className="w-4 h-4 text-indigo-400" />
                <span>Recent Completed Sessions</span>
              </h3>
              <button
                onClick={() => navigate('/interview/history')}
                className="text-xs text-indigo-400 hover:underline"
              >
                View all ({recentSessions.length})
              </button>
            </div>

            {recentSessions.length > 0 ? (
              <div className="space-y-2">
                {recentSessions.slice(0, 3).map((s) => (
                  <div
                    key={s.id}
                    onClick={() => navigate(`/interview/session/${s.id}`)}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-indigo-500/40 transition flex items-center justify-between cursor-pointer"
                  >
                    <div>
                      <span className="text-xs font-bold text-white block">{s.target_role}</span>
                      <span className="text-[10px] text-slate-400">{s.interview_type} • {s.difficulty}</span>
                    </div>
                    <div className="text-right">
                      {s.overall_score ? (
                        <span className="text-xs font-black text-emerald-400">{s.overall_score}%</span>
                      ) : (
                        <span className="text-[10px] text-amber-400">{s.status}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 text-center py-3">No previous interview sessions recorded.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
