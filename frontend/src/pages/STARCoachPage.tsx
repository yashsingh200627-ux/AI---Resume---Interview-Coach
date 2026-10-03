import React, { useState, useRef } from 'react';
import { useAppDispatch } from '../store';
import { addToast } from '../store/uiSlice';
import { starApi } from '../services/api';
import { STARAnalysisResult } from '../types';
import { ScoreGauge } from '../components/ScoreGauge';
import {
  Award, CheckCircle2, XCircle, AlertTriangle, Sparkles,
  ArrowRight, Loader2, BookOpen, Lightbulb, RotateCcw, Trash2, RefreshCw
} from 'lucide-react';

export const STARCoachPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const answerTextareaRef = useRef<HTMLTextAreaElement>(null);

  const sampleQuestions = [
    'Tell me about a time you handled a critical system outage or high-pressure crisis.',
    'Describe a situation where you had a major disagreement with a teammate or stakeholder.',
    'Tell me about a complex project where you had to learn a new technology under tight deadlines.',
    'Give an example of a goal you set and how you achieved it.',
    'Tell me about a time you failed or made a significant mistake at work and how you handled it.',
    'Describe a time when you had to prioritize multiple competing deadlines.'
  ];

  const [questionIndex, setQuestionIndex] = useState(0);
  const [question, setQuestion] = useState(sampleQuestions[0]);
  const [answer, setAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<STARAnalysisResult | null>(null);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !answer.trim()) return;

    setIsLoading(true);
    try {
      const res = await starApi.analyze({
        question: question.trim(),
        answer: answer.trim(),
      });
      setResult(res.data);
      dispatch(addToast({ type: 'success', message: 'STAR breakdown completed!' }));
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to analyze answer.';
      dispatch(addToast({ type: 'error', message: msg }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearAll = () => {
    setAnswer('');
    setResult(null);
    dispatch(addToast({ type: 'info', message: 'Cleared answer and analysis.' }));
    if (answerTextareaRef.current) {
      answerTextareaRef.current.focus();
    }
  };

  const handleNextQuestion = () => {
    const nextIdx = (questionIndex + 1) % sampleQuestions.length;
    setQuestionIndex(nextIdx);
    setQuestion(sampleQuestions[nextIdx]);
    setAnswer('');
    setResult(null);
    dispatch(addToast({ type: 'info', message: 'Next behavioral question loaded!' }));
    setTimeout(() => {
      if (answerTextareaRef.current) {
        answerTextareaRef.current.focus();
      }
    }, 50);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-pink-500/10 text-pink-400 border border-pink-500/20">
            Kuromi AI Coach
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Behavioral STAR Method Coach
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl">
          Evaluate behavioral interview answers across Situation, Task, Action, and Result components to identify missing metrics, strengthen evidence, and practice quickly.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Form */}
        <div className="lg:col-span-6 bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-5">
          <form onSubmit={handleAnalyze} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300">Behavioral Interview Question *</label>
                <button
                  type="button"
                  onClick={handleNextQuestion}
                  className="text-[11px] text-pink-400 hover:text-pink-300 font-medium flex items-center gap-1 transition cursor-pointer"
                  title="Cycle to next question"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Next Question</span>
                </button>
              </div>
              <input
                type="text"
                required
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-pink-500/60 transition"
              />

              {/* Sample Questions Pills */}
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {sampleQuestions.map((q, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setQuestion(q);
                      setQuestionIndex(i);
                    }}
                    className={`text-left text-[11px] px-2.5 py-1 rounded-lg border transition truncate max-w-full cursor-pointer ${
                      question === q
                        ? 'bg-pink-500/15 border-pink-500/40 text-pink-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Your Answer (Explain what happened, what you did, and the outcome) *
                </label>
                {answer.trim() && (
                  <button
                    type="button"
                    onClick={() => setAnswer('')}
                    className="text-[11px] text-slate-500 hover:text-pink-400 transition cursor-pointer"
                  >
                    Clear text
                  </button>
                )}
              </div>
              <textarea
                ref={answerTextareaRef}
                rows={8}
                required
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="In my previous role, our payment service started timing out during Black Friday..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-pink-500/60 leading-relaxed transition"
              />
            </div>

            {/* Action Buttons Row */}
            <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-1">
              <button
                type="submit"
                disabled={isLoading || !question.trim() || !answer.trim()}
                className="w-full sm:flex-1 py-3 rounded-xl bg-gradient-to-r from-pink-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 disabled:opacity-50 text-white font-semibold text-xs sm:text-sm shadow-md shadow-pink-600/20 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Evaluating STAR Components...</span>
                  </>
                ) : (
                  <>
                    <Award className="w-4 h-4" />
                    <span>Analyze STAR Breakdown</span>
                  </>
                )}
              </button>

              {(answer.trim() || result) && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="w-full sm:w-auto px-4 py-3 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 text-slate-300 hover:text-white font-medium text-xs sm:text-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
                  title="Clear answer and reset evaluation"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleNextQuestion}
                className="w-full sm:w-auto px-4 py-3 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 text-slate-300 hover:text-pink-300 font-medium text-xs sm:text-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
                title="Load next sample question"
              >
                <span>Next Question</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        </div>

        {/* Right Output */}
        <div className="lg:col-span-6">
          {result ? (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-6">
              {/* Top Score & Reset Bar */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div>
                  <h3 className="text-lg font-bold text-white">STAR Completeness Evaluation</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Rigorous structural assessment</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-pink-400 hover:border-slate-700 transition cursor-pointer"
                    title="Clear analysis & answer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <ScoreGauge score={result.score} size="sm" showLabel={false} />
                </div>
              </div>

              {/* 4 Pillars Grid (S, T, A, R) */}
              <div className="grid grid-cols-2 gap-3">
                {/* Situation */}
                <div className={`p-4 rounded-xl border ${result.situation_present ? 'bg-emerald-950/20 border-emerald-500/30' : 'bg-rose-950/20 border-rose-500/30'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-200">S — Situation</span>
                    {result.situation_present ? (
                      <span className="text-xs font-bold text-emerald-400">✓ Present</span>
                    ) : (
                      <span className="text-xs font-bold text-rose-400">✗ Missing</span>
                    )}
                  </div>
                  {result.situation_details && (
                    <p className="text-[11px] text-slate-300 mt-1 leading-snug">{result.situation_details}</p>
                  )}
                </div>

                {/* Task */}
                <div className={`p-4 rounded-xl border ${result.task_present ? 'bg-emerald-950/20 border-emerald-500/30' : 'bg-rose-950/20 border-rose-500/30'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-200">T — Task</span>
                    {result.task_present ? (
                      <span className="text-xs font-bold text-emerald-400">✓ Present</span>
                    ) : (
                      <span className="text-xs font-bold text-rose-400">✗ Missing</span>
                    )}
                  </div>
                  {result.task_details && (
                    <p className="text-[11px] text-slate-300 mt-1 leading-snug">{result.task_details}</p>
                  )}
                </div>

                {/* Action */}
                <div className={`p-4 rounded-xl border ${result.action_present ? 'bg-emerald-950/20 border-emerald-500/30' : 'bg-rose-950/20 border-rose-500/30'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-200">A — Action</span>
                    {result.action_present ? (
                      <span className="text-xs font-bold text-emerald-400">✓ Present</span>
                    ) : (
                      <span className="text-xs font-bold text-rose-400">✗ Missing</span>
                    )}
                  </div>
                  {result.action_details && (
                    <p className="text-[11px] text-slate-300 mt-1 leading-snug">{result.action_details}</p>
                  )}
                </div>

                {/* Result */}
                <div className={`p-4 rounded-xl border ${result.result_present ? 'bg-emerald-950/20 border-emerald-500/30' : 'bg-rose-950/20 border-rose-500/30'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-200">R — Result</span>
                    {result.result_present ? (
                      <span className="text-xs font-bold text-emerald-400">✓ Present</span>
                    ) : (
                      <span className="text-xs font-bold text-rose-400">✗ Missing</span>
                    )}
                  </div>
                  {result.result_details && (
                    <p className="text-[11px] text-slate-300 mt-1 leading-snug">{result.result_details}</p>
                  )}
                </div>
              </div>

              {/* Missing Components Alert */}
              {result.missing_components.length > 0 && (
                <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/30 text-xs text-amber-200 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span>Missing Structural Component(s): {result.missing_components.join(', ')}</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    A compelling behavioral answer requires quantifiable outcomes. Add the business or team impact resulting from your action.
                  </p>
                </div>
              )}

              {/* Actionable Suggestions */}
              {result.actionable_suggestions.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                    <span>Suggestions for Maximum Impact</span>
                  </h4>
                  <div className="space-y-1.5">
                    {result.actionable_suggestions.map((sug, i) => (
                      <div key={i} className="text-xs text-slate-300 flex items-start gap-2">
                        <span className="text-pink-400 font-bold">•</span>
                        <span>{sug}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Restructured Answer */}
              {result.restructured_answer && (
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                    <span>Restructured Answer Formulation</span>
                  </h4>
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
                    {result.restructured_answer}
                  </div>
                </div>
              )}

              {/* Quick Practice Next Question Banner */}
              <div className="pt-2 border-t border-slate-800">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-xl bg-gradient-to-r from-pink-950/20 via-slate-900 to-indigo-950/20 border border-pink-500/20">
                  <div>
                    <div className="text-xs font-bold text-pink-300">Ready for the next question?</div>
                    <div className="text-[11px] text-slate-400">Clear this analysis and jump straight into the next behavioral interview scenario.</div>
                  </div>
                  <button
                    type="button"
                    onClick={handleNextQuestion}
                    className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-indigo-600 hover:from-pink-400 hover:to-indigo-500 text-white font-semibold text-xs transition flex items-center justify-center gap-1.5 shadow-md shadow-pink-500/20 cursor-pointer shrink-0"
                  >
                    <span>Practice Next Question</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 rounded-2xl bg-slate-900/30 border border-dashed border-slate-800 text-center text-slate-500">
              <BookOpen className="w-12 h-12 mx-auto text-slate-600 mb-3" />
              <p className="text-sm font-medium text-slate-400">No Answer Evaluated Yet</p>
              <p className="text-xs mt-1">Enter your behavioral response on the left to see Situation, Task, Action, and Result checkmarks.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

