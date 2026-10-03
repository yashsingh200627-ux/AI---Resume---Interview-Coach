from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

# ----------------- Admin Auth Schemas -----------------
class AdminLogin(BaseModel):
    email: EmailStr
    password: str
    remember_me: Optional[bool] = False

class AdminRoleResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None

    class Config:
        from_attributes = True

class AdminUserResponse(BaseModel):
    id: str
    email: EmailStr
    full_name: str
    status: str
    role: Optional[AdminRoleResponse] = None
    last_login_at: Optional[datetime] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class AdminToken(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: AdminUserResponse
