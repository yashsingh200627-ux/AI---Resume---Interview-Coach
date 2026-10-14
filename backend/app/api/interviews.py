import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from app.database.session import get_db
from app.models.models import (
    User, InterviewSession, InterviewQuestion, InterviewAnswer, InterviewFeedback
)
from app.schemas.schemas import (
    InterviewStartRequest, InterviewQuestionResponse,
    InterviewAnswerSubmit, InterviewFeedbackResponse,
    InterviewSessionDetail
)
from app.services.auth_service import get_current_user
from app.ai.interview_ai import InterviewAIService
from app.ai.provider import AIProviderException

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/interviews", tags=["AI Interview Coach"])

@router.post("/start")
async def start_interview(
    req: InterviewStartRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # 1. Create interview session
    session = InterviewSession(
        user_id=current_user.id,
        target_role=req.target_role,
        experience_level=req.experience_level,
        interview_type=req.interview_type,
        difficulty=req.difficulty,
        total_questions=req.total_questions,
        status="in_progress"
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    # 2. AI generates initial question
    try:
        q_data = await InterviewAIService.generate_initial_question(
            target_role=req.target_role,
            experience_level=req.experience_level,
            interview_type=req.interview_type,
            difficulty=req.difficulty
        )
    except AIProviderException as e:
        db.delete(session)
        db.commit()
        raise HTTPException(status_code=e.status_code, detail=e.message)
    except Exception as e:
        db.delete(session)
        db.commit()
        raise HTTPException(status_code=500, detail=f"Failed to generate opening interview question: {str(e)}")

    question = InterviewQuestion(
        session_id=session.id,
        question_number=1,
        question_text=q_data["question_text"],
        question_type=q_data.get("question_type", req.interview_type),
        expected_topics=q_data.get("expected_topics", [])
    )
    db.add(question)
    db.commit()
    db.refresh(question)

    # Sync to MongoDB Atlas
    from app.database.mongodb import mongodb_manager
    mongodb_manager.save_document_sync("interview_sessions", session.id, {
        "user_id": session.user_id,
        "target_role": session.target_role,
        "experience_level": session.experience_level,
        "interview_type": session.interview_type,
        "difficulty": session.difficulty,
        "total_questions": session.total_questions,
        "status": session.status,
        "created_at": str(session.created_at)
    })
    mongodb_manager.save_document_sync("interview_questions", question.id, {
        "session_id": question.session_id,
        "question_number": question.question_number,
        "question_text": question.question_text,
        "question_type": question.question_type,
        "expected_topics": question.expected_topics
    })

    return {
        "session_id": session.id,
        "target_role": session.target_role,
        "experience_level": session.experience_level,
        "interview_type": session.interview_type,
        "difficulty": session.difficulty,
        "total_questions": session.total_questions,
        "question": {
            "id": question.id,
            "question_number": question.question_number,
            "question_text": question.question_text,
            "question_type": question.question_type,
            "expected_topics": question.expected_topics
        }
    }

@router.post("/message", response_model=InterviewFeedbackResponse)
async def submit_interview_answer(
    req: InterviewAnswerSubmit,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    session = db.query(InterviewSession).filter(
        InterviewSession.id == req.session_id,
        InterviewSession.user_id == current_user.id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Interview session not found")

    question = db.query(InterviewQuestion).filter(
        InterviewQuestion.id == req.question_id,
        InterviewQuestion.session_id == session.id
    ).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found in this session")

    # Save answer
    answer = db.query(InterviewAnswer).filter(InterviewAnswer.question_id == question.id).first()
    if answer:
        answer.answer_text = req.answer_text
        answer.duration_seconds = req.duration_seconds or 0
    else:
        answer = InterviewAnswer(
            question_id=question.id,
            user_id=current_user.id,
            answer_text=req.answer_text,
            duration_seconds=req.duration_seconds or 0
        )
        db.add(answer)
    db.commit()
    db.refresh(answer)

    # Collect previous QA context for AI coherence
    all_questions = db.query(InterviewQuestion).filter(
        InterviewQuestion.session_id == session.id
    ).order_by(InterviewQuestion.question_number).all()

    qa_context = []
    for q in all_questions:
        ans = db.query(InterviewAnswer).filter(InterviewAnswer.question_id == q.id).first()
        if ans:
            qa_context.append({"question": q.question_text, "answer": ans.answer_text})

    # Evaluate answer and generate next
    try:
        eval_result = await InterviewAIService.evaluate_answer_and_generate_next(
            target_role=session.target_role,
            interview_type=session.interview_type,
            difficulty=session.difficulty,
            question_text=question.question_text,
            answer_text=req.answer_text,
            previous_qa_context=qa_context,
            current_question_number=question.question_number,
            total_questions=session.total_questions
        )
    except AIProviderException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to evaluate answer: {str(e)}")

    overall_score = float(eval_result.get("overall_score", 5.0))
    content_score = float(eval_result.get("content_score", overall_score))
    technical_score = float(eval_result.get("technical_score", overall_score))
    communication_score = float(eval_result.get("communication_score", overall_score))
    structure_score = float(eval_result.get("structure_score", overall_score))
    relevance_score = float(eval_result.get("relevance_score", overall_score))
    feedback_text = eval_result.get("feedback_text") or eval_result.get("evaluation_summary") or "Answer recorded and evaluated."
    follow_up = eval_result.get("follow_up_question")
    strengths = eval_result.get("strengths") or ["Answer submitted to session"]
    improvements = eval_result.get("improvements") or ["Provide additional technical details and trade-offs"]
    star_eval = eval_result.get("star_evaluation") or eval_result.get("star_feedback")

    # Save feedback
    feedback = db.query(InterviewFeedback).filter(InterviewFeedback.answer_id == answer.id).first()
    if not feedback:
        feedback = InterviewFeedback(
            answer_id=answer.id,
            overall_score=overall_score,
            content_score=content_score,
            technical_score=technical_score,
            communication_score=communication_score,
            structure_score=structure_score,
            relevance_score=relevance_score,
            feedback_text=feedback_text,
            follow_up_question=follow_up,
            strengths=strengths,
            improvements=improvements,
            star_evaluation=star_eval
        )
        db.add(feedback)
    else:
        feedback.overall_score = overall_score
        feedback.content_score = content_score
        feedback.technical_score = technical_score
        feedback.communication_score = communication_score
        feedback.structure_score = structure_score
        feedback.relevance_score = relevance_score
        feedback.feedback_text = feedback_text
        feedback.follow_up_question = follow_up
        feedback.strengths = strengths
        feedback.improvements = improvements
        feedback.star_evaluation = star_eval
    db.commit()
    db.refresh(feedback)

    # Sync to MongoDB Atlas
    from app.database.mongodb import mongodb_manager
    mongodb_manager.save_document_sync("interview_answers", answer.id, {
        "question_id": answer.question_id,
        "user_id": answer.user_id,
        "answer_text": answer.answer_text,
        "duration_seconds": answer.duration_seconds
    })
    mongodb_manager.save_document_sync("interview_feedbacks", feedback.id, {
        "answer_id": feedback.answer_id,
        "overall_score": feedback.overall_score,
        "content_score": feedback.content_score,
        "technical_score": feedback.technical_score,
        "feedback_text": feedback.feedback_text,
        "strengths": feedback.strengths,
        "improvements": feedback.improvements
    })

    # Next question handling
    next_q_resp = None
    is_completed = (question.question_number >= session.total_questions)
    
    if not is_completed and eval_result.get("next_question"):
        nq_data = eval_result["next_question"]
        nq = InterviewQuestion(
            session_id=session.id,
            question_number=question.question_number + 1,
            question_text=nq_data.get("question_text", "Could you elaborate further on your experience?"),
            question_type=nq_data.get("question_type", session.interview_type),
            expected_topics=nq_data.get("expected_topics", [])
        )
        db.add(nq)
        db.commit()
        db.refresh(nq)
        next_q_resp = InterviewQuestionResponse(
            id=nq.id,
            question_number=nq.question_number,
            question_text=nq.question_text,
            question_type=nq.question_type,
            expected_topics=nq.expected_topics or []
        )

    return {
        "overall_score": feedback.overall_score,
        "content_score": feedback.content_score,
        "technical_score": feedback.technical_score,
        "communication_score": feedback.communication_score,
        "structure_score": feedback.structure_score,
        "relevance_score": feedback.relevance_score,
        "feedback_text": feedback.feedback_text,
        "follow_up_question": feedback.follow_up_question,
        "strengths": feedback.strengths or [],
        "improvements": feedback.improvements or [],
        "star_evaluation": feedback.star_evaluation,
        "next_question": next_q_resp,
        "is_completed": is_completed
    }

@router.post("/{id}/complete")
async def complete_interview(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    session = db.query(InterviewSession).filter(
        InterviewSession.id == id,
        InterviewSession.user_id == current_user.id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Interview session not found")

    questions = db.query(InterviewQuestion).filter(
        InterviewQuestion.session_id == session.id
    ).order_by(InterviewQuestion.question_number).all()

    qa_list = []
    for q in questions:
        ans = db.query(InterviewAnswer).filter(InterviewAnswer.question_id == q.id).first()
        if ans:
            fb = db.query(InterviewFeedback).filter(InterviewFeedback.answer_id == ans.id).first()
            qa_list.append({
                "question": q.question_text,
                "answer": ans.answer_text,
                "score": fb.overall_score if fb else None,
                "feedback": fb.feedback_text if fb else ""
            })

    if not qa_list:
        raise HTTPException(status_code=400, detail="Cannot complete an interview with no answers recorded.")

    try:
        report_data = await InterviewAIService.generate_final_report(
            session_id=session.id,
            target_role=session.target_role,
            interview_type=session.interview_type,
            difficulty=session.difficulty,
            qa_history=qa_list
        )
    except Exception as e:
        logger.error(f"Error during report generation: {e}")
        raise HTTPException(status_code=500, detail="Failed to synthesize interview report.")

    session.status = "completed"
    session.overall_score = report_data["overall_score"]
    session.content_score = report_data["content_score"]
    session.technical_score = report_data["technical_score"]
    session.communication_score = report_data["communication_score"]
    session.structure_score = report_data["structure_score"]
    session.relevance_score = report_data["relevance_score"]
    session.summary_strengths = report_data.get("summary_strengths", [])
    session.summary_improvements = report_data.get("summary_improvements", [])
    session.recommended_practice = report_data.get("recommended_practice", [])
    session.final_report = report_data.get("final_report", "")
    
    db.add(session)
    db.commit()
    db.refresh(session)

    return get_interview_session(id=session.id, current_user=current_user, db=db)

@router.get("/history", response_model=List[InterviewSessionDetail])
def get_interview_history(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    sessions = db.query(InterviewSession).filter(
        InterviewSession.user_id == current_user.id
    ).order_by(InterviewSession.created_at.desc()).all()
    
    result = []
    for s in sessions:
        q_count = db.query(InterviewQuestion).filter(InterviewQuestion.session_id == s.id).count()
        result.append({
            "id": s.id,
            "target_role": s.target_role,
            "experience_level": s.experience_level,
            "interview_type": s.interview_type,
            "difficulty": s.difficulty,
            "total_questions": s.total_questions,
            "status": s.status,
            "overall_score": s.overall_score,
            "content_score": s.content_score,
            "technical_score": s.technical_score,
            "communication_score": s.communication_score,
            "structure_score": s.structure_score,
            "relevance_score": s.relevance_score,
            "summary_strengths": s.summary_strengths or [],
            "summary_improvements": s.summary_improvements or [],
            "recommended_practice": s.recommended_practice or [],
            "final_report": s.final_report,
            "questions": [],
            "created_at": s.created_at
        })
    return result

@router.get("/{id}")
def get_interview_session(id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    session = db.query(InterviewSession).filter(
        InterviewSession.id == id,
        InterviewSession.user_id == current_user.id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Interview session not found")

    questions = db.query(InterviewQuestion).filter(
        InterviewQuestion.session_id == session.id
    ).order_by(InterviewQuestion.question_number).all()

    detailed_questions = []
    for q in questions:
        ans = db.query(InterviewAnswer).filter(InterviewAnswer.question_id == q.id).first()
        fb = None
        if ans:
            fb_record = db.query(InterviewFeedback).filter(InterviewFeedback.answer_id == ans.id).first()
            if fb_record:
                fb = {
                    "overall_score": fb_record.overall_score,
                    "content_score": fb_record.content_score,
                    "technical_score": fb_record.technical_score,
                    "communication_score": fb_record.communication_score,
                    "structure_score": fb_record.structure_score,
                    "relevance_score": fb_record.relevance_score,
                    "feedback_text": fb_record.feedback_text,
                    "follow_up_question": fb_record.follow_up_question,
                    "strengths": fb_record.strengths or [],
                    "improvements": fb_record.improvements or [],
                    "star_evaluation": fb_record.star_evaluation
                }

        detailed_questions.append({
            "id": q.id,
            "question_number": q.question_number,
            "question_text": q.question_text,
            "question_type": q.question_type,
            "expected_topics": q.expected_topics or [],
            "answer": {
                "id": ans.id,
                "answer_text": ans.answer_text,
                "duration_seconds": ans.duration_seconds
            } if ans else None,
            "feedback": fb
        })

    return {
        "id": session.id,
        "target_role": session.target_role,
        "experience_level": session.experience_level,
        "interview_type": session.interview_type,
        "difficulty": session.difficulty,
        "total_questions": session.total_questions,
        "status": session.status,
        "overall_score": session.overall_score,
        "content_score": session.content_score,
        "technical_score": session.technical_score,
        "communication_score": session.communication_score,
        "structure_score": session.structure_score,
        "relevance_score": session.relevance_score,
        "summary_strengths": session.summary_strengths or [],
        "summary_improvements": session.summary_improvements or [],
        "recommended_practice": session.recommended_practice or [],
        "final_report": session.final_report,
        "questions": detailed_questions,
        "created_at": session.created_at
    }
