from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.database.session import get_db
from app.models.models import User, Resume, ResumeVersion, Profile, Education, Experience, Skill, Project, Certification
from app.schemas.schemas import ResumeCreate, ResumeUpdate, ResumeResponse, ResumeGenerateRequest
from app.services.auth_service import get_current_user
from app.services.pdf_service import PDFResumeGenerator
from app.ai.resume_ai import ResumeAIService
from app.ai.provider import AIProviderException

router = APIRouter(prefix="/resumes", tags=["Resume Builder"])

@router.get("", response_model=List[ResumeResponse])
def get_user_resumes(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Resume).filter(Resume.user_id == current_user.id).order_by(Resume.updated_at.desc()).all()

@router.post("/generate")
async def generate_ai_resume(
    req: ResumeGenerateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Fetch real user profile context
    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    educations = db.query(Education).filter(Education.user_id == current_user.id).all()
    experiences = db.query(Experience).filter(Experience.user_id == current_user.id).all()
    skills = db.query(Skill).filter(Skill.user_id == current_user.id).all()
    projects = db.query(Project).filter(Project.user_id == current_user.id).all()
    certifications = db.query(Certification).filter(Certification.user_id == current_user.id).all()

    profile_dict = {
        "personal_info": {
            "full_name": current_user.full_name,
            "email": current_user.email,
            "phone": current_user.phone,
            "location": profile.location if profile else "",
            "linkedin": profile.linkedin_url if profile else "",
            "github": profile.github_url if profile else "",
            "portfolio": profile.portfolio_url if profile else "",
            "headline": profile.headline if profile else current_user.target_job_role
        },
        "summary": profile.summary if profile else "",
        "educations": [
            {"degree": e.degree, "institution": e.institution, "start_year": e.start_year, "end_year": e.end_year, "grade": e.grade}
            for e in educations
        ],
        "experiences": [
            {
                "company": ex.company,
                "job_title": ex.job_title,
                "location": ex.location,
                "start_date": ex.start_date,
                "end_date": ex.end_date,
                "is_current": ex.is_current,
                "responsibilities": ex.responsibilities,
                "achievements": ex.achievements
            }
            for ex in experiences
        ],
        "skills": [s.name for s in skills],
        "projects": [
            {"name": p.name, "description": p.description, "technologies": p.technologies, "results": p.results}
            for p in projects
        ],
        "certifications": [
            {"name": c.name, "issuing_organization": c.issuing_organization, "issue_date": c.issue_date}
            for c in certifications
        ]
    }

    try:
        generated = await ResumeAIService.generate_resume_content(
            profile_data=profile_dict,
            target_role=req.target_role,
            experience_level=req.experience_level or current_user.experience_level,
            focus_keywords=req.focus_keywords,
            user_notes=req.user_notes or ""
        )
        return {"success": True, "content": generated}
    except AIProviderException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate resume: {str(e)}")

@router.post("/improve-bullet")
async def improve_bullet(
    payload: Dict[str, str],
    current_user: User = Depends(get_current_user)
):
    bullet = payload.get("bullet", "").strip()
    target_role = payload.get("target_role", "Software Engineer")
    if not bullet:
        raise HTTPException(status_code=400, detail="Bullet point text is required")
    try:
        result = await ResumeAIService.improve_bullet_point(bullet, target_role)
        return result
    except AIProviderException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)

@router.post("", response_model=ResumeResponse, status_code=status.HTTP_201_CREATED)
def create_resume(
    resume_in: ResumeCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    resume = Resume(
        user_id=current_user.id,
        title=resume_in.title,
        target_role=resume_in.target_role,
        template_name=resume_in.template_name or "modern",
        content_json=resume_in.content_json,
        raw_text=resume_in.raw_text
    )
    db.add(resume)
    db.commit()
    db.refresh(resume)

    # Create initial version
    version = ResumeVersion(
        resume_id=resume.id,
        version_number=1,
        snapshot_json=resume.content_json,
        change_summary="Initial creation"
    )
    db.add(version)
    db.commit()

    # Sync to MongoDB Atlas
    from app.database.mongodb import mongodb_manager
    mongodb_manager.save_document_sync("resumes", resume.id, {
        "user_id": resume.user_id,
        "title": resume.title,
        "target_role": resume.target_role,
        "template_name": resume.template_name,
        "content_json": resume.content_json,
        "created_at": str(resume.created_at)
    })

    return resume

@router.get("/{id}", response_model=ResumeResponse)
def get_resume(id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    resume = db.query(Resume).filter(Resume.id == id, Resume.user_id == current_user.id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    return resume

@router.put("/{id}", response_model=ResumeResponse)
def update_resume(
    id: str,
    resume_in: ResumeUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    resume = db.query(Resume).filter(Resume.id == id, Resume.user_id == current_user.id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    for field, val in resume_in.model_dump(exclude_unset=True).items():
        setattr(resume, field, val)

    # Save revision snapshot
    count = db.query(ResumeVersion).filter(ResumeVersion.resume_id == resume.id).count()
    version = ResumeVersion(
        resume_id=resume.id,
        version_number=count + 1,
        snapshot_json=resume.content_json,
        change_summary=f"Update version {count + 1}"
    )
    db.add(version)
    db.commit()
    db.refresh(resume)

    # Sync to MongoDB Atlas
    from app.database.mongodb import mongodb_manager
    mongodb_manager.save_document_sync("resumes", resume.id, {
        "user_id": resume.user_id,
        "title": resume.title,
        "target_role": resume.target_role,
        "template_name": resume.template_name,
        "content_json": resume.content_json,
        "updated_at": str(resume.updated_at)
    })

    return resume


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_resume(id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    resume = db.query(Resume).filter(Resume.id == id, Resume.user_id == current_user.id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    db.delete(resume)
    db.commit()

@router.get("/{id}/pdf")
def download_resume_pdf(id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    resume = db.query(Resume).filter(Resume.id == id, Resume.user_id == current_user.id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    
    pdf_bytes = PDFResumeGenerator.generate_pdf(resume.content_json, title=resume.title)
    filename = f"{resume.title.replace(' ', '_')}.pdf"
    
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=\"{filename}\""}
    )
