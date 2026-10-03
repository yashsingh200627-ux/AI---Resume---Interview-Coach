import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../store';
import { addToast } from '../store/uiSlice';
import { jobDescriptionsApi } from '../services/api';
import { JobDescription } from '../types';
import {
  Briefcase, Plus, Trash2, ArrowRight, Loader2, CheckCircle2,
  Sparkles, Layers, GraduationCap, Clock
} from 'lucide-react';

export const JobAnalyzerPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [jobList, setJobList] = useState<JobDescription[]>([]);
  const [selectedJob, setSelectedJob] = useState<JobDescription | null>(null);
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [rawText, setRawText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    setIsLoading(true);
    try {
      const res = await jobDescriptionsApi.getAll();
      setJobList(res.data);
      if (res.data.length > 0) setSelectedJob(res.data[0]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleParseJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !rawText.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await jobDescriptionsApi.create({
        title: title.trim(),
        company: company.trim() || undefined,
        raw_text: rawText.trim(),
      });
      setJobList([res.data, ...jobList]);
      setSelectedJob(res.data);
      setTitle('');
      setCompany('');
      setRawText('');
      dispatch(addToast({ type: 'success', message: 'Job description parsed and saved!' }));
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to analyze job description.';
      dispatch(addToast({ type: 'error', message: msg }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteJob = async (id: string) => {
    try {
      await jobDescriptionsApi.delete(id);
      setJobList(jobList.filter((j) => j.id !== id));
      if (selectedJob?.id === id) {
        setSelectedJob(jobList.find((j) => j.id !== id) || null);
      }
      dispatch(addToast({ type: 'info', message: 'Job record removed.' }));
    } catch (err) {
      dispatch(addToast({ type: 'error', message: 'Failed to delete record.' }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Job Description Analyzer &amp; Parser
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Paste any job posting to extract required skills, preferred qualifications, responsibilities, and target ATS keywords.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Form: Add/Paste JD */}
        <div className="lg:col-span-5 bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Plus className="w-4 h-4 text-indigo-400" />
            <span>Analyze New Job Posting</span>
          </h3>

          <form onSubmit={handleParseJob} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Job Title *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Senior Backend Engineer"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Company (Optional)</label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g. Stripe, Netflix, Startup"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Job Description Text *</label>
              <textarea
                rows={7}
                required
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Paste the full job posting, duties, qualifications, and requirements..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !title.trim() || !rawText.trim()}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs sm:text-sm shadow-md shadow-indigo-600/30 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Extracting Requirements...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Extract &amp; Parse Requirements</span>
                </>
              )}
            </button>
          </form>

          {/* Saved Job Postings List */}
          {jobList.length > 0 && (
            <div className="pt-4 border-t border-slate-800 space-y-2">
              <span className="text-xs font-semibold text-slate-400 block">Saved Target Roles:</span>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {jobList.map((job) => (
                  <div
                    key={job.id}
                    onClick={() => setSelectedJob(job)}
                    className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition cursor-pointer ${
                      selectedJob?.id === job.id
                        ? 'bg-indigo-950/60 border-indigo-500/40 text-white'
                        : 'bg-slate-950 border-slate-800/80 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="truncate mr-2">
                      <span className="font-semibold block truncate">{job.title}</span>
                      {job.company && <span className="text-[10px] text-slate-400">{job.company}</span>}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteJob(job.id);
                      }}
                      className="p-1 text-slate-500 hover:text-rose-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Details: Extracted Structure */}
        <div className="lg:col-span-7 space-y-4">
          {selectedJob ? (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-6">
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <h3 className="text-xl font-bold text-white">{selectedJob.title}</h3>
                  <p className="text-xs text-indigo-400 mt-0.5">{selectedJob.company || 'Direct Posting'}</p>
                </div>

                <button
                  onClick={() => navigate('/ats-analyzer')}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition flex items-center gap-1.5 shadow-md shadow-indigo-600/20 shrink-0 cursor-pointer"
                >
                  <span>Match Against Resume</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Required & Preferred Skills */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Required Skills ({selectedJob.required_skills?.length || 0})</span>
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedJob.required_skills?.map((s, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 text-xs">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Preferred Skills ({selectedJob.preferred_skills?.length || 0})</span>
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedJob.preferred_skills?.map((s, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-indigo-950/80 border border-indigo-500/30 text-indigo-300 text-xs">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Experience & Education Requirements */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {selectedJob.experience_requirements && (
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5 mb-1">
                      <Clock className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Experience Requirement</span>
                    </span>
                    <p className="text-xs text-slate-200">{selectedJob.experience_requirements}</p>
                  </div>
                )}
                {selectedJob.education_requirements && (
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5 mb-1">
                      <GraduationCap className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Education Requirement</span>
                    </span>
                    <p className="text-xs text-slate-200">{selectedJob.education_requirements}</p>
                  </div>
                )}
              </div>

              {/* Responsibilities */}
              {selectedJob.responsibilities && selectedJob.responsibilities.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Core Responsibilities
                  </h4>
                  <div className="space-y-1.5">
                    {selectedJob.responsibilities.map((r, i) => (
                      <div key={i} className="text-xs text-slate-300 flex items-start gap-2">
                        <span className="text-indigo-400 font-bold">•</span>
                        <span>{r}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Keywords */}
              {selectedJob.keywords && selectedJob.keywords.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Extracted ATS Target Keywords
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedJob.keywords.map((kw, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 text-xs">
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 rounded-2xl bg-slate-900/30 border border-dashed border-slate-800 text-center text-slate-500">
              <Briefcase className="w-12 h-12 mx-auto text-slate-600 mb-3" />
              <p className="text-sm font-medium text-slate-400">No Job Description Selected</p>
              <p className="text-xs mt-1">Paste a job posting on the left to extract structured requirements.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
