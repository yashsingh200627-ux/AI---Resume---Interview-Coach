from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database.session import get_db
from app.models.models import User
from app.services.admin_auth_service import require_admin_role

router = APIRouter(prefix="/admin/users", tags=["Admin Users"])

@router.get("", dependencies=[Depends(require_admin_role(["SUPER_ADMIN", "ADMIN", "ANALYST", "SUPPORT"]))])
def get_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(User)
    
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (User.email.ilike(search_term)) | 
            (User.full_name.ilike(search_term))
        )
    
    total = query.count()
    users = query.order_by(User.created_at.desc()).offset(skip).limit(limit).all()
    
    return {
        "items": users,
        "total": total,
        "page": (skip // limit) + 1,
        "size": limit
    }

@router.get("/{user_id}", dependencies=[Depends(require_admin_role(["SUPER_ADMIN", "ADMIN", "ANALYST", "SUPPORT"]))])
def get_user_details(user_id: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # In a real scenario, you'd likely load profiles, stats, etc.
    return user
