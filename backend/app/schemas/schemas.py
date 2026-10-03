from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

# ----------------- Auth Schemas -----------------
class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    full_name: str
    phone: Optional[str] = None
    experience_level: Optional[str] = "Mid-Level"
    target_job_role: Optional[str] = "Software Engineer"

class UserLogin(BaseModel):
    email: EmailStr
    password: str
    remember_me: Optional[bool] = False

class UserResponse(BaseModel):
    id: str
    email: EmailStr
    full_name: str
    phone: Optional[str] = None
    experience_level: Optional[str] = None
    target_job_role: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class TokenData(BaseModel):
    email: Optional[str] = None
    user_id: Optional[str] = None

# ----------------- Profile Schemas -----------------
class ProfileBase(BaseModel):
    headline: Optional[str] = None
    summary: Optional[str] = None
    location: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    portfolio_url: Optional[str] = None

class ProfileUpdate(ProfileBase):
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    target_job_role: Optional[str] = None
    experience_level: Optional[str] = None

class ProfileResponse(ProfileBase):
    id: str
    user_id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# ----------------- Education Schemas -----------------
class EducationCreate(BaseModel):
    degree: str
    institution: str
    start_year: Optional[str] = None
    end_year: Optional[str] = None
    grade: Optional[str] = None
    field_of_study: Optional[str] = None

class EducationResponse(EducationCreate):
    id: str
    user_id: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# ----------------- Experience Schemas -----------------
class ExperienceCreate(BaseModel):
    company: str
    job_title: str
    location: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    is_current: Optional[bool] = False
    responsibilities: Optional[str] = None
    achievements: Optional[str] = None

class ExperienceResponse(ExperienceCreate):
    id: str
    user_id: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# ----------------- Skill Schemas -----------------
class SkillCreate(BaseModel):
    name: str
    category: Optional[str] = "Technical" # Technical, Soft Skills, Tools, Technologies
    proficiency: Optional[str] = "Intermediate"

class SkillResponse(SkillCreate):
    id: str
    user_id: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# ----------------- Project Schemas -----------------
class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None
    technologies: Optional[str] = None
    responsibilities: Optional[str] = None
    results: Optional[str] = None
    link: Optional[str] = None

class ProjectResponse(ProjectCreate):
    id: str
    user_id: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# ----------------- Certification Schemas -----------------
class CertificationCreate(BaseModel):
    name: str
    issuing_organization: str
    issue_date: Optional[str] = None
    credential_id: Optional[str] = None
    credential_url: Optional[str] = None

class CertificationResponse(CertificationCreate):
    id: str
    user_id: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# ----------------- Full Profile Aggregation -----------------
class FullProfileResponse(BaseModel):
    user: UserResponse
    profile: Optional[ProfileResponse] = None
    educations: List[EducationResponse] = []
    experiences: List[ExperienceResponse] = []
    skills: List[SkillResponse] = []
    projects: List[ProjectResponse] = []
    certifications: List[CertificationResponse] = []
    completion_percentage: float = 0.0
    completion_breakdown: Optional[Dict[str, Any]] = None

# ----------------- Resume Schemas -----------------
class ResumeContent(BaseModel):
    personal_info: Optional[Dict[str, Any]] = None
    summary: Optional[str] = None
    experiences: Optional[List[Dict[str, Any]]] = None
    educations: Optional[List[Dict[str, Any]]] = None
    skills: Optional[Dict[str, List[str]]] = None
    projects: Optional[List[Dict[str, Any]]] = None
    certifications: Optional[List[Dict[str, Any]]] = None

class ResumeCreate(BaseModel):
    title: str
    target_role: Optional[str] = "Software Engineer"
    template_name: Optional[str] = "modern"
    content_json: Dict[str, Any]
    raw_text: Optional[str] = None

class ResumeUpdate(BaseModel):
    title: Optional[str] = None
    target_role: Optional[str] = None
    template_name: Optional[str] = None
    content_json: Optional[Dict[str, Any]] = None
    raw_text: Optional[str] = None

class ResumeResponse(BaseModel):
    id: str
    user_id: str
    title: str
    target_role: Optional[str] = None
    template_name: str
    content_json: Dict[str, Any]
    raw_text: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ResumeGenerateRequest(BaseModel):
    target_role: str
    experience_level: Optional[str] = "Mid-Level"
    focus_keywords: Optional[List[str]] = []
    user_notes: Optional[str] = None

# ----------------- Analysis Schemas -----------------
class ResumeAnalysisResponse(BaseModel):
    id: Optional[str] = None
    user_id: Optional[str] = None
    filename: Optional[str] = None
    overall_score: float
    ats_score: float
    content_score: float
    keyword_score: float
    formatting_score: float
    strengths: List[str] = []
    weaknesses: List[str] = []
    missing_keywords: List[str] = []
    recommendations: List[str] = []
    extracted_text: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# ----------------- Job Description & Matching Schemas -----------------
class JobDescriptionCreate(BaseModel):
    title: str
    company: Optional[str] = None
    raw_text: str

class JobDescriptionResponse(BaseModel):
    id: str
    user_id: str
    title: str
    company: Optional[str] = None
    raw_text: str
    required_skills: List[str] = []
    preferred_skills: List[str] = []
    experience_requirements: Optional[str] = None
    education_requirements: Optional[str] = None
    responsibilities: List[str] = []
    keywords: List[str] = []
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ATSAnalysisRequest(BaseModel):
    resume_id: Optional[str] = None
    resume_text: Optional[str] = None
    job_description: str
    job_title: Optional[str] = None

class JobMatchResponse(BaseModel):
    id: Optional[str] = None
    job_title: str
    company: Optional[str] = None
    overall_match_score: float
    ats_compatibility_score: float
    skill_match_score: float
    experience_match_score: float
    matched_skills: List[str] = []
    missing_skills: List[str] = []
    matched_keywords: List[str] = []
    missing_keywords: List[str] = []
    recommendations: List[str] = []
    alignment_summary: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# ----------------- Interview Schemas -----------------
class InterviewStartRequest(BaseModel):
    target_role: str
    experience_level: str = "Intermediate"
    interview_type: str = "Technical" # HR, Technical, Behavioral, Situational, Role-specific
    difficulty: str = "Intermediate"
    total_questions: int = Field(default=5, ge=1, le=10)

class InterviewQuestionResponse(BaseModel):
    id: str
    question_number: int
    question_text: str
    question_type: Optional[str] = None
    expected_topics: List[str] = []

    class Config:
        from_attributes = True

class InterviewAnswerSubmit(BaseModel):
    session_id: str
    question_id: str
    answer_text: str
    duration_seconds: Optional[int] = 0

class STAREvaluation(BaseModel):
    situation: bool
    task: bool
    action: bool
    result: bool
    missing: Optional[str] = None
    suggestion: Optional[str] = None

class InterviewFeedbackResponse(BaseModel):
    overall_score: float
    content_score: float
    technical_score: float
    communication_score: float
    structure_score: float
    relevance_score: float
    feedback_text: str
    follow_up_question: Optional[str] = None
    strengths: List[str] = []
    improvements: List[str] = []
    star_evaluation: Optional[STAREvaluation] = None
    next_question: Optional[InterviewQuestionResponse] = None
    is_completed: bool = False

class InterviewSessionDetail(BaseModel):
    id: str
    target_role: str
    experience_level: str
    interview_type: str
    difficulty: str
    total_questions: int
    status: str
    overall_score: Optional[float] = None
    content_score: Optional[float] = None
    technical_score: Optional[float] = None
    communication_score: Optional[float] = None
    structure_score: Optional[float] = None
    relevance_score: Optional[float] = None
    summary_strengths: List[str] = []
    summary_improvements: List[str] = []
    recommended_practice: List[str] = []
    final_report: Optional[str] = None
    questions: List[Dict[str, Any]] = []
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# ----------------- STAR Schemas -----------------
class STARAnalysisRequest(BaseModel):
    target_role: Optional[str] = None
    question: str
    answer: str

class STARAnalysisResponse(BaseModel):
    situation_present: bool
    situation_details: Optional[str] = None
    task_present: bool
    task_details: Optional[str] = None
    action_present: bool
    action_details: Optional[str] = None
    result_present: bool
    result_details: Optional[str] = None
    missing_components: List[str] = []
    restructured_answer: Optional[str] = None
    actionable_suggestions: List[str] = []
    score: float

# ----------------- Career Chat Schemas -----------------
class CareerChatMessageRequest(BaseModel):
    message: str
    session_id: Optional[str] = None

class CareerRoadmapRequest(BaseModel):
    target_role: str
    current_level: Optional[str] = "Current Profile"
    timeline_months: Optional[int] = 6

# ----------------- Dashboard Schemas -----------------
class DashboardStatsResponse(BaseModel):
    profile_completion_percentage: float
    latest_resume_score: Optional[float] = None
    latest_ats_score: Optional[float] = None
    average_interview_score: Optional[float] = None
    total_interviews_completed: int
    total_resumes_created: int
    total_skills_count: int
    top_matched_role: Optional[str] = None
    recent_activities: List[Dict[str, Any]] = []
    skill_categories_breakdown: Dict[str, int] = {}

# ----------------- Settings Schemas -----------------
class SettingsUpdate(BaseModel):
    ai_api_key: Optional[str] = None
    ai_api_base_url: Optional[str] = None
    ai_model: Optional[str] = None

class SettingsStatusResponse(BaseModel):
    has_ai_api_key: bool
    ai_api_base_url: str
    ai_model: str
    database_connected: bool
    database_type: str
    mongodb_connected: bool = False
    mongodb_database: Optional[str] = None
    mongodb_cluster: Optional[str] = None
    mongodb_collections: Optional[Dict[str, int]] = None
    mongodb_error: Optional[str] = None
