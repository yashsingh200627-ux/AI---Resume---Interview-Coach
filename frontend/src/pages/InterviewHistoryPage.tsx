import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { interviewsApi } from '../services/api';
import { InterviewSession } from '../types';
import { ScoreGauge } from '../components/ScoreGauge';
import {
  History, Award, CheckCircle2, AlertTriangle, ArrowRight,
  Loader2, Mic, Clock, FileText, ChevronRight, Sparkles
} from 'lucide-react';

export const InterviewHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<InterviewSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<InterviewSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      const res = await interviewsApi.getHistory();
      setSessions(res.data);
      if (res.data.length > 0) {
        // Fetch detailed record for the first session
        const detailRes = await interviewsApi.getSession(res.data[0].id);
        setSelectedSession(detailRes.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectSession = async (session: InterviewSession) => {
    try {
      const detailRes = await interviewsApi.getSession(session.id);
      setSelectedSession(detailRes.data);
    } catch (e) {
      setSelectedSession(session);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Interview History &amp; Performance Reports
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Review detailed executive evaluations, dimensional scoring, and practice recommendations from completed interview simulations.
          </p>
        </div>

        <button
          onClick={() => navigate('/interview-coach')}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs sm:text-sm shadow-md shadow-indigo-600/20 transition flex items-center gap-1.5 shrink-0 cursor-pointer"
        >
          <Mic className="w-4 h-4" />
          <span>Practice New Session</span>
        </button>
      </div>

      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          <p className="text-sm">Loading interview transcripts and reports from database...</p>
        </div>
      ) : sessions.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Session List */}
          <div className="lg:col-span-4 space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Recorded Sessions ({sessions.length})
            </h3>
            {sessions.map((s) => (
              <div
                key={s.id}
                onClick={() => handleSelectSession(s)}
                className={`p-4 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                  selectedSession?.id === s.id
                    ? 'bg-slate-900 border-indigo-500/60 shadow-lg shadow-indigo-500/10'
                    : 'bg-slate-900/50 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-white truncate">{s.target_role}</h4>
                  <p className="text-xs text-indigo-400 mt-0.5">{s.interview_type} • {s.difficulty}</p>
                  <span className="text-[10px] text-slate-500 block mt-1">
                    {s.created_at ? new Date(s.created_at).toLocaleDateString() : 'Recent'}
                  </span>
                </div>
                <div className="shrink-0 text-right">
                  {s.overall_score ? (
                    <span className="text-base font-black text-emerald-400">{s.overall_score}%</span>
                  ) : (
                    <span className="text-[11px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold">
                      {s.status}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Right Detailed Final Report */}
          <div className="lg:col-span-8">
            {selectedSession && (
              <div className="p-6 sm:p-8 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                      Performance Evaluation Report
                    </span>
                    <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">
                      {selectedSession.target_role}
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {selectedSession.interview_type} Interview ({selectedSession.difficulty} Difficulty)
                    </p>
                  </div>

                  {selectedSession.overall_score && (
                    <div className="shrink-0 flex items-center gap-3">
                      <ScoreGauge score={selectedSession.overall_score} size="md" label="Final Rating" />
                    </div>
                  )}
                </div>

                {/* Score Breakdown Cards */}
                {selectedSession.content_score !== null && selectedSession.content_score !== undefined && (
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-lg font-black text-indigo-400 block">{selectedSession.content_score}%</span>
                      <span className="text-[11px] text-slate-400">Content</span>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-lg font-black text-indigo-400 block">{selectedSession.technical_score}%</span>
                      <span className="text-[11px] text-slate-400">Technical</span>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-lg font-black text-indigo-400 block">{selectedSession.communication_score}%</span>
                      <span className="text-[11px] text-slate-400">Communication</span>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-lg font-black text-indigo-400 block">{selectedSession.structure_score}%</span>
                      <span className="text-[11px] text-slate-400">Structure</span>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 col-span-2 sm:col-span-1">
                      <span className="text-lg font-black text-indigo-400 block">{selectedSession.relevance_score}%</span>
                      <span className="text-[11px] text-slate-400">Relevance</span>
                    </div>
                  </div>
                )}

                {/* Executive Summary Narrative */}
                {selectedSession.final_report && (
                  <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Executive Committee Summary</span>
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                      {selectedSession.final_report}
                    </p>
                  </div>
                )}

                {/* Strong Areas & Improvements */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {selectedSession.summary_strengths?.length > 0 && (
                    <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                      <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Demonstrated Strengths</span>
                      </h4>
                      <div className="space-y-1.5">
                        {selectedSession.summary_strengths.map((st, i) => (
                          <div key={i} className="text-xs text-slate-300 flex items-start gap-2">
                            <span className="text-emerald-400 font-bold">•</span>
                            <span>{st}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedSession.summary_improvements?.length > 0 && (
                    <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                      <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Recommended Improvements</span>
                      </h4>
                      <div className="space-y-1.5">
                        {selectedSession.summary_improvements.map((im, i) => (
                          <div key={i} className="text-xs text-slate-300 flex items-start gap-2">
                            <span className="text-amber-400 font-bold">•</span>
                            <span>{im}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Recommended Practice Questions */}
                {selectedSession.recommended_practice?.length > 0 && (
                  <div className="p-5 rounded-xl bg-indigo-950/30 border border-indigo-500/20 space-y-2">
                    <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
                      Targeted Practice Questions for Next Round:
                    </h4>
                    <div className="space-y-1.5">
                      {selectedSession.recommended_practice.map((q, i) => (
                        <div key={i} className="text-xs text-slate-200 flex items-start gap-2">
                          <span className="text-indigo-400 font-bold">{i + 1}.</span>
                          <span>{q}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Complete Question & Answer Transcript */}
                {selectedSession.questions && selectedSession.questions.length > 0 && (
                  <div className="space-y-4 pt-4 border-t border-slate-800">
                    <h3 className="text-sm font-bold text-white">Full Session QA Transcript</h3>
                    <div className="space-y-4">
                      {selectedSession.questions.map((q) => (
                        <div key={q.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2.5 text-xs">
                          <div className="font-bold text-indigo-300">
                            Q{q.question_number}: {q.question_text}
                          </div>
                          {q.answer ? (
                            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 whitespace-pre-wrap">
                              <span className="text-[10px] text-slate-500 block mb-1">Candidate Answer:</span>
                              {q.answer.answer_text}
                            </div>
                          ) : (
                            <div className="text-slate-500 italic">No answer recorded</div>
                          )}
                          {q.feedback && (
                            <div className="p-2.5 rounded-lg bg-indigo-950/40 text-slate-300">
                              <strong className="text-indigo-300">Feedback ({q.feedback.overall_score}/10):</strong>{' '}
                              {q.feedback.feedback_text}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="p-12 rounded-2xl bg-slate-900/30 border border-dashed border-slate-800 text-center text-slate-500">
          <History className="w-12 h-12 mx-auto text-slate-600 mb-3" />
          <p className="text-sm font-medium text-slate-400">No Interview Sessions Completed Yet</p>
          <p className="text-xs mt-1">Start a live AI interview practice to generate your first comprehensive evaluation report.</p>
          <button
            onClick={() => navigate('/interview-coach')}
            className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold text-xs shadow-md shadow-indigo-600/20"
          >
            Launch Interview Simulator
          </button>
        </div>
      )}
    </div>
  );
};
