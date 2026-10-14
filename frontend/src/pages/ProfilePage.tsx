import React, { useState, useEffect } from 'react';
import { useAppDispatch } from '../store';
import { addToast } from '../store/uiSlice';
import { updateUser } from '../store/authSlice';
import { profileApi } from '../services/api';
import { FullProfile, Education, Experience, Skill, Project, Certification } from '../types';
import {
  User, Briefcase, GraduationCap, Code, FolderGit2,
  Award, Plus, Trash2, Save, Loader2, Link as LinkIcon,
  CheckCircle2, Circle, Sparkles, Phone, Target
} from 'lucide-react';
import { PhoneInputField } from '../components/PhoneInputField';

export const ProfilePage: React.FC = () => {
  const dispatch = useAppDispatch();
  const [profileData, setProfileData] = useState<FullProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'personal' | 'experience' | 'education' | 'skills' | 'projects' | 'certifications'>('personal');

  // Dynamic Profile Setup Calculator
  const calculateSetupStats = () => {
    if (!profileData) return { percentage: 0, items: [] };
    const user = profileData.user;
    const prof = profileData.profile;
    const hasContact = Boolean(user.full_name && user.email && (user.phone || prof?.location));
    const hasSummary = Boolean(prof && ((prof.headline && prof.headline.trim().length > 2) || (prof.summary && prof.summary.trim().length > 5)));
    const hasExp = (profileData.experiences?.length || 0) > 0;
    const hasEdu = (profileData.educations?.length || 0) > 0;
    const hasSkills = (profileData.skills?.length || 0) >= 1;
    const hasProjectsOrCerts = (profileData.projects?.length || 0) > 0 || (profileData.certifications?.length || 0) > 0;

    let score = 0;
    if (hasContact) score += 20;
    if (hasSummary) score += 15;
    if (hasExp) score += 20;
    if (hasEdu) score += 15;
    if ((profileData.skills?.length || 0) >= 3) score += 15;
    else if (hasSkills) score += 8;
    if (hasProjectsOrCerts) score += 15;

    return {
      percentage: Math.min(100, Math.round(score)),
      items: [
        { id: 'personal', name: 'Contact & Target Role', isDone: hasContact, weight: 20 },
        { id: 'personal', name: 'Headline & Summary', isDone: hasSummary, weight: 15 },
        { id: 'experience', name: 'Work Experience', isDone: hasExp, count: profileData.experiences?.length || 0, weight: 20 },
        { id: 'education', name: 'Education', isDone: hasEdu, count: profileData.educations?.length || 0, weight: 15 },
        { id: 'skills', name: 'Key Skills (3+)', isDone: hasSkills, count: profileData.skills?.length || 0, weight: 15 },
        { id: 'projects', name: 'Projects / Certs', isDone: hasProjectsOrCerts, count: (profileData.projects?.length || 0) + (profileData.certifications?.length || 0), weight: 15 },
      ]
    };
  };

  const setupStats = calculateSetupStats();

  // Form states for adding items
  const [newExp, setNewExp] = useState<Partial<Experience>>({
    company: '', job_title: '', location: '', start_date: '', end_date: '', is_current: false, responsibilities: '', achievements: ''
  });
  const [newEdu, setNewEdu] = useState<Partial<Education>>({
    degree: '', institution: '', start_year: '', end_year: '', grade: '', field_of_study: ''
  });
  const [newSkill, setNewSkill] = useState<Partial<Skill>>({
    name: '', category: 'Technical', proficiency: 'Intermediate'
  });
  const [newProj, setNewProj] = useState<Partial<Project>>({
    name: '', description: '', technologies: '', responsibilities: '', results: '', link: ''
  });
  const [newCert, setNewCert] = useState<Partial<Certification>>({
    name: '', issuing_organization: '', issue_date: '', credential_id: ''
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setIsLoading(true);
    try {
      const res = await profileApi.getFullProfile();
      setProfileData(res.data);
    } catch (err: any) {
      dispatch(addToast({ type: 'error', message: 'Failed to load profile details.' }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePersonalInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileData) return;
    setIsSaving(true);
    try {
      await profileApi.updateProfile({
        full_name: profileData.user.full_name,
        email: profileData.user.email,
        phone: profileData.user.phone,
        target_job_role: profileData.user.target_job_role,
        experience_level: profileData.user.experience_level,
        headline: profileData.profile?.headline,
        summary: profileData.profile?.summary,
        location: profileData.profile?.location,
        linkedin_url: profileData.profile?.linkedin_url,
        github_url: profileData.profile?.github_url,
        portfolio_url: profileData.profile?.portfolio_url,
      });
      dispatch(updateUser({ 
        full_name: profileData.user.full_name, 
        email: profileData.user.email 
      }));
      dispatch(addToast({ type: 'success', message: 'Profile details saved successfully.' }));
      await loadProfile();
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to save profile changes.';
      dispatch(addToast({ type: 'error', message: msg }));
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddExperience = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExp.company || !newExp.job_title) return;
    try {
      const res = await profileApi.addExperience(newExp);
      setProfileData((prev) => prev ? { ...prev, experiences: [res.data, ...prev.experiences] } : null);
      setNewExp({ company: '', job_title: '', location: '', start_date: '', end_date: '', is_current: false, responsibilities: '', achievements: '' });
      dispatch(addToast({ type: 'success', message: 'Experience added successfully.' }));
    } catch (err) {
      dispatch(addToast({ type: 'error', message: 'Failed to add experience.' }));
    }
  };

  const handleDeleteExperience = async (id: string) => {
    try {
      await profileApi.deleteExperience(id);
      setProfileData((prev) => prev ? { ...prev, experiences: prev.experiences.filter((x) => x.id !== id) } : null);
      dispatch(addToast({ type: 'info', message: 'Experience removed.' }));
    } catch (err) {
      dispatch(addToast({ type: 'error', message: 'Failed to delete experience.' }));
    }
  };

  const handleAddEducation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEdu.degree || !newEdu.institution) return;
    try {
      const res = await profileApi.addEducation(newEdu);
      setProfileData((prev) => prev ? { ...prev, educations: [res.data, ...prev.educations] } : null);
      setNewEdu({ degree: '', institution: '', start_year: '', end_year: '', grade: '', field_of_study: '' });
      dispatch(addToast({ type: 'success', message: 'Education added successfully.' }));
    } catch (err) {
      dispatch(addToast({ type: 'error', message: 'Failed to add education.' }));
    }
  };

  const handleDeleteEducation = async (id: string) => {
    try {
      await profileApi.deleteEducation(id);
      setProfileData((prev) => prev ? { ...prev, educations: prev.educations.filter((x) => x.id !== id) } : null);
      dispatch(addToast({ type: 'info', message: 'Education removed.' }));
    } catch (err) {
      dispatch(addToast({ type: 'error', message: 'Failed to delete education.' }));
    }
  };

  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkill.name) return;
    try {
      const res = await profileApi.addSkill(newSkill);
      setProfileData((prev) => prev ? { ...prev, skills: [res.data, ...prev.skills] } : null);
      setNewSkill({ name: '', category: 'Technical', proficiency: 'Intermediate' });
      dispatch(addToast({ type: 'success', message: 'Skill added.' }));
    } catch (err) {
      dispatch(addToast({ type: 'error', message: 'Failed to add skill.' }));
    }
  };

  const handleDeleteSkill = async (id: string) => {
    try {
      await profileApi.deleteSkill(id);
      setProfileData((prev) => prev ? { ...prev, skills: prev.skills.filter((x) => x.id !== id) } : null);
      dispatch(addToast({ type: 'info', message: 'Skill removed.' }));
    } catch (err) {
      dispatch(addToast({ type: 'error', message: 'Failed to delete skill.' }));
    }
  };

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProj.name) return;
    try {
      const res = await profileApi.addProject(newProj);
      setProfileData((prev) => prev ? { ...prev, projects: [res.data, ...prev.projects] } : null);
      setNewProj({ name: '', description: '', technologies: '', responsibilities: '', results: '', link: '' });
      dispatch(addToast({ type: 'success', message: 'Project added.' }));
    } catch (err) {
      dispatch(addToast({ type: 'error', message: 'Failed to add project.' }));
    }
  };

  const handleDeleteProject = async (id: string) => {
    try {
      await profileApi.deleteProject(id);
      setProfileData((prev) => prev ? { ...prev, projects: prev.projects.filter((x) => x.id !== id) } : null);
      dispatch(addToast({ type: 'info', message: 'Project removed.' }));
    } catch (err) {
      dispatch(addToast({ type: 'error', message: 'Failed to delete project.' }));
    }
  };

  const handleAddCert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCert.name || !newCert.issuing_organization) return;
    try {
      const res = await profileApi.addCertification(newCert);
      setProfileData((prev) => prev ? { ...prev, certifications: [res.data, ...prev.certifications] } : null);
      setNewCert({ name: '', issuing_organization: '', issue_date: '', credential_id: '' });
      dispatch(addToast({ type: 'success', message: 'Certification added.' }));
    } catch (err) {
      dispatch(addToast({ type: 'error', message: 'Failed to add certification.' }));
    }
  };

  const handleDeleteCert = async (id: string) => {
    try {
      await profileApi.deleteCertification(id);
      setProfileData((prev) => prev ? { ...prev, certifications: prev.certifications.filter((x) => x.id !== id) } : null);
      dispatch(addToast({ type: 'info', message: 'Certification removed.' }));
    } catch (err) {
      dispatch(addToast({ type: 'error', message: 'Failed to delete certification.' }));
    }
  };

  if (isLoading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-slate-600 dark:text-slate-400 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        <p className="text-sm">Loading complete profile records...</p>
      </div>
    );
  }

  const tabs = [
    { id: 'personal', name: 'Personal & Summary', icon: User },
    { id: 'experience', name: `Experience (${profileData?.experiences.length || 0})`, icon: Briefcase },
    { id: 'education', name: `Education (${profileData?.educations.length || 0})`, icon: GraduationCap },
    { id: 'skills', name: `Skills (${profileData?.skills.length || 0})`, icon: Code },
    { id: 'projects', name: `Projects (${profileData?.projects.length || 0})`, icon: FolderGit2 },
    { id: 'certifications', name: `Certifications (${profileData?.certifications.length || 0})`, icon: Award },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Career Profile &amp; Portfolio
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
          Saved data directly powers the AI Resume Builder, ATS Matching, and Live Interview Coach.
        </p>
      </div>

      {/* Profile Setup Hero Card */}
      {setupStats && (
        <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-slate-900/95 via-indigo-950/40 to-slate-900/95 border border-indigo-500/25 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3.5">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-all duration-300 ${
                setupStats.percentage === 100 
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 shadow-lg shadow-emerald-500/10' 
                  : 'bg-indigo-500/20 border-indigo-500/40 text-indigo-400'
              }`}>
                {setupStats.percentage === 100 ? (
                  <Sparkles className="w-6 h-6 animate-bounce text-emerald-400" />
                ) : (
                  <span className="text-base font-black tracking-tight">{setupStats.percentage}%</span>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white">Profile Setup Status</h3>
                  {setupStats.percentage === 100 ? (
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 inline-flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      100% Fully Optimized
                    </span>
                  ) : (
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {setupStats.percentage}% Complete
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {setupStats.percentage === 100
                    ? '🎉 Amazing! Your profile information is complete and ready for AI Resumes, ATS Scans, and Mock Interviews.'
                    : 'Fill in each section below to reach 100% profile setup. Each completed section immediately raises your readiness.'}
                </p>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-950/80 rounded-full h-2.5 p-0.5 border border-slate-800/80 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                setupStats.percentage === 100
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-md shadow-emerald-500/30'
                  : 'bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-400'
              }`}
              style={{ width: `${Math.max(setupStats.percentage, 4)}%` }}
            />
          </div>

          {/* Interactive Checklist Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-1">
            {setupStats.items.map((item) => (
              <button
                key={item.name}
                type="button"
                onClick={() => setActiveTab(item.id as any)}
                className={`p-2.5 rounded-xl border text-left transition-all duration-200 flex flex-col justify-between cursor-pointer ${
                  item.isDone
                    ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300 hover:bg-emerald-950/50 hover:border-emerald-400/50'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-indigo-500/40 hover:text-white hover:bg-slate-900/60'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    +{item.weight}%
                  </span>
                  {item.isDone ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <Circle className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                  )}
                </div>
                <span className="text-xs font-semibold leading-tight line-clamp-1 block text-slate-200">
                  {item.name}
                </span>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  {item.isDone ? 'Completed' : 'Fill info →'}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex overflow-x-auto gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-slate-900 dark:text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white dark:bg-slate-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.name}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Personal & Summary */}
      {activeTab === 'personal' && (
        <form onSubmit={handleUpdatePersonalInfo} className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Full Name</label>
              <input
                type="text"
                value={profileData?.user.full_name || ''}
                onChange={(e) =>
                  setProfileData((prev) =>
                    prev ? { ...prev, user: { ...prev.user, full_name: e.target.value } } : null
                  )
                }
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Email Address</label>
              <input
                type="email"
                value={profileData?.user.email || ''}
                onChange={(e) =>
                  setProfileData((prev) =>
                    prev ? { ...prev, user: { ...prev.user, email: e.target.value } } : null
                  )
                }
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <PhoneInputField
                label="Phone Number"
                value={profileData?.user.phone || ''}
                onChange={(val) =>
                  setProfileData((prev) =>
                    prev ? { ...prev, user: { ...prev.user, phone: val } } : null
                  )
                }
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Target Job Role</label>
              <input
                type="text"
                value={profileData?.user.target_job_role || ''}
                onChange={(e) =>
                  setProfileData((prev) =>
                    prev ? { ...prev, user: { ...prev.user, target_job_role: e.target.value } } : null
                  )
                }
                placeholder="Software Engineer / Full Stack"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Experience Level</label>
              <select
                value={profileData?.user.experience_level || 'Mid-Level'}
                onChange={(e) =>
                  setProfileData((prev) =>
                    prev ? { ...prev, user: { ...prev.user, experience_level: e.target.value } } : null
                  )
                }
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="Entry-Level">Entry-Level (0-2 years)</option>
                <option value="Mid-Level">Mid-Level (2-5 years)</option>
                <option value="Senior">Senior (5-8 years)</option>
                <option value="Lead / Principal">Lead / Principal (8+ years)</option>
                <option value="Executive">Executive / Director</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Location</label>
              <input
                type="text"
                value={profileData?.profile?.location || ''}
                onChange={(e) =>
                  setProfileData((prev) =>
                    prev ? { ...prev, profile: { ...prev.profile, location: e.target.value } } : null
                  )
                }
                placeholder="San Francisco, CA / Remote"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Headline</label>
              <input
                type="text"
                value={profileData?.profile?.headline || ''}
                onChange={(e) =>
                  setProfileData((prev) =>
                    prev ? { ...prev, profile: { ...prev.profile, headline: e.target.value } } : null
                  )
                }
                placeholder="Senior Full Stack Engineer | React, Node.js & Cloud Architectures"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Professional Summary</label>
            <textarea
              rows={4}
              value={profileData?.profile?.summary || ''}
              onChange={(e) =>
                setProfileData((prev) =>
                  prev ? { ...prev, profile: { ...prev.profile, summary: e.target.value } } : null
                )
              }
              placeholder="Results-oriented engineer with 4+ years architecting scalable cloud applications..."
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-800/80">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">LinkedIn Profile</label>
              <input
                type="url"
                value={profileData?.profile?.linkedin_url || ''}
                onChange={(e) =>
                  setProfileData((prev) =>
                    prev ? { ...prev, profile: { ...prev.profile, linkedin_url: e.target.value } } : null
                  )
                }
                placeholder="https://linkedin.com/in/..."
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">GitHub Profile</label>
              <input
                type="url"
                value={profileData?.profile?.github_url || ''}
                onChange={(e) =>
                  setProfileData((prev) =>
                    prev ? { ...prev, profile: { ...prev.profile, github_url: e.target.value } } : null
                  )
                }
                placeholder="https://github.com/..."
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Portfolio / Website</label>
              <input
                type="url"
                value={profileData?.profile?.portfolio_url || ''}
                onChange={(e) =>
                  setProfileData((prev) =>
                    prev ? { ...prev, profile: { ...prev.profile, portfolio_url: e.target.value } } : null
                  )
                }
                placeholder="https://myportfolio.dev"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-slate-900 dark:text-white font-semibold text-xs sm:text-sm shadow-md shadow-indigo-600/30 transition flex items-center gap-2 cursor-pointer"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Save Personal Information</span>
            </button>
          </div>
        </form>
      )}

      {/* Tab 2: Experience */}
      {activeTab === 'experience' && (
        <div className="space-y-6">
          <form onSubmit={handleAddExperience} className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-indigo-400" />
              <span>Add Work Experience</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Company Name *"
                required
                value={newExp.company}
                onChange={(e) => setNewExp({ ...newExp, company: e.target.value })}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
              />
              <input
                type="text"
                placeholder="Job Title *"
                required
                value={newExp.job_title}
                onChange={(e) => setNewExp({ ...newExp, job_title: e.target.value })}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
              />
              <input
                type="text"
                placeholder="Start Date (e.g. Jun 2022)"
                value={newExp.start_date}
                onChange={(e) => setNewExp({ ...newExp, start_date: e.target.value })}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
              />
              <input
                type="text"
                placeholder="End Date (e.g. Present)"
                value={newExp.end_date}
                onChange={(e) => setNewExp({ ...newExp, end_date: e.target.value })}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <textarea
              rows={2}
              placeholder="Key Responsibilities (one per line)"
              value={newExp.responsibilities}
              onChange={(e) => setNewExp({ ...newExp, responsibilities: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
            />
            <textarea
              rows={2}
              placeholder="Measurable Achievements (e.g. Increased system throughput by 35%)"
              value={newExp.achievements}
              onChange={(e) => setNewExp({ ...newExp, achievements: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-slate-900 dark:text-white font-semibold text-xs sm:text-sm transition flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Experience Record</span>
            </button>
          </form>

          {/* List */}
          <div className="space-y-3">
            {profileData?.experiences.map((exp) => (
              <div key={exp.id} className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-start justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">{exp.job_title} — <span className="text-indigo-400">{exp.company}</span></h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">{exp.start_date} – {exp.end_date || 'Present'}</p>
                  {exp.responsibilities && <p className="text-xs text-slate-700 dark:text-slate-300 mt-2 whitespace-pre-wrap">{exp.responsibilities}</p>}
                  {exp.achievements && <p className="text-xs text-emerald-400 mt-1 font-medium">★ {exp.achievements}</p>}
                </div>
                <button onClick={() => handleDeleteExperience(exp.id)} className="p-2 text-slate-500 hover:text-rose-400 transition">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Education */}
      {activeTab === 'education' && (
        <div className="space-y-6">
          <form onSubmit={handleAddEducation} className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-indigo-400" />
              <span>Add Education Record</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Degree (e.g. B.S. in Computer Science) *"
                required
                value={newEdu.degree}
                onChange={(e) => setNewEdu({ ...newEdu, degree: e.target.value })}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
              />
              <input
                type="text"
                placeholder="Institution / University *"
                required
                value={newEdu.institution}
                onChange={(e) => setNewEdu({ ...newEdu, institution: e.target.value })}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
              />
              <input
                type="text"
                placeholder="Start Year (e.g. 2018)"
                value={newEdu.start_year}
                onChange={(e) => setNewEdu({ ...newEdu, start_year: e.target.value })}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
              />
              <input
                type="text"
                placeholder="End Year (e.g. 2022)"
                value={newEdu.end_year}
                onChange={(e) => setNewEdu({ ...newEdu, end_year: e.target.value })}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
              />
              <input
                type="text"
                placeholder="Grade / GPA / Percentage"
                value={newEdu.grade}
                onChange={(e) => setNewEdu({ ...newEdu, grade: e.target.value })}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-slate-900 dark:text-white font-semibold text-xs sm:text-sm transition flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Education</span>
            </button>
          </form>

          <div className="space-y-3">
            {profileData?.educations.map((edu) => (
              <div key={edu.id} className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">{edu.degree}</h4>
                  <p className="text-xs text-indigo-400 mt-0.5">{edu.institution} • {edu.start_year} - {edu.end_year}</p>
                  {edu.grade && <span className="text-[11px] text-slate-600 dark:text-slate-400">GPA/Score: {edu.grade}</span>}
                </div>
                <button onClick={() => handleDeleteEducation(edu.id)} className="p-2 text-slate-500 hover:text-rose-400 transition">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Skills */}
      {activeTab === 'skills' && (
        <div className="space-y-6">
          <form onSubmit={handleAddSkill} className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-wrap items-center gap-3">
            <input
              type="text"
              placeholder="Skill name (e.g. TypeScript, Docker, SQL) *"
              required
              value={newSkill.name}
              onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
              className="flex-1 min-w-[200px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
            />
            <select
              value={newSkill.category}
              onChange={(e) => setNewSkill({ ...newSkill, category: e.target.value })}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="Technical">Technical</option>
              <option value="Tools">Tools</option>
              <option value="Technologies">Technologies</option>
              <option value="Soft Skills">Soft Skills</option>
            </select>
            <select
              value={newSkill.proficiency}
              onChange={(e) => setNewSkill({ ...newSkill, proficiency: e.target.value })}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
              <option value="Expert">Expert</option>
            </select>
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-slate-900 dark:text-white font-semibold text-xs sm:text-sm transition flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Skill</span>
            </button>
          </form>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {profileData?.skills.map((s) => (
              <div key={s.id} className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">{s.name}</span>
                  <span className="text-[10px] text-slate-600 dark:text-slate-400">{s.category} • {s.proficiency}</span>
                </div>
                <button onClick={() => handleDeleteSkill(s.id)} className="p-1 text-slate-500 hover:text-rose-400 transition">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: Projects */}
      {activeTab === 'projects' && (
        <div className="space-y-6">
          <form onSubmit={handleAddProject} className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-indigo-400" />
              <span>Add Key Project</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Project Name *"
                required
                value={newProj.name}
                onChange={(e) => setNewProj({ ...newProj, name: e.target.value })}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
              />
              <input
                type="text"
                placeholder="Technologies (e.g. React, Python, PostgreSQL)"
                value={newProj.technologies}
                onChange={(e) => setNewProj({ ...newProj, technologies: e.target.value })}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <textarea
              rows={2}
              placeholder="Description & Responsibilities"
              value={newProj.description}
              onChange={(e) => setNewProj({ ...newProj, description: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
            />
            <textarea
              rows={1}
              placeholder="Measurable Result / Impact (e.g. Handled 50k daily requests)"
              value={newProj.results}
              onChange={(e) => setNewProj({ ...newProj, results: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-slate-900 dark:text-white font-semibold text-xs sm:text-sm transition flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Project</span>
            </button>
          </form>

          <div className="space-y-3">
            {profileData?.projects.map((p) => (
              <div key={p.id} className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-start justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">{p.name}</h4>
                  {p.technologies && <p className="text-xs text-indigo-400 mt-0.5">{p.technologies}</p>}
                  {p.description && <p className="text-xs text-slate-700 dark:text-slate-300 mt-2">{p.description}</p>}
                  {p.results && <p className="text-xs text-emerald-400 mt-1 font-medium">★ Result: {p.results}</p>}
                </div>
                <button onClick={() => handleDeleteProject(p.id)} className="p-2 text-slate-500 hover:text-rose-400 transition">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 6: Certifications */}
      {activeTab === 'certifications' && (
        <div className="space-y-6">
          <form onSubmit={handleAddCert} className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-indigo-400" />
              <span>Add Professional Certification</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Certification Name *"
                required
                value={newCert.name}
                onChange={(e) => setNewCert({ ...newCert, name: e.target.value })}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
              />
              <input
                type="text"
                placeholder="Issuing Organization (e.g. AWS, Google) *"
                required
                value={newCert.issuing_organization}
                onChange={(e) => setNewCert({ ...newCert, issuing_organization: e.target.value })}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
              />
              <input
                type="text"
                placeholder="Issue Date (e.g. March 2023)"
                value={newCert.issue_date}
                onChange={(e) => setNewCert({ ...newCert, issue_date: e.target.value })}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
              />
              <input
                type="text"
                placeholder="Credential ID / URL"
                value={newCert.credential_id}
                onChange={(e) => setNewCert({ ...newCert, credential_id: e.target.value })}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-slate-900 dark:text-white font-semibold text-xs sm:text-sm transition flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Certification</span>
            </button>
          </form>

          <div className="space-y-3">
            {profileData?.certifications.map((c) => (
              <div key={c.id} className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">{c.name}</h4>
                  <p className="text-xs text-indigo-400 mt-0.5">{c.issuing_organization} {c.issue_date && `• ${c.issue_date}`}</p>
                </div>
                <button onClick={() => handleDeleteCert(c.id)} className="p-2 text-slate-500 hover:text-rose-400 transition">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
