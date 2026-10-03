from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database.session import get_db
from app.models.models import User, JobMatch, JobDescription
from app.schemas.schemas import JobMatchResponse
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/job-match", tags=["Job Match"])

@router.get("", response_model=List[JobMatchResponse])
def get_user_matches(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    matches = db.query(JobMatch).filter(JobMatch.user_id == current_user.id).order_by(JobMatch.created_at.desc()).all()
    results = []
    for m in matches:
        jd = getattr(m, "job_description", None)
        if not jd and getattr(m, "job_description_id", None):
            jd = db.query(JobDescription).filter(JobDescription.id == m.job_description_id).first()

        jd_title = jd.title if jd and jd.title else None
        jd_company = jd.company if jd and jd.company else None

        # Guarantee position is explicitly specified - never "Unknown Position"
        if not jd_title or jd_title.strip() in ("", "Unknown", "Unknown Position"):
            candidate_role = getattr(current_user, "target_job_role", None)
            jd_title = candidate_role if candidate_role and candidate_role.strip() else "Software Engineer"

        if not jd_company or jd_company.strip() in ("", "Direct Role"):
            jd_company = "Target Opportunity"

        results.append({
            "id": m.id,
            "job_title": jd_title,
            "company": jd_company,
            "overall_match_score": m.overall_match_score,
            "ats_compatibility_score": m.ats_compatibility_score,
            "skill_match_score": m.skill_match_score,
            "experience_match_score": m.experience_match_score,
            "matched_skills": m.matched_skills or [],
            "missing_skills": m.missing_skills or [],
            "matched_keywords": m.matched_keywords or [],
            "missing_keywords": m.missing_keywords or [],
            "recommendations": m.recommendations or [],
            "alignment_summary": m.alignment_summary,
            "created_at": m.created_at
        })
    return results

@router.get("/{id}", response_model=JobMatchResponse)
def get_match_detail(id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    m = db.query(JobMatch).filter(JobMatch.id == id, JobMatch.user_id == current_user.id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Job match record not found")

    jd = getattr(m, "job_description", None)
    if not jd and getattr(m, "job_description_id", None):
        jd = db.query(JobDescription).filter(JobDescription.id == m.job_description_id).first()

    jd_title = jd.title if jd and jd.title else None
    jd_company = jd.company if jd and jd.company else None

    # Guarantee position is explicitly specified - never "Unknown Position"
    if not jd_title or jd_title.strip() in ("", "Unknown", "Unknown Position"):
        candidate_role = getattr(current_user, "target_job_role", None)
        jd_title = candidate_role if candidate_role and candidate_role.strip() else "Software Engineer"

    if not jd_company or jd_company.strip() in ("", "Direct Role"):
        jd_company = "Target Opportunity"

    return {
        "id": m.id,
        "job_title": jd_title,
        "company": jd_company,
        "overall_match_score": m.overall_match_score,
        "ats_compatibility_score": m.ats_compatibility_score,
        "skill_match_score": m.skill_match_score,
        "experience_match_score": m.experience_match_score,
        "matched_skills": m.matched_skills or [],
        "missing_skills": m.missing_skills or [],
        "matched_keywords": m.matched_keywords or [],
        "missing_keywords": m.missing_keywords or [],
        "recommendations": m.recommendations or [],
        "alignment_summary": m.alignment_summary,
        "created_at": m.created_at
    }
