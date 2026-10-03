import jwt
from datetime import datetime, timedelta, timezone
from typing import Optional, List
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session, joinedload
from app.config import settings
from app.database.session import get_db
from app.models.models import AdminUser, AdminRole
from app.services.auth_service import verify_password, create_access_token

# Separate OAuth2 scheme for admin to have a different swagger login
admin_oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/admin/auth/login")

def create_admin_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    to_encode.update({"type": "admin"}) # crucial for distinguishing admin tokens
    return create_access_token(to_encode, expires_delta)

async def get_current_admin(token: str = Depends(admin_oauth2_scheme), db: Session = Depends(get_db)) -> AdminUser:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate admin credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        user_id: str = payload.get("sub")
        token_type: str = payload.get("type")
        
        if user_id is None or token_type != "admin":
            raise credentials_exception
    except (jwt.PyJWTError, Exception):
        raise credentials_exception
    
    admin = db.query(AdminUser).options(joinedload(AdminUser.role)).filter(AdminUser.id == user_id).first()
    if admin is None or admin.status != "active":
        raise credentials_exception
    return admin

def require_admin_role(roles: List[str]):
    """
    Dependency to check if the admin has one of the specified roles.
    Example: @router.get("/users", dependencies=[Depends(require_admin_role(["SUPER_ADMIN", "ADMIN"]))])
    """
    def role_checker(current_admin: AdminUser = Depends(get_current_admin)):
        if not current_admin.role or current_admin.role.name not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to perform this action"
            )
        return current_admin
    return role_checker
