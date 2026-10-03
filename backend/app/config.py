import os
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    ENVIRONMENT: str = "development"
    PORT: int = 8000
    JWT_SECRET: str = "ai_resume_super_secret_jwt_key_change_in_production_998877"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440 # 24 hours
    
    # Database
    DATABASE_TYPE: str = "mongodb"
    DATABASE_URL: Optional[str] = None
    MONGODB_URL: Optional[str] = "mongodb+srv://yashsingh200627_db_user:<db_password>@cluster0.yahem2x.mongodb.net/?appName=Cluster0"
    MONGODB_DB_NAME: str = "ai_resume_coach"
    
    # AI Configuration (OpenAI, Groq, DeepSeek, Ollama, etc.)
    AI_NAME: str = "Kuromi"
    AI_FULL_NAME: str = "Kuromi AI Career & Interview Coach"
    AI_API_BASE_URL: str = "https://api.openai.com/v1"
    AI_API_KEY: Optional[str] = ""
    AI_MODEL: str = "gpt-4o-mini"
    
    # CORS
    FRONTEND_URL: str = "http://localhost:5173"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "allow"

settings = Settings()
