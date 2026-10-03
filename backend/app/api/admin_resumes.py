from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import Optional
from app.database.session import get_db
from app.models.models import Resume, ResumeAnalysis
from app.services.admin_auth_service import require_admin_role

router = APIRouter(prefix="/admin/resumes", tags=["Admin Resumes"])

@router.get("", dependencies=[Depends(require_admin_role(["SUPER_ADMIN", "ADMIN", "ANALYST", "SUPPORT"]))])
def get_resumes(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Resume).options(joinedload(Resume.user))
    
    if search:
        search_term = f"%{search}%"
        query = query.filter(Resume.title.ilike(search_term))
    
    total = query.count()
    resumes = query.order_by(Resume.created_at.desc()).offset(skip).limit(limit).all()
    
    # We will format this slightly to include the user's name
    items = []
    for r in resumes:
        items.append({
            "id": r.id,
            "title": r.title,
            "target_role": r.target_role,
            "created_at": r.created_at,
            "user_name": r.user.full_name if r.user else "Unknown",
            "user_email": r.user.email if r.user else "Unknown",
        })
    
    return {
        "items": items,
        "total": total,
        "page": (skip // limit) + 1,
        "size": limit
    }
