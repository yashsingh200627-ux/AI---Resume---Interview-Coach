from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from datetime import datetime
import uuid
from app.database.session import get_db
from app.models.models import (
    User, Profile, Education, Experience, Skill, Project, Certification
)
from app.schemas.schemas import (
    FullProfileResponse, ProfileUpdate, ProfileResponse,
    EducationCreate, EducationResponse,
    ExperienceCreate, ExperienceResponse,
    SkillCreate, SkillResponse,
    ProjectCreate, ProjectResponse,
    CertificationCreate, CertificationResponse
)
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/profile", tags=["User Profile"])

def compute_profile_setup_stats(current_user: User, profile: Profile, educations, experiences, skills, projects, certifications):
    has_contact = bool(current_user.full_name and current_user.email and (current_user.phone or (profile and profile.location)))
    has_summary = bool(profile and ((profile.headline and len(profile.headline.strip()) > 2) or (profile.summary and len(profile.summary.strip()) > 5)))
    has_experience = len(experiences) > 0
    has_education = len(educations) > 0
    has_skills = len(skills) >= 1
    has_projects_or_certs = len(projects) > 0 or len(certifications) > 0

    score = 0.0
    if has_contact: score += 20.0
    if has_summary: score += 15.0
    if has_experience: score += 20.0
    if has_education: score += 15.0
    if len(skills) >= 3: score += 15.0
    elif len(skills) > 0: score += 8.0
    if has_projects_or_certs: score += 15.0

    pct = min(100.0, round(score, 1))
    breakdown = {
        "contact_info": has_contact,
        "headline_and_summary": has_summary,
        "experience": has_experience,
        "education": has_education,
        "skills": has_skills,
        "projects_or_certifications": has_projects_or_certs,
        "experience_count": len(experiences),
        "education_count": len(educations),
        "skills_count": len(skills),
        "projects_count": len(projects),
        "certifications_count": len(certifications),
    }
    return pct, breakdown

@router.get("", response_model=FullProfileResponse)
def get_full_profile(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    if not profile:
        profile = Profile(user_id=current_user.id)
        db.add(profile)
        db.commit()
        db.refresh(profile)

    educations = db.query(Education).filter(Education.user_id == current_user.id).all()
    experiences = db.query(Experience).filter(Experience.user_id == current_user.id).all()
    skills = db.query(Skill).filter(Skill.user_id == current_user.id).all()
    projects = db.query(Project).filter(Project.user_id == current_user.id).all()
    certifications = db.query(Certification).filter(Certification.user_id == current_user.id).all()

    completion_pct, breakdown = compute_profile_setup_stats(
        current_user, profile, educations, experiences, skills, projects, certifications
    )

    return {
        "user": current_user,
        "profile": profile,
        "educations": educations,
        "experiences": experiences,
        "skills": skills,
        "projects": projects,
        "certifications": certifications,
        "completion_percentage": completion_pct,
        "completion_breakdown": breakdown
    }

@router.put("", response_model=ProfileResponse)
def update_profile(
    profile_in: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    if not profile:
        profile = Profile(
            id=str(uuid.uuid4()),
            user_id=current_user.id,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.add(profile)
    else:
        if not getattr(profile, "id", None):
            profile.id = str(uuid.uuid4())
        profile.updated_at = datetime.utcnow()

    profile_data = profile_in.model_dump(exclude_unset=True)
    
    full_name = profile_data.pop("full_name", None)
    email = profile_data.pop("email", None)
    phone = profile_data.pop("phone", None)
    target_job_role = profile_data.pop("target_job_role", None)
    experience_level = profile_data.pop("experience_level", None)

    if full_name:
        current_user.full_name = full_name
    if email:
        current_user.email = email.lower()
    if phone is not None:
        current_user.phone = phone
    if target_job_role:
        current_user.target_job_role = target_job_role
    if experience_level:
        current_user.experience_level = experience_level

    for field, val in profile_data.items():
        setattr(profile, field, val)

    db.add(current_user)
    db.add(profile)
    db.commit()
    db.refresh(profile)
    db.refresh(current_user)
        
    return profile

# --- Educations ---
@router.post("/educations", response_model=EducationResponse, status_code=status.HTTP_201_CREATED)
def add_education(item: EducationCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    edu = Education(**item.model_dump(), user_id=current_user.id)
    db.add(edu)
    db.commit()
    db.refresh(edu)
    return edu

@router.delete("/educations/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_education(id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    edu = db.query(Education).filter(Education.id == id, Education.user_id == current_user.id).first()
    if not edu:
        raise HTTPException(status_code=404, detail="Education record not found")
    db.delete(edu)
    db.commit()

# --- Experiences ---
@router.post("/experiences", response_model=ExperienceResponse, status_code=status.HTTP_201_CREATED)
def add_experience(item: ExperienceCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    exp = Experience(**item.model_dump(), user_id=current_user.id)
    db.add(exp)
    db.commit()
    db.refresh(exp)
    return exp

@router.delete("/experiences/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_experience(id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    exp = db.query(Experience).filter(Experience.id == id, Experience.user_id == current_user.id).first()
    if not exp:
        raise HTTPException(status_code=404, detail="Experience record not found")
    db.delete(exp)
    db.commit()

# --- Skills ---
@router.post("/skills", response_model=SkillResponse, status_code=status.HTTP_201_CREATED)
def add_skill(item: SkillCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    skill = Skill(**item.model_dump(), user_id=current_user.id)
    db.add(skill)
    db.commit()
    db.refresh(skill)
    return skill

@router.delete("/skills/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_skill(id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    skill = db.query(Skill).filter(Skill.id == id, Skill.user_id == current_user.id).first()
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")
    db.delete(skill)
    db.commit()

# --- Projects ---
@router.post("/projects", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def add_project(item: ProjectCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    proj = Project(**item.model_dump(), user_id=current_user.id)
    db.add(proj)
    db.commit()
    db.refresh(proj)
    return proj

@router.delete("/projects/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    proj = db.query(Project).filter(Project.id == id, Project.user_id == current_user.id).first()
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")
    db.delete(proj)
    db.commit()

# --- Certifications ---
@router.post("/certifications", response_model=CertificationResponse, status_code=status.HTTP_201_CREATED)
def add_certification(item: CertificationCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    cert = Certification(**item.model_dump(), user_id=current_user.id)
    db.add(cert)
    db.commit()
    db.refresh(cert)
    return cert

@router.delete("/certifications/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_certification(id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    cert = db.query(Certification).filter(Certification.id == id, Certification.user_id == current_user.id).first()
    if not cert:
        raise HTTPException(status_code=404, detail="Certification not found")
    db.delete(cert)
    db.commit()
