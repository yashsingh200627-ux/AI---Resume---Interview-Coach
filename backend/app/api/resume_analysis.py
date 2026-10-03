from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional, List
from app.database.session import get_db
from app.models.models import User, ResumeAnalysis, Resume
from app.schemas.schemas import ResumeAnalysisResponse
from app.services.auth_service import get_current_user
from app.services.file_extractor import FileExtractor
from app.ai.ats_ai import ATSAIService
from app.ai.provider import AIProviderException

router = APIRouter(prefix="/resume-analysis", tags=["Resume Analysis"])

@router.post("/upload", response_model=ResumeAnalysisResponse)
async def analyze_uploaded_resume(
    file: UploadFile = File(...),
    resume_id: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    extracted_text = await FileExtractor.extract_text_from_upload(file)
    if not extracted_text or len(extracted_text.strip()) < 20:
        raise HTTPException(status_code=400, detail="The uploaded document contains insufficient text to evaluate.")

    try:
        analysis_data = await ATSAIService.analyze_resume_text(
            resume_text=extracted_text,
            filename=file.filename or "uploaded_resume"
        )
    except AIProviderException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to analyze resume: {str(e)}")

    record = ResumeAnalysis(
        user_id=current_user.id,
        resume_id=resume_id if resume_id else None,
        filename=file.filename,
        overall_score=analysis_data["overall_score"],
        ats_score=analysis_data["ats_score"],
        content_score=analysis_data["content_score"],
        keyword_score=analysis_data["keyword_score"],
        formatting_score=analysis_data["formatting_score"],
        strengths=analysis_data.get("strengths", []),
        weaknesses=analysis_data.get("weaknesses", []),
        missing_keywords=analysis_data.get("missing_keywords", []),
        recommendations=analysis_data.get("recommendations", []),
        extracted_text=extracted_text
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    return record

@router.post("/analyze-existing/{resume_id}", response_model=ResumeAnalysisResponse)
async def analyze_existing_resume(
    resume_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    resume = db.query(Resume).filter(Resume.id == resume_id, Resume.user_id == current_user.id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    text_to_analyze = resume.raw_text
    if not text_to_analyze and resume.content_json:
        # Convert content json to readable text representation
        lines = []
        p = resume.content_json.get("personal_info", {})
        lines.append(f"{p.get('full_name', '')} {p.get('headline', '')}")
        if resume.content_json.get("summary"):
            lines.append(resume.content_json["summary"])
        for exp in resume.content_json.get("experiences", []):
            lines.append(f"{exp.get('job_title')} at {exp.get('company')}")
            for r in exp.get("responsibilities", []):
                lines.append(f"- {r}")
        text_to_analyze = "\n".join(lines)

    if not text_to_analyze:
        raise HTTPException(status_code=400, detail="Resume has no text content to analyze.")

    try:
        analysis_data = await ATSAIService.analyze_resume_text(
            resume_text=text_to_analyze,
            filename=f"{resume.title}.pdf"
        )
    except AIProviderException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)

    record = ResumeAnalysis(
        user_id=current_user.id,
        resume_id=resume.id,
        filename=resume.title,
        overall_score=analysis_data["overall_score"],
        ats_score=analysis_data["ats_score"],
        content_score=analysis_data["content_score"],
        keyword_score=analysis_data["keyword_score"],
        formatting_score=analysis_data["formatting_score"],
        strengths=analysis_data.get("strengths", []),
        weaknesses=analysis_data.get("weaknesses", []),
        missing_keywords=analysis_data.get("missing_keywords", []),
        recommendations=analysis_data.get("recommendations", []),
        extracted_text=text_to_analyze
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    return record

@router.get("/latest", response_model=Optional[ResumeAnalysisResponse])
def get_latest_analysis(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(ResumeAnalysis).filter(ResumeAnalysis.user_id == current_user.id).order_by(ResumeAnalysis.created_at.desc()).first()

@router.get("/history", response_model=List[ResumeAnalysisResponse])
def get_analysis_history(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(ResumeAnalysis).filter(ResumeAnalysis.user_id == current_user.id).order_by(ResumeAnalysis.created_at.desc()).limit(10).all()
