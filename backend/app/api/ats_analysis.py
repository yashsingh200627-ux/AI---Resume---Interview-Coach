from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional
from app.database.session import get_db
from app.models.models import User, Resume, JobDescription, JobMatch
from app.schemas.schemas import ATSAnalysisRequest, JobMatchResponse
from app.services.auth_service import get_current_user
from app.services.file_extractor import FileExtractor
from app.ai.ats_ai import ATSAIService
from app.ai.provider import AIProviderException

router = APIRouter(prefix="/ats-analysis", tags=["ATS Analysis"])

@router.post("", response_model=JobMatchResponse)
async def run_ats_analysis(
    req: ATSAnalysisRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    resume_text = req.resume_text
    if not resume_text and req.resume_id:
        resume = db.query(Resume).filter(Resume.id == req.resume_id, Resume.user_id == current_user.id).first()
        if resume:
            resume_text = resume.raw_text
            if not resume_text and resume.content_json:
                resume_text = str(resume.content_json)

    if not resume_text or len(resume_text.strip()) < 20:
        raise HTTPException(status_code=400, detail="Resume text is required for ATS comparison.")

    if not req.job_description or len(req.job_description.strip()) < 20:
        raise HTTPException(status_code=400, detail="Job description text is required.")

    # Save job description if not already present
    jd_title = req.job_title or "Target Position"
    job_desc = JobDescription(
        user_id=current_user.id,
        title=jd_title,
        raw_text=req.job_description
    )
    db.add(job_desc)
    db.commit()
    db.refresh(job_desc)

    try:
        match_data = await ATSAIService.match_resume_to_job(
            resume_text=resume_text,
            job_description_text=req.job_description,
            job_title=jd_title
        )
    except AIProviderException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to perform ATS matching: {str(e)}")

    record = JobMatch(
        user_id=current_user.id,
        resume_id=req.resume_id,
        job_description_id=job_desc.id,
        overall_match_score=match_data["overall_match_score"],
        ats_compatibility_score=match_data["ats_compatibility_score"],
        skill_match_score=match_data["skill_match_score"],
        experience_match_score=match_data["experience_match_score"],
        matched_skills=match_data.get("matched_skills", []),
        missing_skills=match_data.get("missing_skills", []),
        matched_keywords=match_data.get("matched_keywords", []),
        missing_keywords=match_data.get("missing_keywords", []),
        recommendations=match_data.get("recommendations", []),
        alignment_summary=match_data.get("alignment_summary", "")
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    return {
        "id": record.id,
        "job_title": jd_title,
        "company": None,
        "overall_match_score": record.overall_match_score,
        "ats_compatibility_score": record.ats_compatibility_score,
        "skill_match_score": record.skill_match_score,
        "experience_match_score": record.experience_match_score,
        "matched_skills": record.matched_skills,
        "missing_skills": record.missing_skills,
        "matched_keywords": record.matched_keywords,
        "missing_keywords": record.missing_keywords,
        "recommendations": record.recommendations,
        "alignment_summary": record.alignment_summary,
        "created_at": record.created_at
    }

@router.post("/upload-and-compare", response_model=JobMatchResponse)
async def upload_and_compare(
    file: UploadFile = File(...),
    job_description: str = Form(...),
    job_title: Optional[str] = Form("Target Role"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    extracted_text = await FileExtractor.extract_text_from_upload(file)
    req = ATSAnalysisRequest(
        resume_text=extracted_text,
        job_description=job_description,
        job_title=job_title
    )
    return await run_ats_analysis(req, current_user, db)
