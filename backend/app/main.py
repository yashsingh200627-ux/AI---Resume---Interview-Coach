from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from app.config import settings
from app.database.session import init_db
from app.api import (
    auth, profile, resumes, resume_analysis, ats_analysis,
    job_descriptions, job_match, interviews, star_analysis,
    career_chat, dashboard, settings_api, admin_auth, admin_dashboard,
    admin_users, admin_resumes, admin_interviews, admin_jobs, admin_career,
    admin_logs, admin_settings, admin_management
)
from app.ai.provider import AIProviderException

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize MongoDB connection lo& indexes
    init_db()
    from app.database.mongodb import mongodb_manager
    if mongodb_manager.is_connected:
        print(f"[MongoDB Atlas] Active and connected as primary cloud database: '{mongodb_manager.db_name}'.")
    elif mongodb_manager.connection_error:
        print(f"[MongoDB Atlas] Connection notice: {mongodb_manager.connection_error}")
    yield

app = FastAPI(
    title="AI Resume & Interview Coach API",
    description="Backend services for AI Resume Builder, Real Resume & ATS Analyzer, Live AI Interview Coach, and Career Guidance.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS setup
origins = [
"https://ai-resume-interview-coach-eight.vercel.app",
"http://localhost:5173",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(AIProviderException)
async def ai_provider_exception_handler(request: Request, exc: AIProviderException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.message, "type": "AIProviderException"}
    )

# Include Routers with /api prefix
app.include_router(auth.router, prefix="/api")
app.include_router(profile.router, prefix="/api")
app.include_router(resumes.router, prefix="/api")
app.include_router(resume_analysis.router, prefix="/api")
app.include_router(ats_analysis.router, prefix="/api")
app.include_router(job_descriptions.router, prefix="/api")
app.include_router(job_match.router, prefix="/api")
app.include_router(interviews.router, prefix="/api")
app.include_router(star_analysis.router, prefix="/api")
app.include_router(career_chat.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")
app.include_router(settings_api.router, prefix="/api")

# Admin Routers
app.include_router(admin_auth.router, prefix="/api")
app.include_router(admin_dashboard.router, prefix="/api")
app.include_router(admin_users.router, prefix="/api")
app.include_router(admin_resumes.router, prefix="/api")
app.include_router(admin_interviews.router, prefix="/api")
app.include_router(admin_jobs.router, prefix="/api")
app.include_router(admin_career.router, prefix="/api")
app.include_router(admin_logs.router, prefix="/api")
app.include_router(admin_settings.router, prefix="/api")
app.include_router(admin_management.router, prefix="/api")

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "app": "AI Resume & Interview Coach",
        "version": "1.0.0",
        "tagline": "Build Better. Prepare Smarter. Get Hired."
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=settings.PORT, reload=True)
