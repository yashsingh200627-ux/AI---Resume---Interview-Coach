from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import Optional
from app.database.session import get_db
from app.models.models import InterviewSession
from app.services.admin_auth_service import require_admin_role

router = APIRouter(prefix="/admin/interviews", tags=["Admin Interviews"])

@router.get("", dependencies=[Depends(require_admin_role(["SUPER_ADMIN", "ADMIN", "ANALYST", "SUPPORT"]))])
def get_interviews(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(InterviewSession).options(joinedload(InterviewSession.user))
    
    if search:
        search_term = f"%{search}%"
        query = query.filter(InterviewSession.target_role.ilike(search_term))
    
    total = query.count()
    interviews = query.order_by(InterviewSession.created_at.desc()).offset(skip).limit(limit).all()
    
    items = []
    for i in interviews:
        items.append({
            "id": i.id,
            "target_role": i.target_role,
            "difficulty": i.difficulty,
            "status": i.status,
            "overall_score": i.overall_score,
            "created_at": i.created_at,
            "user_name": i.user.full_name if i.user else "Unknown",
        })
    
    return {
        "items": items,
        "total": total,
        "page": (skip // limit) + 1,
        "size": limit
    }
