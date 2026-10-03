"""
Pure MongoDB Database Session & Engine Configuration
Completely replaces SQLite with MongoDB Atlas as the sole database.
"""

from sqlalchemy.orm import declarative_base
from app.database.mongo_session import MongoSession

Base = declarative_base()
engine = None
SessionLocal = MongoSession

def get_db():
    db = MongoSession()
    try:
        yield db
    finally:
        db.close()

def init_db():
    from app.database.mongodb import mongodb_manager
    if mongodb_manager.is_connected:
        mongodb_manager._ensure_indexes()
