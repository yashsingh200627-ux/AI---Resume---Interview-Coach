export interface User {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  experience_level?: string;
  target_job_role?: string;
  created_at?: string;
}

export interface Profile {
  id: string;
  user_id: string;
  headline?: string;
  summary?: string;
  location?: string;
  linkedin_url?: string;
  github_url?: string;
  portfolio_url?: string;
}

export interface Education {
  id: string;
  degree: string;
  institution: string;
  start_year?: string;
  end_year?: string;
  grade?: string;
  field_of_study?: string;
}

export interface Experience {
  id: string;
  company: string;
  job_title: string;
  location?: string;
  start_date?: string;
  end_date?: string;
  is_current?: boolean;
  responsibilities?: string;
  achievements?: string;
}

export interface Skill {
  id: string;
  name: string;
  category: string;
  proficiency: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  technologies?: string;
  responsibilities?: string;
  results?: string;
  link?: string;
}

export interface Certification {
  id: string;
  name: string;
  issuing_organization: string;
  issue_date?: string;
  credential_id?: string;
  credential_url?: string;
}

export interface FullProfile {
  user: User;
  profile: Profile;
  educations: Education[];
  experiences: Experience[];
  skills: Skill[];
  projects: Project[];
  certifications: Certification[];
  completion_percentage?: number;
  completion_breakdown?: {
    contact_info: boolean;
    headline_and_summary: boolean;
    experience: boolean;
    education: boolean;
    skills: boolean;
    projects_or_certifications: boolean;
    experience_count: number;
    education_count: number;
    skills_count: number;
    projects_count: number;
    certifications_count: number;
  };
}

export interface Resume {
  id: string;
  user_id: string;
  title: string;
  target_role?: string;
  template_name: string;
  content_json: Record<string, any>;
  raw_text?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ResumeAnalysis {
  id?: string;
  user_id?: string;
  filename?: string;
  overall_score: number;
  ats_score: number;
  content_score: number;
  keyword_score: number;
  formatting_score: number;
  strengths: string[];
  weaknesses: string[];
  missing_keywords: string[];
  recommendations: string[];
  extracted_text?: string;
  created_at?: string;
}

export interface JobDescription {
  id: string;
  title: string;
  company?: string;
  raw_text: string;
  required_skills: string[];
  preferred_skills: string[];
  experience_requirements?: string;
  education_requirements?: string;
  responsibilities: string[];
  keywords: string[];
  created_at?: string;
}

export interface JobMatch {
  id?: string;
  job_title: string;
  company?: string;
  overall_match_score: number;
  ats_compatibility_score: number;
  skill_match_score: number;
  experience_match_score: number;
  matched_skills: string[];
  missing_skills: string[];
  matched_keywords: string[];
  missing_keywords: string[];
  recommendations: string[];
  alignment_summary?: string;
  created_at?: string;
}

export interface STAREvaluation {
  situation: boolean;
  task: boolean;
  action: boolean;
  result: boolean;
  missing?: string;
  suggestion?: string;
}

export interface InterviewQuestion {
  id: string;
  question_number: number;
  question_text: string;
  question_type?: string;
  expected_topics: string[];
  answer?: {
    id: string;
    answer_text: string;
    duration_seconds: number;
  };
  feedback?: {
    overall_score: number;
    content_score: number;
    technical_score: number;
    communication_score: number;
    structure_score: number;
    relevance_score: number;
    feedback_text: string;
    follow_up_question?: string;
    strengths: string[];
    improvements: string[];
    star_evaluation?: STAREvaluation;
  };
}

export interface InterviewSession {
  id: string;
  target_role: string;
  experience_level: string;
  interview_type: string;
  difficulty: string;
  total_questions: number;
  status: string;
  overall_score?: number;
  content_score?: number;
  technical_score?: number;
  communication_score?: number;
  structure_score?: number;
  relevance_score?: number;
  summary_strengths: string[];
  summary_improvements: string[];
  recommended_practice: string[];
  final_report?: string;
  questions?: InterviewQuestion[];
  created_at?: string;
}

export interface STARAnalysisResult {
  situation_present: boolean;
  situation_details?: string;
  task_present: boolean;
  task_details?: string;
  action_present: boolean;
  action_details?: string;
  result_present: boolean;
  result_details?: string;
  missing_components: string[];
  restructured_answer?: string;
  actionable_suggestions: string[];
  score: number;
}

export interface DashboardStats {
  profile_completion_percentage: number;
  latest_resume_score?: number;
  latest_ats_score?: number;
  average_interview_score?: number;
  total_interviews_completed: number;
  total_resumes_created: number;
  total_skills_count: number;
  top_matched_role?: string;
  recent_activities: Array<{
    id?: string;
    type: string;
    title: string;
    timestamp: string;
    badge: string;
  }>;
  skill_categories_breakdown: Record<string, number>;
}

export interface SettingsStatus {
  has_ai_api_key: boolean;
  ai_api_base_url: string;
  ai_model: string;
  database_connected: boolean;
  database_type: string;
  mongodb_connected?: boolean;
  mongodb_database?: string;
  mongodb_cluster?: string;
  mongodb_collections?: Record<string, number>;
  mongodb_error?: string | null;
}

