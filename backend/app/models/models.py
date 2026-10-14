import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Text, Boolean, Integer, Float, DateTime, ForeignKey, JSON
)
from sqlalchemy.orm import relationship
from app.database.session import Base

def generate_uuid():
    return str(uuid.uuid4())

def get_utc_now():
    return datetime.now(timezone.utc)

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    phone = Column(String(50), nullable=True)
    experience_level = Column(String(50), default="Mid-Level")
    target_job_role = Column(String(255), default="Software Engineer")
    created_at = Column(DateTime(timezone=True), default=get_utc_now)
    updated_at = Column(DateTime(timezone=True), default=get_utc_now, onupdate=get_utc_now)
    activity_cleared_at = Column(DateTime(timezone=True), nullable=True)
    hidden_activity_ids = Column(JSON, default=list, nullable=True)

    # Relationships
    profile = relationship("Profile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    educations = relationship("Education", back_populates="user", cascade="all, delete-orphan")
    experiences = relationship("Experience", back_populates="user", cascade="all, delete-orphan")
    skills = relationship("Skill", back_populates="user", cascade="all, delete-orphan")
    projects = relationship("Project", back_populates="user", cascade="all, delete-orphan")
    certifications = relationship("Certification", back_populates="user", cascade="all, delete-orphan")
    resumes = relationship("Resume", back_populates="user", cascade="all, delete-orphan")
    resume_analyses = relationship("ResumeAnalysis", back_populates="user", cascade="all, delete-orphan")
    job_descriptions = relationship("JobDescription", back_populates="user", cascade="all, delete-orphan")
    job_matches = relationship("JobMatch", back_populates="user", cascade="all, delete-orphan")
    interview_sessions = relationship("InterviewSession", back_populates="user", cascade="all, delete-orphan")
    career_chat_sessions = relationship("CareerChatSession", back_populates="user", cascade="all, delete-orphan")
    career_recommendations = relationship("CareerRecommendation", back_populates="user", cascade="all, delete-orphan")
    skill_gaps = relationship("SkillGap", back_populates="user", cascade="all, delete-orphan")

class Profile(Base):
    __tablename__ = "profiles"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    headline = Column(String(255), nullable=True)
    summary = Column(Text, nullable=True)
    location = Column(String(255), nullable=True)
    linkedin_url = Column(String(255), nullable=True)
    github_url = Column(String(255), nullable=True)
    portfolio_url = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), default=get_utc_now)
    updated_at = Column(DateTime(timezone=True), default=get_utc_now, onupdate=get_utc_now)

    user = relationship("User", back_populates="profile")

class Education(Base):
    __tablename__ = "educations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    degree = Column(String(255), nullable=False)
    institution = Column(String(255), nullable=False)
    start_year = Column(String(50), nullable=True)
    end_year = Column(String(50), nullable=True)
    grade = Column(String(50), nullable=True)
    field_of_study = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), default=get_utc_now)
    updated_at = Column(DateTime(timezone=True), default=get_utc_now, onupdate=get_utc_now)

    user = relationship("User", back_populates="educations")

class Experience(Base):
    __tablename__ = "experiences"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    company = Column(String(255), nullable=False)
    job_title = Column(String(255), nullable=False)
    location = Column(String(255), nullable=True)
    start_date = Column(String(50), nullable=True)
    end_date = Column(String(50), nullable=True)
    is_current = Column(Boolean, default=False)
    responsibilities = Column(Text, nullable=True)
    achievements = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=get_utc_now)
    updated_at = Column(DateTime(timezone=True), default=get_utc_now, onupdate=get_utc_now)

    user = relationship("User", back_populates="experiences")

class Skill(Base):
    __tablename__ = "skills"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False)
    category = Column(String(50), default="Technical") # Technical, Soft Skills, Tools, Technologies
    proficiency = Column(String(50), default="Intermediate") # Beginner, Intermediate, Advanced, Expert
    created_at = Column(DateTime(timezone=True), default=get_utc_now)

    user = relationship("User", back_populates="skills")

class Project(Base):
    __tablename__ = "projects"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    technologies = Column(String(255), nullable=True)
    responsibilities = Column(Text, nullable=True)
    results = Column(Text, nullable=True)
    link = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), default=get_utc_now)
    updated_at = Column(DateTime(timezone=True), default=get_utc_now, onupdate=get_utc_now)

    user = relationship("User", back_populates="projects")

class Certification(Base):
    __tablename__ = "certifications"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    issuing_organization = Column(String(255), nullable=False)
    issue_date = Column(String(50), nullable=True)
    credential_id = Column(String(255), nullable=True)
    credential_url = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), default=get_utc_now)

    user = relationship("User", back_populates="certifications")

class Resume(Base):
    __tablename__ = "resumes"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    target_role = Column(String(255), nullable=True)
    template_name = Column(String(100), default="modern")
    content_json = Column(JSON, nullable=False, default=dict)
    raw_text = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=get_utc_now)
    updated_at = Column(DateTime(timezone=True), default=get_utc_now, onupdate=get_utc_now)

    user = relationship("User", back_populates="resumes")
    versions = relationship("ResumeVersion", back_populates="resume", cascade="all, delete-orphan")
    analyses = relationship("ResumeAnalysis", back_populates="resume")

class ResumeVersion(Base):
    __tablename__ = "resume_versions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    resume_id = Column(String(36), ForeignKey("resumes.id", ondelete="CASCADE"), nullable=False)
    version_number = Column(Integer, nullable=False)
    snapshot_json = Column(JSON, nullable=False)
    change_summary = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), default=get_utc_now)

    resume = relationship("Resume", back_populates="versions")

class ResumeAnalysis(Base):
    __tablename__ = "resume_analyses"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    resume_id = Column(String(36), ForeignKey("resumes.id", ondelete="SET NULL"), nullable=True)
    filename = Column(String(255), nullable=True)
    overall_score = Column(Float, nullable=False)
    ats_score = Column(Float, nullable=False)
    content_score = Column(Float, nullable=False)
    keyword_score = Column(Float, nullable=False)
    formatting_score = Column(Float, nullable=False)
    strengths = Column(JSON, default=list)
    weaknesses = Column(JSON, default=list)
    missing_keywords = Column(JSON, default=list)
    recommendations = Column(JSON, default=list)
    extracted_text = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=get_utc_now)

    user = relationship("User", back_populates="resume_analyses")
    resume = relationship("Resume", back_populates="analyses")

class JobDescription(Base):
    __tablename__ = "job_descriptions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    company = Column(String(255), nullable=True)
    raw_text = Column(Text, nullable=False)
    required_skills = Column(JSON, default=list)
    preferred_skills = Column(JSON, default=list)
    experience_requirements = Column(Text, nullable=True)
    education_requirements = Column(Text, nullable=True)
    responsibilities = Column(JSON, default=list)
    keywords = Column(JSON, default=list)
    created_at = Column(DateTime(timezone=True), default=get_utc_now)

    user = relationship("User", back_populates="job_descriptions")
    job_matches = relationship("JobMatch", back_populates="job_description", cascade="all, delete-orphan")

class JobMatch(Base):
    __tablename__ = "job_matches"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    resume_id = Column(String(36), ForeignKey("resumes.id", ondelete="SET NULL"), nullable=True)
    job_description_id = Column(String(36), ForeignKey("job_descriptions.id", ondelete="CASCADE"), nullable=False)
    overall_match_score = Column(Float, nullable=False)
    ats_compatibility_score = Column(Float, nullable=False)
    skill_match_score = Column(Float, nullable=False)
    experience_match_score = Column(Float, nullable=False)
    matched_skills = Column(JSON, default=list)
    missing_skills = Column(JSON, default=list)
    matched_keywords = Column(JSON, default=list)
    missing_keywords = Column(JSON, default=list)
    recommendations = Column(JSON, default=list)
    alignment_summary = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=get_utc_now)

    user = relationship("User", back_populates="job_matches")
    resume = relationship("Resume")
    job_description = relationship("JobDescription", back_populates="job_matches")

class InterviewSession(Base):
    __tablename__ = "interview_sessions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    target_role = Column(String(255), nullable=False)
    experience_level = Column(String(50), nullable=False)
    interview_type = Column(String(50), nullable=False) # HR, Technical, Behavioral, Situational, Role-specific
    difficulty = Column(String(50), nullable=False) # Entry, Intermediate, Advanced
    total_questions = Column(Integer, default=5)
    status = Column(String(50), default="in_progress") # in_progress, completed, abandoned
    overall_score = Column(Float, nullable=True)
    content_score = Column(Float, nullable=True)
    technical_score = Column(Float, nullable=True)
    communication_score = Column(Float, nullable=True)
    structure_score = Column(Float, nullable=True)
    relevance_score = Column(Float, nullable=True)
    summary_strengths = Column(JSON, default=list)
    summary_improvements = Column(JSON, default=list)
    recommended_practice = Column(JSON, default=list)
    final_report = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=get_utc_now)
    updated_at = Column(DateTime(timezone=True), default=get_utc_now, onupdate=get_utc_now)

    user = relationship("User", back_populates="interview_sessions")
    questions = relationship("InterviewQuestion", back_populates="session", cascade="all, delete-orphan", order_by="InterviewQuestion.question_number")

class InterviewQuestion(Base):
    __tablename__ = "interview_questions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    session_id = Column(String(36), ForeignKey("interview_sessions.id", ondelete="CASCADE"), nullable=False)
    question_number = Column(Integer, nullable=False)
    question_text = Column(Text, nullable=False)
    question_type = Column(String(50), nullable=True)
    expected_topics = Column(JSON, default=list)
    created_at = Column(DateTime(timezone=True), default=get_utc_now)

    session = relationship("InterviewSession", back_populates="questions")
    answer = relationship("InterviewAnswer", back_populates="question", uselist=False, cascade="all, delete-orphan")

class InterviewAnswer(Base):
    __tablename__ = "interview_answers"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    question_id = Column(String(36), ForeignKey("interview_questions.id", ondelete="CASCADE"), unique=True, nullable=False)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    answer_text = Column(Text, nullable=False)
    duration_seconds = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), default=get_utc_now)

    question = relationship("InterviewQuestion", back_populates="answer")
    feedback = relationship("InterviewFeedback", back_populates="answer", uselist=False, cascade="all, delete-orphan")

class InterviewFeedback(Base):
    __tablename__ = "interview_feedback"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    answer_id = Column(String(36), ForeignKey("interview_answers.id", ondelete="CASCADE"), unique=True, nullable=False)
    overall_score = Column(Float, nullable=False)
    content_score = Column(Float, nullable=False)
    technical_score = Column(Float, nullable=False)
    communication_score = Column(Float, nullable=False)
    structure_score = Column(Float, nullable=False)
    relevance_score = Column(Float, nullable=False)
    feedback_text = Column(Text, nullable=False)
    follow_up_question = Column(Text, nullable=True)
    strengths = Column(JSON, default=list)
    improvements = Column(JSON, default=list)
    star_evaluation = Column(JSON, nullable=True) # {situation: bool, task: bool, action: bool, result: bool, missing: str, suggestion: str}
    created_at = Column(DateTime(timezone=True), default=get_utc_now)

    answer = relationship("InterviewAnswer", back_populates="feedback")

class CareerChatSession(Base):
    __tablename__ = "career_chat_sessions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), default="Career Consultation")
    created_at = Column(DateTime(timezone=True), default=get_utc_now)
    updated_at = Column(DateTime(timezone=True), default=get_utc_now, onupdate=get_utc_now)

    user = relationship("User", back_populates="career_chat_sessions")
    messages = relationship("CareerChatMessage", back_populates="session", cascade="all, delete-orphan", order_by="CareerChatMessage.created_at")

class CareerChatMessage(Base):
    __tablename__ = "career_chat_messages"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    session_id = Column(String(36), ForeignKey("career_chat_sessions.id", ondelete="CASCADE"), nullable=False)
    sender = Column(String(20), nullable=False) # 'user' or 'assistant'
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), default=get_utc_now)

    session = relationship("CareerChatSession", back_populates="messages")

class CareerRecommendation(Base):
    __tablename__ = "career_recommendations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    category = Column(String(100), nullable=False) # 'skills', 'job_roles', 'resume', 'roadmap'
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    priority = Column(String(50), default="Medium") # High, Medium, Low
    action_items = Column(JSON, default=list)
    created_at = Column(DateTime(timezone=True), default=get_utc_now)

    user = relationship("User", back_populates="career_recommendations")

class SkillGap(Base):
    __tablename__ = "skill_gaps"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    target_role = Column(String(255), nullable=False)
    skill_name = Column(String(100), nullable=False)
    importance_level = Column(String(50), default="High") # Critical, High, Medium, Low
    recommended_learning = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=get_utc_now)

    user = relationship("User", back_populates="skill_gaps")

# -----------------------------------------
# ADMIN PANEL MODELS
# -----------------------------------------

class AdminUser(Base):
    __tablename__ = "admin_users"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role_id = Column(String(36), ForeignKey("admin_roles.id"), nullable=True)
    status = Column(String(50), default="active") # active, suspended
    last_login_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=get_utc_now)
    updated_at = Column(DateTime(timezone=True), default=get_utc_now, onupdate=get_utc_now)

    role = relationship("AdminRole", back_populates="users")
    audit_logs = relationship("AdminAuditLog", back_populates="admin")

class AdminRole(Base):
    __tablename__ = "admin_roles"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(100), unique=True, nullable=False) # SUPER_ADMIN, ADMIN, SUPPORT, ANALYST
    description = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), default=get_utc_now)

    users = relationship("AdminUser", back_populates="role")
    permissions = relationship("AdminRolePermission", back_populates="role", cascade="all, delete-orphan")

class AdminPermission(Base):
    __tablename__ = "admin_permissions"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    resource = Column(String(100), nullable=False) # users, resumes, interviews, ai_usage, jobs, settings, admins
    action = Column(String(100), nullable=False) # create, read, update, delete, manage
    created_at = Column(DateTime(timezone=True), default=get_utc_now)

    role_permissions = relationship("AdminRolePermission", back_populates="permission", cascade="all, delete-orphan")

class AdminRolePermission(Base):
    __tablename__ = "admin_role_permissions"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    role_id = Column(String(36), ForeignKey("admin_roles.id", ondelete="CASCADE"), nullable=False)
    permission_id = Column(String(36), ForeignKey("admin_permissions.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime(timezone=True), default=get_utc_now)

    role = relationship("AdminRole", back_populates="permissions")
    permission = relationship("AdminPermission", back_populates="role_permissions")

class AdminAuditLog(Base):
    __tablename__ = "admin_audit_logs"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    admin_id = Column(String(36), ForeignKey("admin_users.id", ondelete="SET NULL"), nullable=True)
    action = Column(String(255), nullable=False) # e.g., 'User Suspended', 'Settings Changed'
    resource_type = Column(String(100), nullable=True) # e.g., 'user', 'resume', 'settings'
    resource_id = Column(String(255), nullable=True)
    ip_address = Column(String(50), nullable=True)
    user_agent = Column(Text, nullable=True)
    metadata_json = Column(JSON, default=dict)
    created_at = Column(DateTime(timezone=True), default=get_utc_now)

    admin = relationship("AdminUser", back_populates="audit_logs")

class AIUsageLog(Base):
    __tablename__ = "ai_usage_logs"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    feature = Column(String(100), nullable=False) # Resume AI, Interview Coach, Job Match AI, etc.
    model = Column(String(100), nullable=False) # e.g., gpt-4, claude-3
    status = Column(String(50), nullable=False) # SUCCESS, FAILED
    prompt_tokens = Column(Integer, default=0)
    completion_tokens = Column(Integer, default=0)
    total_tokens = Column(Integer, default=0)
    response_time_ms = Column(Integer, default=0)
    error_message = Column(Text, nullable=True)
    cost = Column(Float, default=0.0)
    created_at = Column(DateTime(timezone=True), default=get_utc_now)

    user = relationship("User")

class SystemSettings(Base):
    __tablename__ = "system_settings"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    category = Column(String(100), nullable=False) # AI, App, Interview
    key = Column(String(100), unique=True, nullable=False)
    value_type = Column(String(50), default="string") # string, integer, boolean, json
    value = Column(Text, nullable=True)
    updated_by = Column(String(36), ForeignKey("admin_users.id", ondelete="SET NULL"), nullable=True)
    updated_at = Column(DateTime(timezone=True), default=get_utc_now, onupdate=get_utc_now)

class Notification(Base):
    __tablename__ = "notifications"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String(50), nullable=False) # Information, Announcement, Maintenance, System Alert
    audience = Column(String(50), nullable=False) # All Users, Students, Professionals, etc.
    start_date = Column(DateTime(timezone=True), nullable=True)
    end_date = Column(DateTime(timezone=True), nullable=True)
    status = Column(String(50), default="active") # active, inactive, drafted
    created_by = Column(String(36), ForeignKey("admin_users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=get_utc_now)
    updated_at = Column(DateTime(timezone=True), default=get_utc_now, onupdate=get_utc_now)
