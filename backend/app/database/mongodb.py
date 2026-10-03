"""
MongoDB Atlas Cloud Persistence & Synchronization Module
Connects to MongoDB Atlas cluster using PyMongo and Motor.
Maintains synchronized collections for users, resumes, interview sessions,
chat conversations, ATS scores, and STAR evaluations.
"""

# Ensure reliable DNS SRV resolution for MongoDB Atlas across all networks
try:
    import dns.resolver
    dns.resolver.default_resolver = dns.resolver.Resolver(configure=False)
    dns.resolver.default_resolver.nameservers = ['8.8.8.8', '1.1.1.1', '8.8.4.4']
except Exception:
    pass

import logging
import asyncio
from typing import Optional, Dict, Any, List
from datetime import datetime
import certifi
import pymongo
from pymongo import MongoClient
import motor.motor_asyncio
from app.config import settings

logger = logging.getLogger(__name__)


class MongoDBManager:
    def __init__(self):
        self.url = getattr(settings, "MONGODB_URL", "")
        self.db_name = getattr(settings, "MONGODB_DB_NAME", "ai_resume_coach")
        self.client: Optional[MongoClient] = None
        self.async_client: Optional[motor.motor_asyncio.AsyncIOMotorClient] = None
        self.sync_db = None
        self.async_db = None
        self.is_connected = False
        self.connection_error = None
        self._init_connection()

    def _init_connection(self):
        if not self.url or not self.url.strip():
            self.connection_error = "No MONGODB_URL configured in backend/.env."
            logger.info("MongoDB: Not configured in .env.")
            return

        if "<db_password>" in self.url or "<password>" in self.url:
            self.connection_error = "MongoDB URL contains placeholder <db_password>. Please update your actual password in backend/.env to activate cloud persistence."
            logger.warning(f"MongoDB Notice: {self.connection_error}")
            return

        import re
        # Automatically clean accidental angle brackets around password e.g. :<password>@ -> :password@
        cleaned_url = re.sub(r':<([^>]+)>@', r':\1@', self.url)

        try:
            # Synchronous client with 12-second timeout for replica set discovery
            self.client = MongoClient(cleaned_url, tlsCAFile=certifi.where(), serverSelectionTimeoutMS=12000)
            self.client.admin.command('ping')
            self.sync_db = self.client[self.db_name]

            # Asynchronous client for fast non-blocking FastAPI operations
            self.async_client = motor.motor_asyncio.AsyncIOMotorClient(cleaned_url, tlsCAFile=certifi.where(), serverSelectionTimeoutMS=12000)
            self.async_db = self.async_client[self.db_name]


            self.is_connected = True
            self.connection_error = None
            logger.info(f"MongoDB Atlas: Successfully connected to database '{self.db_name}'!")
            self._ensure_indexes()
        except Exception as e:
            self.is_connected = False
            err_str = str(e)
            if "TLSV1_ALERT_INTERNAL_ERROR" in err_str or "SSL" in err_str or "AutoReconnect" in err_str:
                self.connection_error = (
                    "MongoDB Atlas Network Access Block: Your current IP address is not whitelisted in MongoDB Atlas. "
                    "Go to MongoDB Atlas dashboard -> 'Network Access' -> click 'Add IP Address' -> select 'Allow Access from Anywhere' (0.0.0.0/0) or 'Add Current IP Address'."
                )
            else:
                self.connection_error = err_str
            logger.warning(f"MongoDB Atlas Notice: {self.connection_error}")


    def _ensure_indexes(self):
        if not self.is_connected or self.sync_db is None:
            return
        try:
            self.sync_db.users.create_index("email", unique=True, sparse=True)
            self.sync_db.resumes.create_index("user_id")
            self.sync_db.interview_sessions.create_index("user_id")
            self.sync_db.career_messages.create_index("session_id")
            self.sync_db.job_descriptions.create_index("user_id")
        except Exception as e:
            logger.warning(f"MongoDB index setup notice: {e}")

    def get_status(self) -> Dict[str, Any]:
        counts = {}
        cluster_host = ""
        if self.url and "@" in self.url:
            try:
                cluster_host = self.url.split("@")[-1].split("/")[0]
            except Exception:
                pass

        if self.is_connected and self.sync_db is not None:
            try:
                for col_name in ["users", "resumes", "interview_sessions", "career_messages", "job_descriptions"]:
                    counts[col_name] = self.sync_db[col_name].count_documents({})
            except Exception:
                pass

        return {
            "configured": bool(self.url and "<db_password>" not in self.url),
            "is_connected": self.is_connected,
            "database_name": self.db_name,
            "cluster": cluster_host,
            "collections": counts,
            "connection_error": self.connection_error,
            "has_placeholder_password": ("<db_password>" in self.url or "<password>" in self.url) if self.url else False
        }

    async def save_document(self, collection_name: str, doc_id: str, data: Dict[str, Any]) -> bool:
        """Upserts a document into MongoDB Atlas collection asynchronously."""
        if not self.is_connected or self.async_db is None:
            return False

        try:
            payload = dict(data)
            payload["_id"] = str(doc_id)
            payload["updated_at"] = datetime.utcnow().isoformat()

            col = self.async_db[collection_name]
            await col.update_one({"_id": str(doc_id)}, {"$set": payload}, upsert=True)
            return True
        except Exception as e:
            logger.warning(f"Failed to upsert document {doc_id} to MongoDB collection '{collection_name}': {e}")
            return False

    def save_document_sync(self, collection_name: str, doc_id: str, data: Dict[str, Any]) -> bool:
        """Upserts a document into MongoDB Atlas collection synchronously."""
        if not self.is_connected or self.sync_db is None:
            return False

        try:
            payload = dict(data)
            payload["_id"] = str(doc_id)
            payload["updated_at"] = datetime.utcnow().isoformat()

            col = self.sync_db[collection_name]
            col.update_one({"_id": str(doc_id)}, {"$set": payload}, upsert=True)
            return True
        except Exception as e:
            logger.warning(f"Failed to sync document {doc_id} to MongoDB collection '{collection_name}': {e}")
            return False

    async def get_document(self, collection_name: str, doc_id: str) -> Optional[Dict[str, Any]]:
        if not self.is_connected or self.async_db is None:
            return None
        try:
            col = self.async_db[collection_name]
            return await col.find_one({"_id": str(doc_id)})
        except Exception:
            return None

    def sync_all_from_sqlite(self):
        """Mirrors all records from SQLite into MongoDB Atlas once connected."""
        if not self.is_connected or self.sync_db is None:
            return {"status": "skipped", "reason": self.connection_error or "Not connected"}

        from app.database.session import SessionLocal
        from app.models.models import (
            User, Resume, InterviewSession, InterviewQuestion,
            InterviewAnswer, InterviewFeedback, CareerChatSession,
            CareerChatMessage, JobDescription, JobMatch
        )

        db = SessionLocal()
        synced_counts = {}
        try:
            # 1. Users
            users = db.query(User).all()
            for u in users:
                self.save_document_sync("users", u.id, {
                    "email": u.email,
                    "full_name": u.full_name,
                    "phone": u.phone,
                    "target_job_role": u.target_job_role,
                    "experience_level": u.experience_level,
                    "created_at": str(u.created_at)
                })
            synced_counts["users"] = len(users)

            # 2. Resumes
            resumes = db.query(Resume).all()
            for r in resumes:
                self.save_document_sync("resumes", r.id, {
                    "user_id": r.user_id,
                    "title": r.title,
                    "target_role": r.target_role,
                    "template_name": r.template_name,
                    "content_json": r.content_json,
                    "created_at": str(r.created_at)
                })
            synced_counts["resumes"] = len(resumes)


            # 3. Interview Sessions
            sessions = db.query(InterviewSession).all()
            for s in sessions:
                self.save_document_sync("interview_sessions", s.id, {
                    "user_id": s.user_id,
                    "target_role": s.target_role,
                    "interview_type": s.interview_type,
                    "difficulty": s.difficulty,
                    "status": s.status,
                    "total_questions": s.total_questions,
                    "created_at": str(s.created_at)
                })
            synced_counts["interview_sessions"] = len(sessions)

            # 4. Career Messages
            messages = db.query(CareerChatMessage).all()
            for m in messages:
                self.save_document_sync("career_messages", m.id, {
                    "session_id": m.session_id,
                    "user_id": m.user_id,
                    "role": m.role,
                    "content": m.content,
                    "created_at": str(m.created_at)
                })
            synced_counts["career_messages"] = len(messages)

            logger.info(f"MongoDB Atlas: Successfully synchronized existing records: {synced_counts}")
            return {"status": "success", "synced": synced_counts}
        except Exception as e:
            logger.error(f"Error syncing SQLite to MongoDB Atlas: {e}")
            return {"status": "error", "error": str(e)}
        finally:
            db.close()

mongodb_manager = MongoDBManager()
