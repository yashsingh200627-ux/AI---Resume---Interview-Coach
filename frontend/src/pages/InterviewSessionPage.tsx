import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../store';
import { addToast } from '../store/uiSlice';
import { interviewsApi } from '../services/api';
import { InterviewSession, InterviewQuestion } from '../types';
import {
  Mic, Bot, User, Send, Clock, Award, CheckCircle2,
  AlertTriangle, ArrowRight, Loader2, StopCircle, RefreshCw, Sparkles
} from 'lucide-react';

export const InterviewSessionPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const [session, setSession] = useState<InterviewSession | null>(null);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id) {
      loadSession();
    }
  }, [id]);

  useEffect(() => {
    // Session timer
    const interval = setInterval(() => {
      setSecondsElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [session?.questions, isSubmitting]);

  const loadSession = async () => {
    if (!id) return;
    setIsLoadingSession(true);
    try {
      const res = await interviewsApi.getSession(id);
      setSession(res.data);
    } catch (err: any) {
      dispatch(addToast({ type: 'error', message: 'Failed to load interview session.' }));
    } finally {
      setIsLoadingSession(false);
    }
  };

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Find the currently active question (the first question that has no answer yet)
  const currentQuestion = session?.questions?.find((q) => !q.answer);

  const handleSendAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !currentQuestion || !currentAnswer.trim() || isSubmitting) return;

    const answerPayload = {
      session_id: id,
      question_id: currentQuestion.id,
      answer_text: currentAnswer.trim(),
      duration_seconds: secondsElapsed,
    };

    setIsSubmitting(true);
    try {
      const res = await interviewsApi.submitAnswer(answerPayload);
      setCurrentAnswer('');
      // Reload session to display updated conversation & feedback
      await loadSession();

      if (res.data.is_completed) {
        dispatch(
          addToast({
            type: 'info',
            message: 'All questions answered! Preparing final executive evaluation report...',
          })
        );
        handleEndInterview();
      }
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to submit answer. Check AI configuration.';
      dispatch(addToast({ type: 'error', message: msg }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEndInterview = async () => {
    if (!id || isCompleting) return;
    if (answeredQuestionsCount === 0) {
      if (window.confirm("You haven't submitted any answers yet. Exit interview without generating a report?")) {
        navigate('/interview-coach');
      }
      return;
    }
    setIsCompleting(true);
    try {
      await interviewsApi.complete(id);
      dispatch(addToast({ type: 'success', message: 'Interview completed! Final report ready.' }));
      navigate('/interview/history');
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to finalize interview report.';
      dispatch(addToast({ type: 'error', message: msg }));
    } finally {
      setIsCompleting(false);
    }
  };

  if (isLoadingSession) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-slate-400 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        <p className="text-sm font-medium">Entering live interview session room...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="p-8 text-center text-slate-400">
        <p>Interview session not found.</p>
        <button
          onClick={() => navigate('/interview-coach')}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold"
        >
          Back to Interview Setup
        </button>
      </div>
    );
  }

  const answeredQuestionsCount = session.questions?.filter((q) => !!q.answer).length || 0;
  const currentQuestionNumber = currentQuestion ? currentQuestion.question_number : answeredQuestionsCount;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start h-[calc(100vh-8rem)]">
      {/* Left Sidebar: Session Information */}
      <div className="lg:col-span-4 bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-6 flex flex-col justify-between h-full shadow-xl">
        <div className="space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Live Session Active
              </h3>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-950 border border-slate-800 text-xs font-mono text-indigo-300">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              <span>{formatTimer(secondsElapsed)}</span>
            </div>
          </div>

          <div className="space-y-3.5 text-xs">
            <div>
              <span className="text-slate-400 block mb-0.5">Target Job Role</span>
              <span className="text-sm font-bold text-white block">{session.target_role}</span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-800/60">
              <div>
                <span className="text-slate-400 block mb-0.5">Difficulty</span>
                <span className="font-semibold text-slate-200">{session.difficulty}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Interview Mode</span>
                <span className="font-semibold text-indigo-400">{session.interview_type}</span>
              </div>
            </div>

            <div className="pt-1 border-t border-slate-800/60">
              <div className="flex justify-between mb-1.5 font-semibold">
                <span className="text-slate-400">Progress</span>
                <span className="text-indigo-400">
                  Question {currentQuestionNumber} of {session.total_questions}
                </span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                <div
                  className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, (answeredQuestionsCount / session.total_questions) * 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="space-y-2 pt-4 border-t border-slate-800">
          <button
            onClick={handleEndInterview}
            disabled={isCompleting || answeredQuestionsCount === 0}
            className="w-full py-2.5 rounded-xl bg-slate-950 hover:bg-rose-950/80 border border-slate-800 hover:border-rose-500/30 text-slate-300 hover:text-rose-200 disabled:opacity-40 text-xs font-semibold transition flex items-center justify-center gap-2 cursor-pointer"
          >
            {isCompleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-rose-400" />
                <span>Generating Executive Report...</span>
              </>
            ) : (
              <>
                <StopCircle className="w-4 h-4 text-rose-400" />
                <span>End Interview &amp; Generate Report</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Area: Real-Time Chat & Live Feedback Interface */}
      <div className="lg:col-span-8 bg-slate-900/70 border border-slate-800 rounded-2xl flex flex-col h-full overflow-hidden shadow-2xl">
        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {session.questions?.map((q, idx) => (
            <div key={q.id} className="space-y-4 animate-in fade-in duration-300">
              {/* Question bubble (AI) */}
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-pink-500 to-indigo-600 flex items-center justify-center text-white shrink-0 mt-0.5 shadow-md shadow-pink-500/20">
                  <Bot className="w-5 h-5" />
                </div>
                <div className="flex-1 max-w-[85%] bg-slate-950 border border-slate-800 rounded-2xl rounded-tl-none p-4 text-xs sm:text-sm text-slate-100 shadow-sm leading-relaxed">
                  <div className="flex items-center justify-between text-[11px] text-pink-400 font-semibold mb-1">
                    <span>Kuromi AI Interviewer • Question {q.question_number} of {session.total_questions}</span>
                    {q.question_type && (
                      <span className="text-slate-500 uppercase tracking-wider text-[10px]">
                        {q.question_type}
                      </span>
                    )}
                  </div>
                  <p className="font-medium text-slate-100">{q.question_text}</p>
                </div>
              </div>

              {/* User Answer (if answered) */}
              {q.answer && (
                <div className="flex items-start justify-end gap-3">
                  <div className="max-w-[85%] bg-gradient-to-r from-pink-600 to-indigo-600 text-white rounded-2xl rounded-tr-none p-4 text-xs sm:text-sm shadow-md shadow-pink-600/20 leading-relaxed whitespace-pre-wrap">
                    <div className="text-[10px] text-pink-200 font-medium mb-1">Your Answer:</div>
                    {q.answer.answer_text}
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0 mt-0.5">
                    <User className="w-5 h-5" />
                  </div>
                </div>
              )}

              {/* Immediate Real-Time AI Feedback Card */}
              {q.feedback && (
                <div className="ml-12 p-4 rounded-xl bg-slate-950/80 border border-pink-500/20 text-xs space-y-3 shadow-md">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800/80">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-pink-400" />
                      <span className="font-bold text-pink-300">Kuromi AI Evaluation:</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                        {q.feedback.overall_score} / 10
                      </span>
                    </div>

                    {/* Metric chips */}
                    <div className="flex flex-wrap gap-2 text-[10px]">
                      <span className="text-slate-400">Content: <strong className="text-slate-200">{q.feedback.content_score}</strong></span>
                      <span className="text-slate-400">Accuracy: <strong className="text-slate-200">{q.feedback.technical_score}</strong></span>
                      <span className="text-slate-400">Clarity: <strong className="text-slate-200">{q.feedback.communication_score}</strong></span>
                      <span className="text-slate-400">Structure: <strong className="text-slate-200">{q.feedback.structure_score}</strong></span>
                    </div>
                  </div>

                  <p className="text-slate-300 leading-relaxed">{q.feedback.feedback_text}</p>

                  {/* STAR Evaluation Indicator if present */}
                  {q.feedback.star_evaluation && (
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                        STAR Method Breakdown:
                      </span>
                      <div className="flex flex-wrap gap-3 text-[11px]">
                        <span className={q.feedback.star_evaluation.situation ? 'text-emerald-400' : 'text-slate-500'}>
                          Situation {q.feedback.star_evaluation.situation ? '✓' : '✗'}
                        </span>
                        <span className={q.feedback.star_evaluation.task ? 'text-emerald-400' : 'text-slate-500'}>
                          Task {q.feedback.star_evaluation.task ? '✓' : '✗'}
                        </span>
                        <span className={q.feedback.star_evaluation.action ? 'text-emerald-400' : 'text-slate-500'}>
                          Action {q.feedback.star_evaluation.action ? '✓' : '✗'}
                        </span>
                        <span className={q.feedback.star_evaluation.result ? 'text-emerald-400' : 'text-rose-400 font-bold'}>
                          Result {q.feedback.star_evaluation.result ? '✓' : '✗'}
                        </span>
                      </div>
                      {q.feedback.star_evaluation.suggestion && (
                        <p className="text-[11px] text-amber-300 mt-1">
                          💡 Suggestion: {q.feedback.star_evaluation.suggestion}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Follow-up Question Probe */}
                  {q.feedback.follow_up_question && (
                    <div className="p-2.5 rounded-lg bg-indigo-950/40 border border-indigo-500/20 text-indigo-200 text-xs">
                      <strong>Interviewer Follow-Up Probe:</strong> "{q.feedback.follow_up_question}"
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {isSubmitting && (
            <div className="flex items-center gap-3 text-xs text-indigo-400 animate-pulse">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Analyzing your answer across content, technical accuracy, and structure...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-slate-950 border-t border-slate-800">
          {currentQuestion ? (
            <form onSubmit={handleSendAnswer} className="space-y-2">
              <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                <span>Type your answer for Question {currentQuestion.question_number}:</span>
                <span>{currentAnswer.length} characters</span>
              </div>
              <div className="flex gap-2">
                <textarea
                  rows={3}
                  value={currentAnswer}
                  onChange={(e) => setCurrentAnswer(e.target.value)}
                  placeholder="Type your answer clearly, including concrete examples or technical details..."
                  disabled={isSubmitting}
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="submit"
                  disabled={isSubmitting || !currentAnswer.trim()}
                  className="px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs sm:text-sm shadow-md shadow-indigo-600/30 transition flex flex-col items-center justify-center gap-1 cursor-pointer shrink-0"
                >
                  <Send className="w-4 h-4" />
                  <span>Send</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="p-3 text-center text-xs text-slate-400">
              <span>All questions answered! Click "End Interview &amp; Generate Report" on the left to view your comprehensive evaluation.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
