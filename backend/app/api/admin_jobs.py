from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import Optional
from app.database.session import get_db
from app.models.models import JobDescription, JobMatch
from app.services.admin_auth_service import require_admin_role

router = APIRouter(prefix="/admin/jobs", tags=["Admin Jobs"])

@router.get("/descriptions", dependencies=[Depends(require_admin_role(["SUPER_ADMIN", "ADMIN", "ANALYST", "SUPPORT"]))])
def get_job_descriptions(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(JobDescription).options(joinedload(JobDescription.user))
    
    if search:
        search_term = f"%{search}%"
        query = query.filter(JobDescription.title.ilike(search_term))
    
    total = query.count()
    jobs = query.order_by(JobDescription.created_at.desc()).offset(skip).limit(limit).all()
    
    items = []
    for j in jobs:
        items.append({
            "id": j.id,
            "title": j.title,
            "company": j.company,
            "user_name": j.user.full_name if j.user else "Unknown",
            "created_at": j.created_at,
        })
    
    return {
        "items": items,
        "total": total,
        "page": (skip // limit) + 1,
        "size": limit
    }

@router.get("/matches", dependencies=[Depends(require_admin_role(["SUPER_ADMIN", "ADMIN", "ANALYST", "SUPPORT"]))])
def get_job_matches(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(JobMatch).options(
        joinedload(JobMatch.user),
        joinedload(JobMatch.job_description)
    )
    
    # If search, filter by job description title or user name (simplified to just user name for this)
    if search:
        search_term = f"%{search}%"
        query = query.join(JobMatch.user).filter(JobMatch.user.has(full_name=search_term))
    
    total = query.count()
    matches = query.order_by(JobMatch.created_at.desc()).offset(skip).limit(limit).all()
    
    items = []
    for m in matches:
        items.append({
            "id": m.id,
            "user_name": m.user.full_name if m.user else "Unknown",
            "job_title": m.job_description.title if m.job_description else "Unknown",
            "overall_match_score": m.overall_match_score,
            "ats_compatibility_score": m.ats_compatibility_score,
            "created_at": m.created_at,
        })
    
    return {
        "items": items,
        "total": total,
        "page": (skip // limit) + 1,
        "size": limit
    }
