from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List
from app.database.session import get_db
from app.models.models import SystemSettings
from app.services.admin_auth_service import require_admin_role

router = APIRouter(prefix="/admin/settings", tags=["Admin Settings"])

class SettingUpdate(BaseModel):
    id: str
    value: str

@router.get("", dependencies=[Depends(require_admin_role(["SUPER_ADMIN", "ADMIN"]))])
def get_settings(db: Session = Depends(get_db)):
    settings = db.query(SystemSettings).order_by(SystemSettings.category, SystemSettings.key).all()
    
    # If the DB is empty (first run), we might want to return some defaults or an empty list
    return settings

@router.put("", dependencies=[Depends(require_admin_role(["SUPER_ADMIN"]))])
def update_settings(updates: List[SettingUpdate], db: Session = Depends(get_db)):
    """Only SUPER_ADMIN can update settings."""
    for update in updates:
        setting = db.query(SystemSettings).filter(SystemSettings.id == update.id).first()
        if setting:
            setting.value = update.value
    
    db.commit()
    return {"message": "Settings updated successfully"}
