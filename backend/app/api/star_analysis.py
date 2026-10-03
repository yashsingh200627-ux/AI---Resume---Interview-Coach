from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.models import User
from app.schemas.schemas import STARAnalysisRequest, STARAnalysisResponse
from app.services.auth_service import get_optional_current_user
from app.ai.star_ai import STARAIService
from app.ai.provider import AIProviderException

router = APIRouter(prefix="/star-analysis", tags=["STAR Coach"])

@router.post("", response_model=STARAnalysisResponse)
async def analyze_behavioral_answer(
    req: STARAnalysisRequest,
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    if not req.question or len(req.question.strip()) < 3:
        raise HTTPException(status_code=400, detail="A valid behavioral interview question is required.")
    if not req.answer or len(req.answer.strip()) < 5:
        raise HTTPException(status_code=400, detail="Answer text is too short to evaluate STAR components (minimum 5 characters).")

    try:
        user_role = current_user.target_job_role if current_user else None
        result = await STARAIService.analyze_star(
            question=req.question.strip(),
            answer=req.answer.strip(),
            target_role=req.target_role or user_role or "Software Professional"
        )
        return result
    except AIProviderException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to analyze STAR answer: {str(e)}")

