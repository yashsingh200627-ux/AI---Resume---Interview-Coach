import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
from app.database.session import get_db
from app.models.models import (
    User, Profile, Skill, Experience, Education, ResumeAnalysis,
    InterviewSession, CareerChatSession, CareerChatMessage, SkillGap
)
from app.schemas.schemas import CareerChatMessageRequest, CareerRoadmapRequest
from app.services.auth_service import get_current_user, get_optional_current_user
from app.ai.career_ai import CareerAIService
from app.ai.provider import ai_provider, AIProviderException

router = APIRouter(prefix="/career-chat", tags=["Career Coach"])

def _build_context(current_user: Optional[User], db: Session) -> Dict[str, Any]:
    if not current_user:
        return {
            "full_name": "Candidate",
            "target_job_role": "Software & Technology",
            "experience_level": "Professional",
            "profile": {
                "headline": "Software Engineer & Career Explorer",
                "summary": "Motivated candidate actively improving technical skills, resume impact, and interview readiness.",
                "location": "Global"
            },
            "skills": [{"name": "Software Engineering", "category": "Core"}],
            "experiences": [],
            "educations": [],
            "latest_ats_score": None,
            "interview_stats": "0 sessions"
        }

    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    skills = db.query(Skill).filter(Skill.user_id == current_user.id).all()
    experiences = db.query(Experience).filter(Experience.user_id == current_user.id).all()
    educations = db.query(Education).filter(Education.user_id == current_user.id).all()
    latest_analysis = db.query(ResumeAnalysis).filter(ResumeAnalysis.user_id == current_user.id).order_by(ResumeAnalysis.created_at.desc()).first()
    interview_count = db.query(InterviewSession).filter(InterviewSession.user_id == current_user.id, InterviewSession.status == "completed").count()

    return {
        "full_name": current_user.full_name,
        "target_job_role": current_user.target_job_role or "Software & Technology",
        "experience_level": current_user.experience_level or "Mid-Level",
        "profile": {
            "headline": profile.headline if profile else "",
            "summary": profile.summary if profile else "",
            "location": profile.location if profile else ""
        } if profile else {},
        "skills": [{"name": s.name, "category": s.category} for s in skills],
        "experiences": [
            {"job_title": e.job_title, "company": e.company, "start_date": e.start_date, "end_date": e.end_date}
            for e in experiences
        ],
        "educations": [
            {"degree": ed.degree, "institution": ed.institution} for ed in educations
        ],
        "latest_ats_score": latest_analysis.ats_score if latest_analysis else None,
        "interview_stats": f"{interview_count} completed sessions"
    }

@router.post("")
async def send_career_message(
    req: CareerChatMessageRequest,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    session = None
    session_id = req.session_id or f"guest-{uuid.uuid4().hex[:8]}"
    conv_history = []

    if current_user:
        if req.session_id and not req.session_id.startswith("guest-"):
            session = db.query(CareerChatSession).filter(
                CareerChatSession.id == req.session_id,
                CareerChatSession.user_id == current_user.id
            ).first()

        if not session:
            msg_snippet = req.message.strip().replace("\n", " ")
            title_text = (msg_snippet[:42] + "...") if len(msg_snippet) > 42 else msg_snippet
            session = CareerChatSession(user_id=current_user.id, title=title_text or "Career Consultation")
            db.add(session)
            db.commit()
            db.refresh(session)
        elif session.title == "Career Consultation" and req.message.strip():
            msg_snippet = req.message.strip().replace("\n", " ")
            session.title = (msg_snippet[:42] + "...") if len(msg_snippet) > 42 else msg_snippet
            db.commit()
        session_id = session.id

        # Save user message
        user_msg = CareerChatMessage(
            session_id=session.id,
            sender="user",
            content=req.message
        )
        db.add(user_msg)
        db.commit()

        from app.database.mongodb import mongodb_manager
        mongodb_manager.save_document_sync("career_messages", user_msg.id, {
            "session_id": user_msg.session_id,
            "sender": user_msg.sender,
            "content": user_msg.content,
            "created_at": str(user_msg.created_at)
        })

        # Get conversation history
        past_messages = db.query(CareerChatMessage).filter(
            CareerChatMessage.session_id == session.id
        ).order_by(CareerChatMessage.created_at).all()

        conv_history = [{"role": "assistant" if m.sender == "assistant" else "user", "content": m.content} for m in past_messages]
    else:
        # Guest conversation flow
        conv_history = [{"role": "user", "content": req.message}]

    user_context = _build_context(current_user, db)

    try:
        context_str = CareerAIService._build_user_context_string(user_context)
        system_prompt = (
            "You are Kuromi, an Elite Executive Career Coach & Talent Strategist at 'AI Resume & Interview Coach'.\n"
            "Your advice MUST be personalized to the candidate's exact background, verified skills, and target role.\n"
            "CRITICAL RULES:\n"
            "- Answer directly first, followed by clear concise explanations.\n"
            "- If a Yes/No question, begin with 'Yes.' or 'No.' (or in Hindi 'हाँ।'/'नहीं।', Marathi 'होय.'/'नाही.').\n"
            "- Never provide generic boilerplate when answering specific technical or career questions.\n"
            "- Address actual strengths, trade-offs, and practical steps directly.\n"
            "- Be motivating, pragmatic, tactical, and strategic.\n\n"
            f"CANDIDATE DOSSIER:\n{context_str}"
        )
        ai_messages = [{"role": "system", "content": system_prompt}] + conv_history

        ai_reply = await ai_provider.generate(ai_messages, temperature=0.7, max_tokens=1500)

        # Save assistant message if authenticated
        if current_user and session:
            bot_msg = CareerChatMessage(
                session_id=session.id,
                sender="assistant",
                content=ai_reply
            )
            db.add(bot_msg)
            db.commit()

            from app.database.mongodb import mongodb_manager
            mongodb_manager.save_document_sync("career_messages", bot_msg.id, {
                "session_id": bot_msg.session_id,
                "sender": bot_msg.sender,
                "content": bot_msg.content,
                "created_at": str(bot_msg.created_at)
            })

        return {
            "session_id": session_id,
            "message": ai_reply,
            "sender": "assistant"
        }
    except AIProviderException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to communicate with Career AI: {str(e)}")

@router.get("/messages")
def get_chat_messages(
    session_id: Optional[str] = None,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    if not current_user:
        return {"session_id": None, "messages": []}

    if not session_id:
        session = db.query(CareerChatSession).filter(
            CareerChatSession.user_id == current_user.id
        ).order_by(CareerChatSession.updated_at.desc()).first()
        if not session:
            return {"session_id": None, "messages": []}
        session_id = session.id

    messages = db.query(CareerChatMessage).filter(
        CareerChatMessage.session_id == session_id
    ).order_by(CareerChatMessage.created_at).all()

    return {
        "session_id": session_id,
        "messages": [{"id": m.id, "sender": m.sender, "content": m.content, "created_at": m.created_at} for m in messages]
    }

@router.get("/sessions")
def get_user_chat_sessions(
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    if not current_user:
        return []
    sessions = db.query(CareerChatSession).filter(
        CareerChatSession.user_id == current_user.id
    ).order_by(CareerChatSession.updated_at.desc()).all()

    result = []
    for s in sessions:
        last_msg = db.query(CareerChatMessage).filter(
            CareerChatMessage.session_id == s.id
        ).order_by(CareerChatMessage.created_at.desc()).first()
        msg_count = db.query(CareerChatMessage).filter(
            CareerChatMessage.session_id == s.id
        ).count()
        result.append({
            "id": s.id,
            "title": s.title or "Career Consultation",
            "created_at": s.created_at.isoformat() if s.created_at else None,
            "updated_at": s.updated_at.isoformat() if s.updated_at else None,
            "message_count": msg_count,
            "last_message": last_msg.content[:80] if last_msg else None
        })
    return result

@router.delete("/sessions/{session_id}")
def delete_chat_session(
    session_id: str,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    if not current_user:
        return {"success": True, "message": "Guest session removed"}
    session = db.query(CareerChatSession).filter(
        CareerChatSession.id == session_id,
        CareerChatSession.user_id == current_user.id
    ).first()
    if session:
        db.delete(session)
        db.commit()
    return {"success": True, "message": "Session deleted"}

@router.delete("/sessions")
def clear_all_chat_sessions(
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    if not current_user:
        return {"success": True, "message": "Guest history cleared"}
    db.query(CareerChatSession).filter(
        CareerChatSession.user_id == current_user.id
    ).delete(synchronize_session=False)
    db.commit()
    return {"success": True, "message": "All sessions cleared"}

@router.post("/roadmap")
async def generate_career_roadmap(
    req: CareerRoadmapRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_context = _build_context(current_user, db)
    try:
        roadmap = await CareerAIService.generate_career_roadmap(
            target_role=req.target_role or current_user.target_job_role,
            timeline_months=req.timeline_months or 6,
            user_context=user_context
        )
        return roadmap
    except AIProviderException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate roadmap: {str(e)}")
