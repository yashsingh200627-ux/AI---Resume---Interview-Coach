from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session, joinedload
from typing import Optional
from app.database.session import get_db
from app.models.models import AIUsageLog, AdminAuditLog
from app.services.admin_auth_service import require_admin_role

router = APIRouter(prefix="/admin/logs", tags=["Admin Logs"])

@router.get("/ai", dependencies=[Depends(require_admin_role(["SUPER_ADMIN", "ADMIN", "ANALYST", "SUPPORT"]))])
def get_ai_usage_logs(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(AIUsageLog).options(joinedload(AIUsageLog.user))
    
    if search:
        search_term = f"%{search}%"
        query = query.filter(AIUsageLog.feature.ilike(search_term))
    
    total = query.count()
    logs = query.order_by(AIUsageLog.created_at.desc()).offset(skip).limit(limit).all()
    
    items = []
    for log in logs:
        items.append({
            "id": log.id,
            "feature": log.feature,
            "model": log.model,
            "prompt_tokens": log.prompt_tokens,
            "completion_tokens": log.completion_tokens,
            "total_tokens": log.total_tokens,
            "status": log.status,
            "error_message": log.error_message,
            "user_name": log.user.full_name if log.user else "System",
            "created_at": log.created_at,
        })
    
    return {
        "items": items,
        "total": total,
        "page": (skip // limit) + 1,
        "size": limit
    }

@router.get("/audit", dependencies=[Depends(require_admin_role(["SUPER_ADMIN", "ADMIN"]))])
def get_audit_logs(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db)
):
    query = db.query(AdminAuditLog).options(joinedload(AdminAuditLog.admin))
    
    total = query.count()
    logs = query.order_by(AdminAuditLog.created_at.desc()).offset(skip).limit(limit).all()
    
    items = []
    for log in logs:
        items.append({
            "id": log.id,
            "action": log.action,
            "resource_type": log.resource_type,
            "resource_id": log.resource_id,
            "details": log.details,
            "ip_address": log.ip_address,
            "admin_name": log.admin.full_name if log.admin else "Unknown",
            "created_at": log.created_at,
        })
    
    return {
        "items": items,
        "total": total,
        "page": (skip // limit) + 1,
        "size": limit
    }
