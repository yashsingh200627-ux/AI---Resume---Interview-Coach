from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database.session import get_db
from app.models.models import User, Resume, InterviewSession, AIUsageLog, JobMatch
from app.services.admin_auth_service import require_admin_role

router = APIRouter(prefix="/admin/dashboard", tags=["Admin Dashboard"])

@router.get("/summary", dependencies=[Depends(require_admin_role(["SUPER_ADMIN", "ADMIN", "ANALYST", "SUPPORT"]))])
def get_dashboard_summary(db: Session = Depends(get_db)):
    total_users = db.query(func.count(User.id)).scalar() or 0
    total_resumes = db.query(func.count(Resume.id)).scalar() or 0
    total_interviews = db.query(func.count(InterviewSession.id)).scalar() or 0
    completed_interviews = db.query(func.count(InterviewSession.id)).filter(InterviewSession.status == "completed").scalar() or 0
    
    ai_requests = db.query(func.count(AIUsageLog.id)).scalar() or 0
    job_matches = db.query(func.count(JobMatch.id)).scalar() or 0
    
    # Calculate active users (simplified as all users for now, could filter by last_login)
    active_users = total_users
    
    return {
        "total_users": total_users,
        "active_users": active_users,
        "new_users": 0, # Placeholder for recent users
        "total_resumes": total_resumes,
        "total_interviews": total_interviews,
        "completed_interviews": completed_interviews,
        "ai_requests": ai_requests,
        "job_matches": job_matches
    }

@router.get("/analytics/user-growth", dependencies=[Depends(require_admin_role(["SUPER_ADMIN", "ADMIN", "ANALYST", "SUPPORT"]))])
def get_user_growth(db: Session = Depends(get_db)):
    # Placeholder for actual time-series aggregation
    # Grouping by day/month in SQLite/Postgres varies, so returning sample format for the frontend
    # In a full implementation, you'd use SQLAlchemy extract() or date_trunc
    return [
        {"date": "2024-01", "users": 10},
        {"date": "2024-02", "users": 45},
        {"date": "2024-03", "users": 120},
        {"date": "2024-04", "users": 350},
        {"date": "2024-05", "users": 650},
        {"date": "2024-06", "users": 1020}
    ]
