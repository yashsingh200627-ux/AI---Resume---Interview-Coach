from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime
from typing import Any
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
    cleared_at = getattr(current_user, "activity_cleared_at", None)
    if isinstance(cleared_at, str):
        try:
            cleared_at = datetime.fromisoformat(cleared_at.replace("Z", "+00:00"))
        except Exception:
            cleared_at = None

    raw_hidden = getattr(current_user, "hidden_activity_ids", None) or []
    hidden_ids = set(raw_hidden if isinstance(raw_hidden, list) else [])

    def is_visible(act_id: str, ts: Any) -> bool:
        if act_id in hidden_ids:
            return False
        if cleared_at and ts:
            ts_dt = ts
            if isinstance(ts_dt, str):
                try:
                    ts_dt = datetime.fromisoformat(ts_dt.replace("Z", "+00:00"))
                except Exception:
                    pass
            if isinstance(ts_dt, datetime):
                ts_naive = ts_dt.replace(tzinfo=None)
                cl_naive = cleared_at.replace(tzinfo=None) if isinstance(cleared_at, datetime) else None
                if cl_naive and ts_naive <= cl_naive:
                    return False
        return True

    activities = []
    
    # Recent resumes
    recent_resumes = db.query(Resume).filter(Resume.user_id == current_user.id).order_by(Resume.created_at.desc()).limit(10).all()
    for r in recent_resumes:
        r_id = str(getattr(r, "id", None) or getattr(r, "_id", ""))
        if is_visible(r_id, r.created_at):
            activities.append({
                "id": r_id,
                "type": "resume_created",
                "title": f"Created Resume: {r.title}",
                "timestamp": r.created_at,
                "badge": "Resume"
            })

    # Recent analyses
    recent_analyses = db.query(ResumeAnalysis).filter(ResumeAnalysis.user_id == current_user.id).order_by(ResumeAnalysis.created_at.desc()).limit(10).all()
    for a in recent_analyses:
        a_id = str(getattr(a, "id", None) or getattr(a, "_id", ""))
        if is_visible(a_id, a.created_at):
            activities.append({
                "id": a_id,
                "type": "resume_analyzed",
                "title": f"Resume Evaluated: Score {a.overall_score}%",
                "timestamp": a.created_at,
                "badge": "Analysis"
            })

    # Recent matches
    recent_matches = db.query(JobMatch).filter(JobMatch.user_id == current_user.id).order_by(JobMatch.created_at.desc()).limit(10).all()
    for m in recent_matches:
        m_id = str(getattr(m, "id", None) or getattr(m, "_id", ""))
        if is_visible(m_id, m.created_at):
            activities.append({
                "id": m_id,
                "type": "job_match",
                "title": f"ATS Match Scan: {m.overall_match_score}% Match",
                "timestamp": m.created_at,
                "badge": "ATS Match"
            })

    # Recent interviews
    recent_sessions = db.query(InterviewSession).filter(InterviewSession.user_id == current_user.id).order_by(InterviewSession.created_at.desc()).limit(10).all()
    for s in recent_sessions:
        s_id = str(getattr(s, "id", None) or getattr(s, "_id", ""))
        if is_visible(s_id, s.created_at):
            activities.append({
                "id": s_id,
                "type": "interview_session",
                "title": f"{s.interview_type} Interview Practice ({s.status})",
                "timestamp": s.created_at,
                "badge": "Interview"
            })

    # Sort activities by timestamp descending
    activities.sort(key=lambda x: str(x["timestamp"] if x["timestamp"] else ""), reverse=True)
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


@router.delete("/activities")
def clear_all_activities(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    now = datetime.utcnow()
    current_user.activity_cleared_at = now
    current_user.hidden_activity_ids = []
    db.add(current_user)
    db.commit()

    if hasattr(db, "get_collection"):
        col = db.get_collection("users")
        if col is not None:
            col.update_one(
                {"$or": [{"id": current_user.id}, {"_id": current_user.id}]},
                {"$set": {"activity_cleared_at": now.isoformat(), "hidden_activity_ids": []}}
            )
    return {"message": "All recent activities cleared successfully"}


@router.delete("/activities/{activity_id}")
def delete_single_activity(
    activity_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    hidden = getattr(current_user, "hidden_activity_ids", None) or []
    if not isinstance(hidden, list):
        hidden = []
    if activity_id not in hidden:
        hidden = list(hidden) + [activity_id]
    current_user.hidden_activity_ids = hidden
    db.add(current_user)
    db.commit()

    if hasattr(db, "get_collection"):
        col = db.get_collection("users")
        if col is not None:
            col.update_one(
                {"$or": [{"id": current_user.id}, {"_id": current_user.id}]},
                {"$addToSet": {"hidden_activity_ids": activity_id}}
            )
    return {"message": "Activity removed successfully", "activity_id": activity_id}
