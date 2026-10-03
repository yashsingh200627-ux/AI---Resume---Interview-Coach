import React, { useState, useEffect } from 'react';
import { useAppDispatch } from '../store';
import { addToast } from '../store/uiSlice';
import { atsApi, resumesApi, jobDescriptionsApi } from '../services/api';
import { Resume, JobDescription, JobMatch } from '../types';
import { ScoreGauge } from '../components/ScoreGauge';
import {
  Target, UploadCloud, FileText, CheckCircle2, XCircle,
  AlertTriangle, ArrowRight, Loader2, Sparkles, Briefcase
} from 'lucide-react';

export const ATSAnalyzerPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<string>('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [jobDescriptionText, setJobDescriptionText] = useState('');
  const [jobTitle, setJobTitle] = useState('Senior Software Engineer');
  const [isLoading, setIsLoading] = useState(false);
  const [matchResult, setMatchResult] = useState<JobMatch | null>(null);
  const [sourceType, setSourceType] = useState<'existing' | 'upload'>('existing');

  useEffect(() => {
    resumesApi.getAll().then((res) => {
      setResumes(res.data);
      if (res.data.length > 0) setSelectedResumeId(res.data[0].id);
    }).catch(() => {});
  }, []);

  const handleRunMatch = async () => {
    if (!jobDescriptionText.trim()) {
      dispatch(addToast({ type: 'warning', message: 'Please paste a target Job Description.' }));
      return;
    }

    setIsLoading(true);
    try {
      let res;
      if (sourceType === 'upload' && uploadedFile) {
        res = await atsApi.uploadAndCompare(uploadedFile, jobDescriptionText, jobTitle);
      } else {
        res = await atsApi.runAtsAnalysis({
          resume_id: selectedResumeId,
          job_description: jobDescriptionText,
          job_title: jobTitle,
        });
      }
      setMatchResult(res.data);
      dispatch(addToast({ type: 'success', message: 'ATS Alignment calculated successfully!' }));
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to run ATS comparison.';
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
          Real ATS Compatibility &amp; Match Optimizer
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Scan your resume directly against an authentic job description. Identify matched and missing keywords, skills, and alignment gaps.
        </p>
      </div>

      {/* Input Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Resume Source */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-400" />
              <span>Step 1: Select Candidate Resume</span>
            </h3>
            <div className="flex gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
              <button
                onClick={() => setSourceType('existing')}
                className={`px-2.5 py-1 rounded font-medium transition cursor-pointer ${
                  sourceType === 'existing' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Saved Resume
              </button>
              <button
                onClick={() => setSourceType('upload')}
                className={`px-2.5 py-1 rounded font-medium transition cursor-pointer ${
                  sourceType === 'upload' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Upload File
              </button>
            </div>
          </div>

          {sourceType === 'existing' ? (
            <div>
              {resumes.length > 0 ? (
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400">Choose saved resume document:</label>
                  <select
                    value={selectedResumeId}
                    onChange={(e) => setSelectedResumeId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    {resumes.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.title} ({r.target_role || 'General'})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="p-6 rounded-xl bg-slate-950/60 border border-dashed border-slate-800 text-center text-xs text-slate-400">
                  <p>No saved resumes found in database.</p>
                  <button
                    onClick={() => setSourceType('upload')}
                    className="mt-2 text-indigo-400 hover:underline font-semibold cursor-pointer"
                  >
                    Switch to upload file instead →
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400">Upload PDF/DOCX to match:</label>
              <label className="block p-5 rounded-xl bg-slate-950 border border-dashed border-slate-800 hover:border-indigo-500/50 text-center cursor-pointer transition">
                <UploadCloud className="w-8 h-8 mx-auto text-indigo-400 mb-2" />
                <span className="text-xs text-slate-300 font-semibold block">
                  {uploadedFile ? uploadedFile.name : 'Click to select resume document'}
                </span>
                <span className="text-[11px] text-slate-500 mt-1 block">PDF, DOCX, or TXT</span>
                <input
                  type="file"
                  accept=".pdf,.docx,.txt"
                  onChange={(e) => e.target.files && setUploadedFile(e.target.files[0])}
                  className="hidden"
                />
              </label>
            </div>
          )}
        </div>

        {/* Right: Job Description */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-indigo-400" />
              <span>Step 2: Target Job Description</span>
            </h3>
            <input
              type="text"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="Job Title"
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white max-w-[180px]"
            />
          </div>

          <textarea
            rows={6}
            value={jobDescriptionText}
            onChange={(e) => setJobDescriptionText(e.target.value)}
            placeholder="Paste complete job description, requirements, and responsibilities here..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />

          <button
            onClick={handleRunMatch}
            disabled={isLoading || (!selectedResumeId && !uploadedFile) || !jobDescriptionText.trim()}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Running Real ATS Alignment...</span>
              </>
            ) : (
              <>
                <Target className="w-4 h-4" />
                <span>Calculate Real ATS Match</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Match Results */}
      {matchResult && (
        <div className="space-y-6 pt-4 border-t border-slate-800">
          {/* Top Gauges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col items-center text-center">
              <ScoreGauge score={matchResult.overall_match_score} size="sm" showLabel={false} />
              <span className="text-xs font-bold text-white mt-2">Overall Match</span>
              <span className="text-[10px] text-slate-400">Composite Score</span>
            </div>
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col items-center text-center">
              <ScoreGauge score={matchResult.ats_compatibility_score} size="sm" showLabel={false} />
              <span className="text-xs font-bold text-white mt-2">ATS Compatibility</span>
              <span className="text-[10px] text-slate-400">Parseability &amp; Structure</span>
            </div>
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col items-center text-center">
              <ScoreGauge score={matchResult.skill_match_score} size="sm" showLabel={false} />
              <span className="text-xs font-bold text-white mt-2">Skill Match</span>
              <span className="text-[10px] text-slate-400">Required Skills Coverage</span>
            </div>
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col items-center text-center">
              <ScoreGauge score={matchResult.experience_match_score} size="sm" showLabel={false} />
              <span className="text-xs font-bold text-white mt-2">Experience Match</span>
              <span className="text-[10px] text-slate-400">Seniority Alignment</span>
            </div>
          </div>

          {/* Alignment Narrative */}
          {matchResult.alignment_summary && (
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span>Job-Description Alignment Summary</span>
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                {matchResult.alignment_summary}
              </p>
            </div>
          )}

          {/* Skills & Keywords Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Matched vs Missing Skills */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white">Skills Breakdown</h3>

              <div>
                <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5 mb-2">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Matched Skills ({matchResult.matched_skills.length})</span>
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {matchResult.matched_skills.map((s, i) => (
                    <span key={i} className="px-2.5 py-1 rounded-lg bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 text-xs">
                      ✓ {s}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-xs font-semibold text-rose-400 flex items-center gap-1.5 mb-2">
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Missing Required Skills ({matchResult.missing_skills.length})</span>
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {matchResult.missing_skills.map((s, i) => (
                    <span key={i} className="px-2.5 py-1 rounded-lg bg-rose-950/80 border border-rose-500/30 text-rose-300 text-xs">
                      ✗ {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Matched vs Missing Keywords */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white">ATS Keywords Alignment</h3>

              <div>
                <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5 mb-2">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Matched Target Keywords ({matchResult.matched_keywords.length})</span>
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {matchResult.matched_keywords.map((k, i) => (
                    <span key={i} className="px-2.5 py-1 rounded-lg bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 text-xs">
                      {k}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-xs font-semibold text-amber-400 flex items-center gap-1.5 mb-2">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Missing High-Impact Keywords ({matchResult.missing_keywords.length})</span>
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {matchResult.missing_keywords.map((k, i) => (
                    <span key={i} className="px-2.5 py-1 rounded-lg bg-amber-950/80 border border-amber-500/30 text-amber-300 text-xs">
                      + {k}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Recommendations */}
          {matchResult.recommendations.length > 0 && (
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
              <h3 className="text-sm font-bold text-white">Resume Improvement Suggestions for this Job</h3>
              <div className="space-y-2">
                {matchResult.recommendations.map((rec, i) => (
                  <div key={i} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 flex items-start gap-2.5">
                    <span className="text-indigo-400 font-bold">•</span>
                    <span>{rec}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
