from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session, joinedload
from app.database.session import get_db
from app.models.models import AdminUser, AdminRole
from app.services.admin_auth_service import require_admin_role

router = APIRouter(prefix="/admin/management", tags=["Admin Management"])

@router.get("/admins", dependencies=[Depends(require_admin_role(["SUPER_ADMIN"]))])
def get_admins(db: Session = Depends(get_db)):
    query = db.query(AdminUser).options(joinedload(AdminUser.role))
    admins = query.order_by(AdminUser.created_at.desc()).all()
    
    items = []
    for admin in admins:
        items.append({
            "id": admin.id,
            "email": admin.email,
            "full_name": admin.full_name,
            "status": admin.status,
            "role": admin.role.name if admin.role else "Unknown",
            "created_at": admin.created_at
        })
    
    return items

@router.patch("/admins/{admin_id}/status", dependencies=[Depends(require_admin_role(["SUPER_ADMIN"]))])
def update_admin_status(admin_id: str, status: str, db: Session = Depends(get_db)):
    if status not in ["active", "suspended"]:
        raise HTTPException(status_code=400, detail="Invalid status")
        
    admin = db.query(AdminUser).filter(AdminUser.id == admin_id).first()
    if not admin:
        raise HTTPException(status_code=404, detail="Admin not found")
        
    admin.status = status
    db.commit()
    
    return {"message": "Admin status updated"}
