from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.session import get_db, engine
from app.config import settings
from app.schemas.schemas import SettingsUpdate, SettingsStatusResponse
from app.services.auth_service import get_current_user
from app.models.models import User
from app.ai.provider import ai_provider

router = APIRouter(prefix="/settings", tags=["Settings"])

@router.get("", response_model=SettingsStatusResponse)
def get_settings_status(current_user: User = Depends(get_current_user)):
    from app.database.mongodb import mongodb_manager
    mongo_stat = mongodb_manager.get_status()
    return {
        "has_ai_api_key": ai_provider.is_configured(),
        "ai_api_base_url": settings.AI_API_BASE_URL,
        "ai_model": settings.AI_MODEL,
        "database_connected": mongo_stat.get("is_connected", False),
        "database_type": "MongoDB Atlas (Cloud)",
        "mongodb_connected": mongo_stat.get("is_connected", False),
        "mongodb_database": mongo_stat.get("database_name"),
        "mongodb_cluster": mongo_stat.get("cluster"),
        "mongodb_collections": mongo_stat.get("collections"),
        "mongodb_error": mongo_stat.get("connection_error")
    }

@router.post("")
def update_settings(payload: SettingsUpdate, current_user: User = Depends(get_current_user)):
    if payload.ai_api_key is not None:
        settings.AI_API_KEY = payload.ai_api_key.strip()
        ai_provider.api_key = payload.ai_api_key.strip()
    if payload.ai_api_base_url is not None:
        settings.AI_API_BASE_URL = payload.ai_api_base_url.strip()
        ai_provider.base_url = payload.ai_api_base_url.strip().rstrip("/")
    if payload.ai_model is not None:
        settings.AI_MODEL = payload.ai_model.strip()
        ai_provider.model = payload.ai_model.strip()

    return {
        "success": True,
        "message": "AI settings successfully updated in-memory for this session.",
        "has_ai_api_key": ai_provider.is_configured(),
        "ai_model": settings.AI_MODEL,
        "ai_api_base_url": settings.AI_API_BASE_URL
    }

@router.post("/test-ai")
async def test_ai_connection(current_user: User = Depends(get_current_user)):
    try:
        messages = [
            {"role": "system", "content": "You are Aura AI."},
            {"role": "user", "content": "Hello Aura, confirm status."}
        ]
        res = await ai_provider.generate(messages, max_tokens=60)
        engine_mode = "Cloud LLM Provider" if ai_provider.is_configured() else "Aura Autonomous Engine (Active & Ready)"
        return {
            "success": True,
            "message": f"Aura AI engine is online and active! Mode: {engine_mode}",
            "response": res
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI connection test failed: {str(e)}")

@router.get("/mongodb-status")
def get_mongodb_status(current_user: User = Depends(get_current_user)):
    from app.database.mongodb import mongodb_manager
    return mongodb_manager.get_status()

@router.post("/mongodb-sync")
def sync_mongodb_data(current_user: User = Depends(get_current_user)):
    from app.database.mongodb import mongodb_manager
    if not mongodb_manager.is_connected:
        raise HTTPException(
            status_code=400,
            detail=mongodb_manager.connection_error or "MongoDB is not connected. Update your password in backend/.env."
        )
    result = mongodb_manager.sync_all_from_sqlite()
    return result

