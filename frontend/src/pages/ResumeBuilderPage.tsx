import React, { useState, useEffect } from 'react';
import { useAppDispatch } from '../store';
import { addToast } from '../store/uiSlice';
import { resumesApi, profileApi } from '../services/api';
import { Resume } from '../types';
import {
  FileText, Sparkles, Download, Save, RefreshCw, Wand2,
  Eye, Edit3, Plus, Trash2, CheckCircle2, Loader2, ArrowRight
} from 'lucide-react';

export const ResumeBuilderPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [currentResumeId, setCurrentResumeId] = useState<string | null>(null);
  const [title, setTitle] = useState('Senior Software Engineer Resume');
  const [targetRole, setTargetRole] = useState('Senior Full Stack Developer');
  const [templateName, setTemplateName] = useState('modern');
  const [content, setContent] = useState<any>({
    personal_info: { full_name: '', email: '', phone: '', location: '', linkedin: '', github: '' },
    summary: '',
    experiences: [],
    skills: { Technical: [], 'Tools & Frameworks': [], 'Soft Skills': [] },
    projects: [],
    educations: [],
    certifications: [],
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [improvingBulletIdx, setImprovingBulletIdx] = useState<{ expIdx: number; bIdx: number } | null>(null);
  const [viewMode, setViewMode] = useState<'edit' | 'preview' | 'split'>('split');

  useEffect(() => {
    loadResumes();
  }, []);

  const loadResumes = async () => {
    try {
      const res = await resumesApi.getAll();
      setResumes(res.data);
      if (res.data.length > 0) {
        selectResume(res.data[0]);
      } else {
        // Pre-fill from profile if no saved resumes
        prefillFromProfile();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const prefillFromProfile = async () => {
    try {
      const pRes = await profileApi.getFullProfile();
      const p = pRes.data;
      setTitle(`${p.user.target_job_role || 'Professional'} Resume`);
      setTargetRole(p.user.target_job_role || 'Software Engineer');
      setContent({
        personal_info: {
          full_name: p.user.full_name,
          email: p.user.email,
          phone: p.user.phone || '',
          location: p.profile.location || '',
          linkedin: p.profile.linkedin_url || '',
          github: p.profile.github_url || '',
        },
        summary: p.profile.summary || '',
        experiences: p.experiences.map((e) => ({
          company: e.company,
          job_title: e.job_title,
          location: e.location || '',
          start_date: e.start_date || '',
          end_date: e.end_date || '',
          is_current: e.is_current,
          responsibilities: e.responsibilities ? e.responsibilities.split('\n').filter(Boolean) : [],
          achievements: e.achievements ? [e.achievements] : [],
        })),
        skills: {
          Technical: p.skills.filter((s) => s.category === 'Technical').map((s) => s.name),
          'Tools & Technologies': p.skills.filter((s) => s.category === 'Tools' || s.category === 'Technologies').map((s) => s.name),
          'Soft Skills': p.skills.filter((s) => s.category === 'Soft Skills').map((s) => s.name),
        },
        projects: p.projects.map((pr) => ({
          name: pr.name,
          description: pr.description || '',
          technologies: pr.technologies || '',
          results: pr.results || '',
        })),
        educations: p.educations.map((ed) => ({
          degree: ed.degree,
          institution: ed.institution,
          start_year: ed.start_year || '',
          end_year: ed.end_year || '',
          grade: ed.grade || '',
        })),
        certifications: p.certifications.map((c) => ({
          name: c.name,
          issuing_organization: c.issuing_organization,
          issue_date: c.issue_date || '',
        })),
      });
    } catch (e) {
      console.error(e);
    }
  };

  const selectResume = (r: Resume) => {
    setCurrentResumeId(r.id);
    setTitle(r.title);
    setTargetRole(r.target_role || 'Software Engineer');
    setTemplateName(r.template_name || 'modern');
    setContent(r.content_json || {});
  };

  const handleGenerateAI = async () => {
    setIsGenerating(true);
    try {
      const res = await resumesApi.generateAi({
        target_role: targetRole,
        experience_level: 'Mid-Level',
        user_notes: 'Elevate with metrics, quantified impact, and strong action verbs for ATS scanning.',
      });
      if (res.data.content) {
        setContent(res.data.content);
        dispatch(
          addToast({
            type: 'success',
            message: 'Resume generated and optimized by AI based on your profile!',
          })
        );
      }
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'AI generation failed. Check your API key in Settings.';
      dispatch(addToast({ type: 'error', message: msg }));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (currentResumeId) {
        await resumesApi.update(currentResumeId, {
          title,
          target_role: targetRole,
          template_name: templateName,
          content_json: content,
        });
        dispatch(addToast({ type: 'success', message: 'Resume version saved.' }));
      } else {
        const res = await resumesApi.create({
          title,
          target_role: targetRole,
          template_name: templateName,
          content_json: content,
        });
        setCurrentResumeId(res.data.id);
        setResumes([res.data, ...resumes]);
        dispatch(addToast({ type: 'success', message: 'New resume created and saved.' }));
      }
    } catch (err: any) {
      dispatch(addToast({ type: 'error', message: 'Failed to save resume.' }));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!currentResumeId) {
      await handleSave();
    }
    const idToUse = currentResumeId;
    if (!idToUse) return;

    setIsDownloading(true);
    try {
      const res = await resumesApi.downloadPdf(idToUse);
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${title.replace(/\s+/g, '_')}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      dispatch(addToast({ type: 'success', message: 'PDF downloaded successfully!' }));
    } catch (err) {
      dispatch(addToast({ type: 'error', message: 'Failed to download PDF resume.' }));
    } finally {
      setIsDownloading(false);
    }
  };

  const handleImproveBullet = async (expIdx: number, bIdx: number, bulletText: string) => {
    setImprovingBulletIdx({ expIdx, bIdx });
    try {
      const res = await resumesApi.improveBullet(bulletText, targetRole);
      if (res.data.improved) {
        const updated = { ...content };
        updated.experiences[expIdx].responsibilities[bIdx] = res.data.improved;
        setContent(updated);
        dispatch(addToast({ type: 'success', message: 'Bullet point enhanced with action verbs!' }));
      }
    } catch (err: any) {
      dispatch(addToast({ type: 'error', message: 'Bullet optimization failed. Check API key.' }));
    } finally {
      setImprovingBulletIdx(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Action Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            AI Resume Builder &amp; Optimizer
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Build ATS-compliant resumes with quantified bullet points and server-generated PDF export.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* View mode toggle */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1">
            <button
              onClick={() => setViewMode('edit')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                viewMode === 'edit' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5 inline mr-1" />
              <span>Edit</span>
            </button>
            <button
              onClick={() => setViewMode('split')}
              className={`hidden md:inline px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                viewMode === 'split' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>Split</span>
            </button>
            <button
              onClick={() => setViewMode('preview')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                viewMode === 'preview' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5 inline mr-1" />
              <span>Preview</span>
            </button>
          </div>

          {/* AI Generation Button */}
          <button
            onClick={handleGenerateAI}
            disabled={isGenerating}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white font-semibold text-xs sm:text-sm shadow-md shadow-indigo-600/20 transition flex items-center gap-1.5 cursor-pointer"
          >
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4 text-purple-200" />}
            <span>Generate with AI</span>
          </button>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-white font-semibold text-xs sm:text-sm transition flex items-center gap-1.5 cursor-pointer"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save</span>
          </button>

          {/* Download PDF Button */}
          <button
            onClick={handleDownloadPDF}
            disabled={isDownloading}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs sm:text-sm shadow-md shadow-emerald-600/20 transition flex items-center gap-1.5 cursor-pointer"
          >
            {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            <span>Download PDF</span>
          </button>
        </div>
      </div>

      {/* Target Role & Meta Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Resume Document Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Target Job Role</label>
          <input
            type="text"
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Resume Layout Template</label>
          <select
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="modern">Modern Professional (ATS Friendly)</option>
            <option value="executive">Executive Classic</option>
            <option value="minimal">Minimal Tech</option>
          </select>
        </div>
      </div>

      {/* Split/Single View Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Editor Column */}
        {(viewMode === 'edit' || viewMode === 'split') && (
          <div className={`${viewMode === 'split' ? 'lg:col-span-6' : 'lg:col-span-12'} space-y-6`}>
            {/* 1. Personal Details */}
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
              <h3 className="text-sm font-bold text-white">Contact &amp; Header Info</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Full Name"
                  value={content?.personal_info?.full_name || ''}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      personal_info: { ...content.personal_info, full_name: e.target.value },
                    })
                  }
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={content?.personal_info?.email || ''}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      personal_info: { ...content.personal_info, email: e.target.value },
                    })
                  }
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
                <input
                  type="text"
                  placeholder="Phone"
                  value={content?.personal_info?.phone || ''}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      personal_info: { ...content.personal_info, phone: e.target.value },
                    })
                  }
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
                <input
                  type="text"
                  placeholder="Location"
                  value={content?.personal_info?.location || ''}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      personal_info: { ...content.personal_info, location: e.target.value },
                    })
                  }
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
            </div>

            {/* 2. Professional Summary */}
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">Professional Summary</h3>
                <span className="text-[11px] text-slate-400">Tailored to {targetRole}</span>
              </div>
              <textarea
                rows={4}
                value={content?.summary || ''}
                onChange={(e) => setContent({ ...content, summary: e.target.value })}
                placeholder="High impact summary tailored to target role..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* 3. Work Experiences with Bullet Enhancer */}
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">Work Experience &amp; Action Bullets</h3>
                <button
                  onClick={() =>
                    setContent({
                      ...content,
                      experiences: [
                        ...content.experiences,
                        { company: 'New Company', job_title: 'Role', start_date: '2023', end_date: 'Present', responsibilities: ['Architected...'], achievements: [] },
                      ],
                    })
                  }
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Role</span>
                </button>
              </div>

              {content?.experiences?.map((exp: any, expIdx: number) => (
                <div key={expIdx} className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Company"
                      value={exp.company}
                      onChange={(e) => {
                        const updated = { ...content };
                        updated.experiences[expIdx].company = e.target.value;
                        setContent(updated);
                      }}
                      className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    />
                    <input
                      type="text"
                      placeholder="Job Title"
                      value={exp.job_title}
                      onChange={(e) => {
                        const updated = { ...content };
                        updated.experiences[expIdx].job_title = e.target.value;
                        setContent(updated);
                      }}
                      className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>

                  {/* Bullet points */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-semibold text-slate-400 block">
                      Responsibilities &amp; Action Bullets
                    </label>
                    {exp.responsibilities?.map((bullet: string, bIdx: number) => (
                      <div key={bIdx} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={bullet}
                          onChange={(e) => {
                            const updated = { ...content };
                            updated.experiences[expIdx].responsibilities[bIdx] = e.target.value;
                            setContent(updated);
                          }}
                          className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                        />
                        <button
                          type="button"
                          onClick={() => handleImproveBullet(expIdx, bIdx, bullet)}
                          disabled={improvingBulletIdx !== null}
                          className="px-2 py-1.5 rounded-lg bg-indigo-950 border border-indigo-500/40 text-indigo-300 hover:text-white hover:bg-indigo-900 text-[11px] font-medium transition flex items-center gap-1 shrink-0 cursor-pointer"
                          title="Improve with action verbs & metrics"
                        >
                          {improvingBulletIdx?.expIdx === expIdx && improvingBulletIdx?.bIdx === bIdx ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Wand2 className="w-3.5 h-3.5 text-indigo-400" />
                          )}
                          <span>AI Polish</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Live Document Preview Column */}
        {(viewMode === 'preview' || viewMode === 'split') && (
          <div className={`${viewMode === 'split' ? 'lg:col-span-6' : 'lg:col-span-12'} sticky top-20`}>
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-t-2xl flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-emerald-400" />
                <span>Live Document Preview</span>
              </span>
              <span className="text-[11px] text-slate-500">Matches downloadable PDF</span>
            </div>

            {/* Simulated Clean White Page for Exact Resume Rendering */}
            <div className="bg-white text-slate-900 p-8 rounded-b-2xl shadow-2xl font-sans min-h-[600px] border-x border-b border-slate-700 space-y-4 text-left">
              {/* Header */}
              <div className="border-b border-slate-200 pb-3">
                <h2 className="text-2xl font-bold text-slate-900">
                  {content?.personal_info?.full_name || 'Your Full Name'}
                </h2>
                <div className="text-sm font-semibold text-teal-700 mt-0.5">
                  {targetRole}
                </div>
                <div className="text-xs text-slate-500 mt-1 flex flex-wrap gap-2">
                  {content?.personal_info?.email && <span>{content.personal_info.email}</span>}
                  {content?.personal_info?.phone && <span>• {content.personal_info.phone}</span>}
                  {content?.personal_info?.location && <span>• {content.personal_info.location}</span>}
                  {content?.personal_info?.linkedin && <span>• {content.personal_info.linkedin}</span>}
                </div>
              </div>

              {/* Summary */}
              {content?.summary && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-teal-700/60 pb-1 mb-1.5">
                    Professional Summary
                  </h4>
                  <p className="text-xs text-slate-700 leading-relaxed">{content.summary}</p>
                </div>
              )}

              {/* Skills */}
              {content?.skills && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-teal-700/60 pb-1 mb-1.5">
                    Technical &amp; Professional Skills
                  </h4>
                  <div className="text-xs text-slate-700 space-y-1">
                    {Object.entries(content.skills).map(([cat, list]: any) => (
                      <div key={cat}>
                        <strong>{cat}:</strong> {Array.isArray(list) ? list.join(', ') : String(list)}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Experience */}
              {content?.experiences && content.experiences.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-teal-700/60 pb-1 mb-1.5">
                    Work Experience
                  </h4>
                  <div className="space-y-3">
                    {content.experiences.map((exp: any, i: number) => (
                      <div key={i}>
                        <div className="flex justify-between text-xs font-bold text-slate-900">
                          <span>{exp.job_title} — {exp.company}</span>
                          <span className="text-slate-500 font-normal">{exp.start_date} – {exp.end_date || 'Present'}</span>
                        </div>
                        <ul className="list-disc list-inside text-xs text-slate-700 mt-1 space-y-0.5">
                          {Array.isArray(exp.responsibilities)
                            ? exp.responsibilities.map((r: string, idx: number) => <li key={idx}>{r}</li>)
                            : <li>{exp.responsibilities}</li>}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
