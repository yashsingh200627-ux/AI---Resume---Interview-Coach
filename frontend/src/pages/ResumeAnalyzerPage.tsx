import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAppDispatch } from '../store';
import { addToast } from '../store/uiSlice';
import { resumeAnalysisApi } from '../services/api';
import { ResumeAnalysis } from '../types';
import { ScoreGauge } from '../components/ScoreGauge';
import {
  UploadCloud, FileSearch, CheckCircle2, AlertTriangle, AlertCircle,
  Sparkles, FileText, Loader2, ArrowRight, Settings
} from 'lucide-react';

export const ResumeAnalyzerPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'strengths' | 'weaknesses' | 'keywords' | 'recommendations' | 'text'>('overview');

  useEffect(() => {
    // Check if there is an existing latest analysis
    resumeAnalysisApi.getLatest().then((res) => {
      if (res.data) setAnalysis(res.data);
    }).catch(() => { });
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setErrorMessage(null);
    }
  };

  const handleUploadAndAnalyze = async () => {
    if (!selectedFile) return;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await resumeAnalysisApi.uploadAndAnalyze(selectedFile);
      setAnalysis(res.data);
      dispatch(addToast({ type: 'success', message: 'Resume analyzed successfully!' }));
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to analyze resume. Please verify your AI API key.';
      setErrorMessage(msg);
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
          Real Resume Analyzer &amp; Auditor
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Upload your resume in PDF, DOCX, or TXT format. Text is extracted on the server and evaluated across ATS compliance, keywords, and content depth.
        </p>
      </div>

      {/* Error state if AI not configured */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-950/80 border border-rose-500/30 text-rose-200 text-xs sm:text-sm flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold block text-rose-100">Analysis Error</strong>
              <span>{errorMessage}</span>
            </div>
          </div>
          <Link
            to="/settings"
            className="px-3 py-1.5 rounded-lg bg-rose-900 hover:bg-rose-800 text-xs font-semibold text-rose-200 transition shrink-0 flex items-center gap-1"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Configure AI Key</span>
          </Link>
        </div>
      )}

      {/* Upload Zone */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
            <UploadCloud className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Upload Resume File</h3>
            <p className="text-xs text-slate-400">Accepted formats: PDF, DOCX, TXT (Max 10MB)</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <label className="flex-1 md:flex-initial px-4 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 cursor-pointer transition text-center truncate max-w-xs">
            {selectedFile ? selectedFile.name : 'Select Document...'}
            <input
              type="file"
              accept=".pdf,.docx,.txt"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>

          <button
            onClick={handleUploadAndAnalyze}
            disabled={!selectedFile || isLoading}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs sm:text-sm shadow-md shadow-indigo-600/30 transition flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Extracting &amp; Evaluating...</span>
              </>
            ) : (
              <>
                <FileSearch className="w-4 h-4" />
                <span>Run Real Analysis</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Analysis Results Display */}
      {analysis ? (
        <div className="space-y-6">
          {/* Top Score Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col items-center text-center">
              <ScoreGauge score={analysis.overall_score} size="sm" showLabel={false} />
              <span className="text-xs font-bold text-white mt-2">Overall Score</span>
              <span className="text-[10px] text-slate-400">Weighted Average</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col items-center text-center">
              <ScoreGauge score={analysis.ats_score} size="sm" showLabel={false} />
              <span className="text-xs font-bold text-white mt-2">ATS Readability</span>
              <span className="text-[10px] text-slate-400">Formatting &amp; Headers</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col items-center text-center">
              <ScoreGauge score={analysis.content_score} size="sm" showLabel={false} />
              <span className="text-xs font-bold text-white mt-2">Content Depth</span>
              <span className="text-[10px] text-slate-400">Impact &amp; Metrics</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col items-center text-center">
              <ScoreGauge score={analysis.keyword_score} size="sm" showLabel={false} />
              <span className="text-xs font-bold text-white mt-2">Keywords</span>
              <span className="text-[10px] text-slate-400">Industry Relevance</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col items-center text-center col-span-2 sm:col-span-1">
              <ScoreGauge score={analysis.formatting_score} size="sm" showLabel={false} />
              <span className="text-xs font-bold text-white mt-2">Structure</span>
              <span className="text-[10px] text-slate-400">Organization</span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex overflow-x-auto gap-2 border-b border-slate-800 pb-2">
            {[
              { id: 'overview', name: 'Overview' },
              { id: 'strengths', name: `Strengths (${analysis.strengths.length})` },
              { id: 'weaknesses', name: `Weaknesses (${analysis.weaknesses.length})` },
              { id: 'keywords', name: `Missing Keywords (${analysis.missing_keywords.length})` },
              { id: 'recommendations', name: `Recommendations (${analysis.recommendations.length})` },
              { id: 'text', name: 'Extracted Text' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${activeTab === tab.id
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
              >
                {tab.name}
              </button>
            ))}
          </div>

          {/* Tab: Overview */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                <h4 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Key Standouts</span>
                </h4>
                <div className="space-y-2">
                  {analysis.strengths.slice(0, 4).map((s, i) => (
                    <div key={i} className="text-xs text-slate-300 flex items-start gap-2">
                      <span className="text-emerald-400 font-bold">•</span>
                      <span>{s}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                <h4 className="text-sm font-bold text-amber-400 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Areas to Refine</span>
                </h4>
                <div className="space-y-2">
                  {analysis.weaknesses.slice(0, 4).map((w, i) => (
                    <div key={i} className="text-xs text-slate-300 flex items-start gap-2">
                      <span className="text-amber-400 font-bold">•</span>
                      <span>{w}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab: Strengths */}
          {activeTab === 'strengths' && (
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Identified Strengths in Document</span>
              </h3>
              <div className="space-y-2">
                {analysis.strengths.map((str, i) => (
                  <div key={i} className="p-3 rounded-xl bg-slate-950/80 border border-emerald-500/20 text-xs text-slate-200 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{str}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab: Weaknesses */}
          {activeTab === 'weaknesses' && (
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Identified Weaknesses &amp; Gaps</span>
              </h3>
              <div className="space-y-2">
                {analysis.weaknesses.map((w, i) => (
                  <div key={i} className="p-3 rounded-xl bg-slate-950/80 border border-amber-500/20 text-xs text-slate-200 flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>{w}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab: Missing Keywords */}
          {activeTab === 'keywords' && (
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white">Recommended High-Value Keywords</h3>
              <p className="text-xs text-slate-400">
                These keywords are prevalent in competitive candidate resumes in your domain and will improve ATS ranking:
              </p>
              <div className="flex flex-wrap gap-2">
                {analysis.missing_keywords.map((kw, i) => (
                  <span
                    key={i}
                    className="px-3 py-1.5 rounded-lg bg-indigo-950/80 border border-indigo-500/30 text-indigo-300 text-xs font-semibold"
                  >
                    + {kw}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Tab: Recommendations */}
          {activeTab === 'recommendations' && (
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
              <h3 className="text-sm font-bold text-white">Actionable Recommendations</h3>
              <div className="space-y-2.5">
                {analysis.recommendations.map((rec, i) => (
                  <div key={i} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold shrink-0 text-[11px]">
                      {i + 1}
                    </span>
                    <span className="leading-relaxed">{rec}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab: Extracted Text */}
          {activeTab === 'text' && (
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
              <h3 className="text-sm font-bold text-white">Raw Extracted Resume Text</h3>
              <p className="text-xs text-slate-400">
                This is the actual text parsed from your document by our server-side extractor:
              </p>
              <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 font-mono overflow-x-auto whitespace-pre-wrap max-h-96">
                {analysis.extracted_text || 'No text extracted.'}
              </pre>
            </div>
          )}
        </div>
      ) : (
        <div className="p-12 rounded-2xl bg-slate-900/30 border border-dashed border-slate-800 text-center text-slate-500">
          <FileSearch className="w-12 h-12 mx-auto text-slate-600 mb-3" />
          <p className="text-sm font-medium text-slate-400">No resume analyzed yet.</p>
          <p className="text-xs mt-1">Upload a PDF or DOCX resume above to view calculated ATS and content scores.</p>
        </div>
      )}
    </div>
  );
};
