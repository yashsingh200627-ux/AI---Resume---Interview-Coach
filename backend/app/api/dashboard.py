from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database.session import get_db
from app.models.models import (
    User, Profile, Education, Experience, Skill, Project, Certification,
    Resume, ResumeAnalysis, JobMatch, InterviewSession
)
from app.schemas.schemas import DashboardStatsResponse
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/stats", response_model=DashboardStatsResponse)
def get_dashboard_stats(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # 1. Profile completion calculation
    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    has_contact = bool(current_user.full_name and current_user.email and (current_user.phone or (profile and profile.location)))
    has_summary = bool(profile and ((profile.headline and len(profile.headline.strip()) > 2) or (profile.summary and len(profile.summary.strip()) > 5)))
    
    edu_count = db.query(Education).filter(Education.user_id == current_user.id).count()
    exp_count = db.query(Experience).filter(Experience.user_id == current_user.id).count()
    skills_count = db.query(Skill).filter(Skill.user_id == current_user.id).count()
    proj_count = db.query(Project).filter(Project.user_id == current_user.id).count()
    cert_count = db.query(Certification).filter(Certification.user_id == current_user.id).count()

    score = 0.0
    if has_contact: score += 20.0
    if has_summary: score += 15.0
    if exp_count > 0: score += 20.0
    if edu_count > 0: score += 15.0
    if skills_count >= 3: score += 15.0
    elif skills_count > 0: score += 8.0
    if proj_count > 0 or cert_count > 0: score += 15.0
    profile_completion = min(100.0, round(score, 1))

    # 2. Latest Resume Analysis Score
    latest_resume_analysis = db.query(ResumeAnalysis).filter(
        ResumeAnalysis.user_id == current_user.id
    ).order_by(ResumeAnalysis.created_at.desc()).first()
    latest_resume_score = latest_resume_analysis.overall_score if latest_resume_analysis else None

    # 3. Latest ATS Score
    latest_match = db.query(JobMatch).filter(
        JobMatch.user_id == current_user.id
    ).order_by(JobMatch.created_at.desc()).first()
    if latest_match:
        latest_ats_score = latest_match.ats_compatibility_score
    elif latest_resume_analysis:
        latest_ats_score = latest_resume_analysis.ats_score
    else:
        latest_ats_score = None

    # 4. Interview Performance
    completed_interviews = db.query(InterviewSession).filter(
        InterviewSession.user_id == current_user.id,
        InterviewSession.status == "completed",
        InterviewSession.overall_score.isnot(None)
    ).all()

    if completed_interviews:
        avg_interview = sum(i.overall_score for i in completed_interviews) / len(completed_interviews)
        avg_interview_score = round(avg_interview, 1)
    else:
        avg_interview_score = None

    total_interviews_completed = len(completed_interviews)
    total_resumes_created = db.query(Resume).filter(Resume.user_id == current_user.id).count()

    # 5. Skills breakdown
    skills = db.query(Skill).filter(Skill.user_id == current_user.id).all()
    categories_breakdown = {}
    for s in skills:
        cat = s.category or "General"
        categories_breakdown[cat] = categories_breakdown.get(cat, 0) + 1

    # 6. Top matched role
    top_matched_role = latest_match.job_description.title if (latest_match and latest_match.job_description) else current_user.target_job_role

    # 7. Recent activities (chronological from DB)
    activities = []
    
    # Recent resumes
    recent_resumes = db.query(Resume).filter(Resume.user_id == current_user.id).order_by(Resume.created_at.desc()).limit(3).all()
    for r in recent_resumes:
        activities.append({
            "type": "resume_created",
            "title": f"Created Resume: {r.title}",
            "timestamp": r.created_at,
            "badge": "Resume"
        })

    # Recent analyses
    recent_analyses = db.query(ResumeAnalysis).filter(ResumeAnalysis.user_id == current_user.id).order_by(ResumeAnalysis.created_at.desc()).limit(3).all()
    for a in recent_analyses:
        activities.append({
            "type": "resume_analyzed",
            "title": f"Resume Evaluated: Score {a.overall_score}%",
            "timestamp": a.created_at,
            "badge": "Analysis"
        })

    # Recent matches
    recent_matches = db.query(JobMatch).filter(JobMatch.user_id == current_user.id).order_by(JobMatch.created_at.desc()).limit(3).all()
    for m in recent_matches:
        activities.append({
            "type": "job_match",
            "title": f"ATS Match Scan: {m.overall_match_score}% Match",
            "timestamp": m.created_at,
            "badge": "ATS Match"
        })

    # Recent interviews
    recent_sessions = db.query(InterviewSession).filter(InterviewSession.user_id == current_user.id).order_by(InterviewSession.created_at.desc()).limit(3).all()
    for s in recent_sessions:
        activities.append({
            "type": "interview_session",
            "title": f"{s.interview_type} Interview Practice ({s.status})",
            "timestamp": s.created_at,
            "badge": "Interview"
        })

    # Sort activities by timestamp descending
    activities.sort(key=lambda x: x["timestamp"] if x["timestamp"] else 0, reverse=True)
    recent_activities = activities[:6]

    return {
        "profile_completion_percentage": profile_completion,
        "latest_resume_score": latest_resume_score,
        "latest_ats_score": latest_ats_score,
        "average_interview_score": avg_interview_score,
        "total_interviews_completed": total_interviews_completed,
        "total_resumes_created": total_resumes_created,
        "total_skills_count": skills_count,
        "top_matched_role": top_matched_role,
        "recent_activities": recent_activities,
        "skill_categories_breakdown": categories_breakdown
    }
