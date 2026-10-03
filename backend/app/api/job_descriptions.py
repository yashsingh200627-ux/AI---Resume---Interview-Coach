from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database.session import get_db
from app.models.models import User, JobDescription
from app.schemas.schemas import JobDescriptionCreate, JobDescriptionResponse
from app.services.auth_service import get_current_user
from app.ai.ats_ai import ATSAIService
from app.ai.provider import AIProviderException

router = APIRouter(prefix="/job-descriptions", tags=["Job Descriptions"])

@router.post("", response_model=JobDescriptionResponse, status_code=status.HTTP_201_CREATED)
async def create_job_description(
    job_in: JobDescriptionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        parsed_data = await ATSAIService.analyze_job_description(
            job_text=job_in.raw_text,
            title=job_in.title
        )
    except AIProviderException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to analyze job description: {str(e)}")

    record = JobDescription(
        user_id=current_user.id,
        title=parsed_data.get("title") or job_in.title,
        company=job_in.company,
        raw_text=job_in.raw_text,
        required_skills=parsed_data.get("required_skills", []),
        preferred_skills=parsed_data.get("preferred_skills", []),
        experience_requirements=parsed_data.get("experience_requirements", ""),
        education_requirements=parsed_data.get("education_requirements", ""),
        responsibilities=parsed_data.get("responsibilities", []),
        keywords=parsed_data.get("keywords", [])
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record

@router.get("", response_model=List[JobDescriptionResponse])
def get_job_descriptions(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(JobDescription).filter(JobDescription.user_id == current_user.id).order_by(JobDescription.created_at.desc()).all()

@router.get("/{id}", response_model=JobDescriptionResponse)
def get_job_description(id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    job = db.query(JobDescription).filter(JobDescription.id == id, JobDescription.user_id == current_user.id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job description not found")
    return job

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_job_description(id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    job = db.query(JobDescription).filter(JobDescription.id == id, JobDescription.user_id == current_user.id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job description not found")
    db.delete(job)
    db.commit()
