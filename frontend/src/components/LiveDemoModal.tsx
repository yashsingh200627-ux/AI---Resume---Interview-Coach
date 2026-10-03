import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store';
import { setDemoModalOpen, toggleCareerChat } from '../store/uiSlice';
import {
  Rocket, X, FileSearch, Target, Mic, MessageSquare, Award,
  Sparkles, CheckCircle2, ChevronRight
} from 'lucide-react';

export const LiveDemoModal: React.FC = () => {
  const isOpen = useAppSelector((state) => state.ui.isDemoModalOpen);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  if (!isOpen) return null;

  const demoSteps = [
    {
      num: 1,
      title: 'Demo 1: Upload a Real Resume',
      desc: 'Upload a PDF/DOCX/TXT resume to extract and calculate authentic scores live.',
      actionText: 'Open Resume Analyzer',
      icon: FileSearch,
      color: 'from-blue-500/20 to-sky-500/20 border-blue-500/30 text-blue-300',
      action: () => {
        dispatch(setDemoModalOpen(false));
        navigate('/resume-analyzer');
      },
    },
    {
      num: 2,
      title: 'Demo 2: Paste a Real Job Description',
      desc: 'Parse and extract technical requirements, responsibilities, and target keywords.',
      actionText: 'Open JD Analyzer',
      icon: Target,
      color: 'from-teal-500/20 to-emerald-500/20 border-teal-500/30 text-teal-300',
      action: () => {
        dispatch(setDemoModalOpen(false));
        navigate('/job-analyzer');
      },
    },
    {
      num: 3,
      title: 'Demo 3: Run ATS Analysis',
      desc: 'Compare candidate resume against job description to generate genuine match % and gaps.',
      actionText: 'Run ATS Match',
      icon: Award,
      color: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30 text-emerald-300',
      action: () => {
        dispatch(setDemoModalOpen(false));
        navigate('/ats-analyzer');
      },
    },
    {
      num: 4,
      title: 'Demo 4: Start a Live AI Interview',
      desc: 'Launch real-time AI interview session with live question generation based on role.',
      actionText: 'Start Live Interview',
      icon: Mic,
      color: 'from-amber-500/20 to-orange-500/20 border-amber-500/30 text-amber-300',
      action: () => {
        dispatch(setDemoModalOpen(false));
        navigate('/interview-coach');
      },
    },
    {
      num: 5,
      title: 'Demo 5 & 6: Answer & Show Immediate AI Feedback',
      desc: 'Submit your real answer to witness instant live scoring on Content, Accuracy, Structure, and STAR.',
      actionText: 'Try STAR Coach',
      icon: MessageSquare,
      color: 'from-rose-500/20 to-pink-500/20 border-rose-500/30 text-rose-300',
      action: () => {
        dispatch(setDemoModalOpen(false));
        navigate('/star-coach');
      },
    },
    {
      num: 7,
      title: 'Demo 7: Ask the Career AI a Question',
      desc: 'Consult the personalized career coach assistant with live contextual responses.',
      actionText: 'Open Career AI',
      icon: Sparkles,
      color: 'from-emerald-500/20 to-cyan-500/20 border-emerald-500/30 text-emerald-300',
      action: () => {
        dispatch(setDemoModalOpen(false));
        dispatch(toggleCareerChat());
      },
    },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 dark:bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white dark:bg-[#251823] border border-slate-200 dark:border-[#3b2536] rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-[#3b2536] bg-slate-50 dark:bg-[#251823] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-pink-500 to-rose-500 flex items-center justify-center text-white shadow-lg shadow-pink-500/20">
              <Rocket className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-[#FFF5F7] flex items-center gap-2">
                🚀 Community Project Presentation Mode
              </h2>
              <p className="text-xs text-slate-500 dark:text-[#E5CCD6]">
                7 Live capabilities powered by real data, database records, and AI processing
              </p>
            </div>
          </div>

          <button
            onClick={() => dispatch(setDemoModalOpen(false))}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1e131b] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Demo steps list */}
        <div className="p-5 max-h-[70vh] overflow-y-auto space-y-3">
          <div className="p-3 rounded-xl bg-pink-50 dark:bg-pink-950/40 border border-pink-200 dark:border-pink-500/20 text-xs text-pink-800 dark:text-pink-200 leading-relaxed mb-4">
            <strong className="text-pink-950 dark:text-pink-100 font-semibold block mb-0.5">Strict No-Fake-Data Guarantee:</strong>
            All results and scores demonstrated are calculated genuinely from user inputs, uploaded files, and live LLM inference.
          </div>

          {demoSteps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.num}
                className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#1e131b] border border-slate-200 dark:border-[#3b2536] hover:border-pink-300 dark:hover:border-pink-500/40 transition flex items-center justify-between gap-4 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br border flex items-center justify-center shrink-0 mt-0.5 ${step.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-[#FFF5F7]">
                      {step.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-[#E5CCD6] mt-0.5 leading-snug">
                      {step.desc}
                    </p>
                  </div>
                </div>

                <button
                  onClick={step.action}
                  className="px-3 py-1.5 rounded-lg bg-white dark:bg-[#251823] hover:bg-pink-600 dark:hover:bg-pink-600 border border-slate-300 dark:border-[#3b2536] hover:border-pink-500 text-xs font-semibold text-slate-700 dark:text-pink-100 hover:text-white transition flex items-center gap-1 shrink-0 cursor-pointer shadow-sm"
                >
                  <span>{step.actionText}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-[#3b2536] bg-slate-50 dark:bg-[#181117] flex items-center justify-between text-xs text-slate-500 dark:text-[#E5CCD6]">
          <span>AI Resume &amp; Interview Coach v1.0</span>
          <button
            onClick={() => dispatch(setDemoModalOpen(false))}
            className="px-4 py-1.5 rounded-lg bg-slate-200 dark:bg-pink-950/60 hover:bg-slate-300 dark:hover:bg-pink-900/60 border border-slate-300 dark:border-pink-500/30 text-slate-800 dark:text-pink-200 font-medium transition cursor-pointer"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
