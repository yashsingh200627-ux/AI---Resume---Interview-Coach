import axios from 'axios';
import {
  User, FullProfile, Resume, ResumeAnalysis, JobDescription,
  JobMatch, InterviewSession, STARAnalysisResult, DashboardStats, SettingsStatus
} from '../types';

const sanitizeApiUrl = (url?: string): string => {
  const fallback = 'https://ai-resume-interview-coach-1-rovp.onrender.com/api';
  const raw = (url && url.trim().length > 0) ? url.trim() : fallback;
  let clean = raw.replace(/[\.\/\s]+$/, '');
  if (!clean.endsWith('/api')) {
    clean = `${clean}/api`;
  }
  return clean;
};

const API_BASE_URL = sanitizeApiUrl(import.meta.env.VITE_API_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 35000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Redirect only if not on public/landing/auth pages
      const publicPaths = ['/', '/login', '/register'];
      if (!publicPaths.includes(window.location.pathname)) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  register: (data: any) => api.post('/auth/register', data),
  login: (data: any) => api.post('/auth/login', data),
  getMe: () => api.get<User>('/auth/me'),
  logout: () => api.post('/auth/logout'),
};

export const profileApi = {
  getFullProfile: () => api.get<FullProfile>('/profile'),
  updateProfile: (data: any) => api.put('/profile', data),
  addEducation: (data: any) => api.post('/profile/educations', data),
  deleteEducation: (id: string) => api.delete(`/profile/educations/${id}`),
  addExperience: (data: any) => api.post('/profile/experiences', data),
  deleteExperience: (id: string) => api.delete(`/profile/experiences/${id}`),
  addSkill: (data: any) => api.post('/profile/skills', data),
  deleteSkill: (id: string) => api.delete(`/profile/skills/${id}`),
  addProject: (data: any) => api.post('/profile/projects', data),
  deleteProject: (id: string) => api.delete(`/profile/projects/${id}`),
  addCertification: (data: any) => api.post('/profile/certifications', data),
  deleteCertification: (id: string) => api.delete(`/profile/certifications/${id}`),
};

export const resumesApi = {
  getAll: () => api.get<Resume[]>('/resumes'),
  getById: (id: string) => api.get<Resume>(`/resumes/${id}`),
  create: (data: any) => api.post<Resume>('/resumes', data),
  update: (id: string, data: any) => api.put<Resume>(`/resumes/${id}`, data),
  delete: (id: string) => api.delete(`/resumes/${id}`),
  generateAi: (data: any) => api.post('/resumes/generate', data),
  improveBullet: (bullet: string, target_role?: string) =>
    api.post('/resumes/improve-bullet', { bullet, target_role }),
  downloadPdf: (id: string) =>
    api.get(`/resumes/${id}/pdf`, { responseType: 'blob' }),
};

export const resumeAnalysisApi = {
  uploadAndAnalyze: (file: File, resume_id?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (resume_id) formData.append('resume_id', resume_id);
    return api.post<ResumeAnalysis>('/resume-analysis/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  analyzeExisting: (resume_id: string) =>
    api.post<ResumeAnalysis>(`/resume-analysis/analyze-existing/${resume_id}`),
  getLatest: () => api.get<ResumeAnalysis>('/resume-analysis/latest'),
  getHistory: () => api.get<ResumeAnalysis[]>('/resume-analysis/history'),
};

export const atsApi = {
  runAtsAnalysis: (data: { resume_id?: string; resume_text?: string; job_description: string; job_title?: string }) =>
    api.post<JobMatch>('/ats-analysis', data),
  uploadAndCompare: (file: File, job_description: string, job_title?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('job_description', job_description);
    if (job_title) formData.append('job_title', job_title);
    return api.post<JobMatch>('/ats-analysis/upload-and-compare', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export const jobDescriptionsApi = {
  getAll: () => api.get<JobDescription[]>('/job-descriptions'),
  getById: (id: string) => api.get<JobDescription>(`/job-descriptions/${id}`),
  create: (data: { title: string; company?: string; raw_text: string }) =>
    api.post<JobDescription>('/job-descriptions', data),
  delete: (id: string) => api.delete(`/job-descriptions/${id}`),
};

export const jobMatchApi = {
  getAll: () => api.get<JobMatch[]>('/job-match'),
  getById: (id: string) => api.get<JobMatch>(`/job-match/${id}`),
};

export const interviewsApi = {
  start: (data: {
    target_role: string;
    experience_level: string;
    interview_type: string;
    difficulty: string;
    total_questions: number;
  }) => api.post('/interviews/start', data),
  submitAnswer: (data: {
    session_id: string;
    question_id: string;
    answer_text: string;
    duration_seconds?: number;
  }) => api.post('/interviews/message', data),
  complete: (id: string) => api.post<InterviewSession>(`/interviews/${id}/complete`),
  getSession: (id: string) => api.get<InterviewSession>(`/interviews/${id}`),
  getHistory: () => api.get<InterviewSession[]>('/interviews/history'),
};

export const starApi = {
  analyze: (data: { question: string; answer: string; target_role?: string }) =>
    api.post<STARAnalysisResult>('/star-analysis', data),
};

export const careerApi = {
  sendMessage: (message: string, session_id?: string) =>
    api.post('/career-chat', { message, session_id }),
  getMessages: (session_id?: string) =>
    api.get('/career-chat/messages', { params: { session_id } }),
  getSessions: () =>
    api.get('/career-chat/sessions'),
  deleteSession: (session_id: string) =>
    api.delete(`/career-chat/sessions/${session_id}`),
  clearAllSessions: () =>
    api.delete('/career-chat/sessions'),
  getRoadmap: (data: { target_role: string; timeline_months?: number }) =>
    api.post('/career-chat/roadmap', data),
};

export const dashboardApi = {
  getStats: () => api.get<DashboardStats>('/dashboard/stats'),
  clearAllActivities: () => api.delete('/dashboard/activities'),
  deleteActivity: (id: string) => api.delete(`/dashboard/activities/${id}`),
};

export const settingsApi = {
  getStatus: () => api.get<SettingsStatus>('/settings'),
  update: (data: { ai_api_key?: string; ai_api_base_url?: string; ai_model?: string }) =>
    api.post('/settings', data),
  testAi: () => api.post('/settings/test-ai'),
  getMongoStatus: () => api.get('/settings/mongodb-status'),
  syncMongo: () => api.post('/settings/mongodb-sync'),
};

export default api;
