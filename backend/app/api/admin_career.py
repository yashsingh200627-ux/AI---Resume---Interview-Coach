from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, desc
from typing import Optional
from app.database.session import get_db
from app.models.models import SkillGap, CareerRecommendation
from app.services.admin_auth_service import require_admin_role

router = APIRouter(prefix="/admin/career", tags=["Admin Career Analytics"])

@router.get("/skill-gaps/aggregate", dependencies=[Depends(require_admin_role(["SUPER_ADMIN", "ADMIN", "ANALYST"]))])
def get_aggregate_skill_gaps(db: Session = Depends(get_db), limit: int = 10):
    """Returns the most common missing skills across the platform."""
    
    # Query to group by skill_name and count occurrences
    results = db.query(
        SkillGap.skill_name,
        func.count(SkillGap.id).label('missing_count')
    ).group_by(
        SkillGap.skill_name
    ).order_by(
        desc('missing_count')
    ).limit(limit).all()
    
    items = [{"skill_name": r[0], "missing_count": r[1]} for r in results]
    
    return items

@router.get("/recommendations", dependencies=[Depends(require_admin_role(["SUPER_ADMIN", "ADMIN", "ANALYST", "SUPPORT"]))])
def get_recommendations(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(CareerRecommendation).options(joinedload(CareerRecommendation.user))
    
    if search:
        search_term = f"%{search}%"
        query = query.filter(CareerRecommendation.category.ilike(search_term))
    
    total = query.count()
    recommendations = query.order_by(CareerRecommendation.created_at.desc()).offset(skip).limit(limit).all()
    
    items = []
    for r in recommendations:
        items.append({
            "id": r.id,
            "category": r.category,
            "title": r.title,
            "priority": r.priority,
            "user_name": r.user.full_name if r.user else "Unknown",
            "created_at": r.created_at,
        })
    
    return {
        "items": items,
        "total": total,
        "page": (skip // limit) + 1,
        "size": limit
    }
