from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from app.database.session import get_db
from app.models.models import AdminUser, AdminAuditLog
from app.schemas.admin_schemas import AdminLogin, AdminToken, AdminUserResponse
from app.services.auth_service import verify_password
from app.services.admin_auth_service import create_admin_access_token, get_current_admin

router = APIRouter(prefix="/admin/auth", tags=["Admin Authentication"])

def log_admin_action(db: Session, admin_id: str, action: str, ip_address: str = None, user_agent: str = None):
    audit_log = AdminAuditLog(
        admin_id=admin_id,
        action=action,
        ip_address=ip_address,
        user_agent=user_agent
    )
    db.add(audit_log)
    db.commit()

@router.post("/login", response_model=AdminToken)
def admin_login(login_data: AdminLogin, db: Session = Depends(get_db)):
    admin = db.query(AdminUser).filter(AdminUser.email == login_data.email.lower()).first()
    
    if not admin or not verify_password(login_data.password, admin.hashed_password):
        # We might want to log failed attempts, but let's just raise for now
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    if admin.status != "active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin account is disabled"
        )
    
    # Update last login
    admin.last_login_at = datetime.now(timezone.utc)
    
    # Log the login
    log_admin_action(db, admin.id, "Admin Login")
    
    token = create_admin_access_token({"sub": admin.id, "email": admin.email})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": admin
    }

@router.get("/me", response_model=AdminUserResponse)
def get_me(current_admin: AdminUser = Depends(get_current_admin)):
    return current_admin

@router.post("/logout")
def admin_logout(current_admin: AdminUser = Depends(get_current_admin), db: Session = Depends(get_db)):
    log_admin_action(db, current_admin.id, "Admin Logout")
    return {"message": "Successfully logged out"}
