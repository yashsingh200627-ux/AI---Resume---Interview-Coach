"""
Pure MongoDB Atlas Session & Query Layer
Directly replaces SQLAlchemy engine/Session with PyMongo operations against MongoDB Atlas.
Provides complete db.query(Model), filter, order_by, limit, add, commit, delete, and refresh functionality.
"""

import logging
from typing import Any, Dict, List, Optional, Type, Union
from datetime import datetime, date
import json
import uuid

from sqlalchemy.sql.elements import BinaryExpression, UnaryExpression, BooleanClauseList, BindParameter
from sqlalchemy.sql.annotation import AnnotatedColumn
from sqlalchemy.orm.attributes import InstrumentedAttribute

from app.database.mongodb import mongodb_manager

logger = logging.getLogger(__name__)


def _extract_column_name(elem: Any) -> str:
    """Extracts column string name from SQLAlchemy column or expression."""
    if hasattr(elem, "key") and elem.key:
        return str(elem.key)
    if hasattr(elem, "name") and elem.name:
        return str(elem.name)
    if hasattr(elem, "expression"):
        return _extract_column_name(elem.expression)
    return str(elem)


def _extract_value(elem: Any) -> Any:
    """Extracts Python value from SQLAlchemy BindParameter or literal."""
    if isinstance(elem, BindParameter):
        return elem.value
    if hasattr(elem, "value"):
        return elem.value
    return elem


def _parse_criterion(criterion: Any) -> Dict[str, Any]:
    """Translates SQLAlchemy binary/unary/boolean expression into a MongoDB filter dictionary."""
    if isinstance(criterion, BinaryExpression):
        op_name = getattr(criterion.operator, "__name__", str(criterion.operator))
        col_name = _extract_column_name(criterion.left)
        val = _extract_value(criterion.right)

        # Map 'id' column to MongoDB '_id' and 'id'
        if col_name == "id":
            if op_name in ("eq", "__eq__"):
                return {"$or": [{"_id": str(val)}, {"id": str(val)}]}
            elif op_name in ("ne", "__ne__"):
                return {"_id": {"$ne": str(val)}, "id": {"$ne": str(val)}}
            elif op_name in ("in_op", "in_"):
                val_list = [str(v) for v in (val if isinstance(val, (list, tuple, set)) else [val])]
                return {"$or": [{"_id": {"$in": val_list}}, {"id": {"$in": val_list}}]}

        # Handle IS NOT NULL and IS NULL
        if op_name in ("is_not", "isnot", "isnot_op") or ("is" in op_name and "not" in op_name):
            return {col_name: {"$ne": None}}
        if op_name in ("is_", "is", "is_op") and (val is None or "Null" in str(type(val)) or str(val) == "NULL"):
            return {col_name: None}

        if "Null" in str(type(val)):
            val = None

        if op_name in ("eq", "__eq__"):
            return {col_name: val}
        elif op_name in ("ne", "__ne__"):
            return {col_name: {"$ne": val}}
        elif op_name in ("lt", "__lt__"):
            return {col_name: {"$lt": val}}
        elif op_name in ("le", "__le__"):
            return {col_name: {"$lte": val}}
        elif op_name in ("gt", "__gt__"):
            return {col_name: {"$gt": val}}
        elif op_name in ("ge", "__ge__"):
            return {col_name: {"$gte": val}}
        elif op_name in ("in_op", "in_"):
            val_list = list(val) if isinstance(val, (list, tuple, set)) else [val]
            return {col_name: {"$in": val_list}}
        elif op_name in ("not_in_op", "not_in"):
            val_list = list(val) if isinstance(val, (list, tuple, set)) else [val]
            return {col_name: {"$nin": val_list}}
        elif op_name in ("like_op", "ilike_op", "like", "ilike"):
            val_str = str(val).strip("%")
            return {col_name: {"$regex": val_str, "$options": "i"}}
        else:
            return {col_name: val}

    elif isinstance(criterion, BooleanClauseList):
        clauses = [_parse_criterion(c) for c in criterion.clauses]
        op_name = getattr(criterion.operator, "__name__", "")
        if "or" in op_name:
            return {"$or": clauses}
        return {"$and": clauses}

    elif isinstance(criterion, dict):
        return criterion

    return {}


class MongoQuery:
    def __init__(self, session: "MongoSession", model_class: Type):
        self.session = session
        self.model_class = model_class
        self.collection_name = getattr(model_class, "__tablename__", model_class.__name__.lower() + "s")
        self._filters: List[Dict[str, Any]] = []
        self._sort_list: List[tuple] = []
        self._limit_val: Optional[int] = None
        self._skip_val: Optional[int] = None

    def filter(self, *criterion) -> "MongoQuery":
        for crit in criterion:
            f = _parse_criterion(crit)
            if f:
                self._filters.append(f)
        return self

    def filter_by(self, **kwargs) -> "MongoQuery":
        for k, v in kwargs.items():
            if k == "id":
                self._filters.append({"$or": [{"_id": str(v)}, {"id": str(v)}]})
            else:
                self._filters.append({k: v})
        return self

    def options(self, *args) -> "MongoQuery":
        # Support SQLAlchemy options like joinedload() gracefully
        return self

    def order_by(self, *clauses) -> "MongoQuery":
        for clause in clauses:
            if isinstance(clause, UnaryExpression):
                # .desc() or .asc()
                col_name = _extract_column_name(clause.element)
                direction = -1 if getattr(clause.modifier, "__name__", "") == "desc_op" or "DESC" in str(clause) else 1
                self._sort_list.append((col_name, direction))
            else:
                col_name = _extract_column_name(clause)
                direction = -1 if "DESC" in str(clause).upper() else 1
                self._sort_list.append((col_name, direction))
        return self

    def limit(self, n: int) -> "MongoQuery":
        self._limit_val = n
        return self

    def offset(self, n: int) -> "MongoQuery":
        self._skip_val = n
        return self

    def _build_mongo_query(self) -> Dict[str, Any]:
        if not self._filters:
            return {}
        if len(self._filters) == 1:
            return self._filters[0]
        return {"$and": self._filters}

    def _doc_to_instance(self, doc: Optional[Dict[str, Any]]) -> Any:
        if not doc:
            return None
        return self.session._instantiate_model(self.model_class, doc)

    def first(self) -> Any:
        col = self.session.get_collection(self.collection_name)
        if col is None:
            return None
        query = self._build_mongo_query()
        sort = self._sort_list if self._sort_list else None
        doc = col.find_one(query, sort=sort)
        return self._doc_to_instance(doc)

    def all(self) -> List[Any]:
        col = self.session.get_collection(self.collection_name)
        if col is None:
            return []
        query = self._build_mongo_query()
        cursor = col.find(query)
        if self._sort_list:
            cursor = cursor.sort(self._sort_list)
        if self._skip_val is not None:
            cursor = cursor.skip(self._skip_val)
        if self._limit_val is not None:
            cursor = cursor.limit(self._limit_val)
        return [self._doc_to_instance(d) for d in cursor]

    def count(self) -> int:
        col = self.session.get_collection(self.collection_name)
        if col is None:
            return 0
        query = self._build_mongo_query()
        return col.count_documents(query)

    def delete(self) -> int:
        col = self.session.get_collection(self.collection_name)
        if col is None:
            return 0
        query = self._build_mongo_query()
        res = col.delete_many(query)
        return res.deleted_count


class MongoSession:
    """Fast, native MongoDB-backed session mimicking SQLAlchemy Session interface."""

    def __init__(self):
        self._staged_upserts: List[Any] = []
        self._staged_deletes: List[Any] = []

    def get_collection(self, name: str):
        if mongodb_manager.sync_db is not None:
            return mongodb_manager.sync_db[name]
        return None

    def query(self, *models) -> MongoQuery:
        model = models[0]
        return MongoQuery(self, model)

    def add(self, instance: Any):
        if instance not in self._staged_upserts:
            self._staged_upserts.append(instance)

    def add_all(self, instances: List[Any]):
        for inst in instances:
            self.add(inst)

    def delete(self, instance: Any):
        if instance not in self._staged_deletes:
            self._staged_deletes.append(instance)

    def commit(self):
        # 1. Process deletes
        for inst in self._staged_deletes:
            col_name = getattr(inst, "__tablename__", inst.__class__.__name__.lower() + "s")
            col = self.get_collection(col_name)
            if col is not None:
                doc_id = str(getattr(inst, "id", getattr(inst, "_id", "")))
                if doc_id:
                    col.delete_one({"$or": [{"_id": doc_id}, {"id": doc_id}]})
        self._staged_deletes.clear()

        # 2. Process upserts
        for inst in self._staged_upserts:
            col_name = getattr(inst, "__tablename__", inst.__class__.__name__.lower() + "s")
            col = self.get_collection(col_name)
            if col is not None:
                doc = self._instance_to_dict(inst)
                doc_id = str(doc.get("id") or doc.get("_id") or str(uuid.uuid4()))
                doc["_id"] = doc_id
                doc["id"] = doc_id
                setattr(inst, "id", doc_id)
                col.update_one({"_id": doc_id}, {"$set": doc}, upsert=True)
        self._staged_upserts.clear()

    def refresh(self, instance: Any):
        col_name = getattr(instance, "__tablename__", instance.__class__.__name__.lower() + "s")
        col = self.get_collection(col_name)
        if col is not None:
            doc_id = str(getattr(instance, "id", getattr(instance, "_id", "")))
            if doc_id:
                doc = col.find_one({"$or": [{"_id": doc_id}, {"id": doc_id}]})
                if doc:
                    self._populate_instance(instance, doc)

    def rollback(self):
        self._staged_upserts.clear()
        self._staged_deletes.clear()

    def close(self):
        self._staged_upserts.clear()
        self._staged_deletes.clear()

    def _instance_to_dict(self, inst: Any) -> Dict[str, Any]:
        """Converts model instance to MongoDB document dict safely."""
        data = {}
        for k, v in inst.__dict__.items():
            # Exclude private/internal attributes (_mongo_session, _sa_instance_state, etc.)
            if k.startswith("_") and k != "_id":
                continue
            # Exclude model relationship instances and sessions
            if hasattr(v, "_sa_instance_state") or hasattr(v, "_mongo_session") or hasattr(v, "__tablename__"):
                continue
            if callable(v) or v.__class__.__name__ == "MongoSession":
                continue
            # Serialize datetimes to ISO strings
            if isinstance(v, (datetime, date)):
                data[k] = v.isoformat()
            elif isinstance(v, (str, int, float, bool, bytes, type(None))):
                data[k] = v
            elif isinstance(v, (list, tuple)):
                data[k] = [
                    item.isoformat() if isinstance(item, (datetime, date))
                    else item
                    for item in v
                    if not (hasattr(item, "_sa_instance_state") or hasattr(item, "_mongo_session") or hasattr(item, "__tablename__") or item.__class__.__name__ == "MongoSession")
                ]
            elif isinstance(v, dict):
                data[k] = {
                    dk: (dv.isoformat() if isinstance(dv, (datetime, date)) else dv)
                    for dk, dv in v.items()
                    if not (hasattr(dv, "_sa_instance_state") or hasattr(dv, "_mongo_session") or hasattr(dv, "__tablename__") or dv.__class__.__name__ == "MongoSession")
                }
            else:
                try:
                    json.dumps(v)
                    data[k] = v
                except Exception:
                    pass
        # Ensure ID exists
        if "id" not in data or not data["id"]:
            data["id"] = str(uuid.uuid4())
        return data

    def _populate_instance(self, inst: Any, doc: Dict[str, Any]):
        for k, v in doc.items():
            if k == "_id":
                continue
            # Try to convert datetime strings if attribute exists
            if isinstance(v, str) and (k.endswith("_at") or "date" in k):
                try:
                    if len(v) >= 19 and "T" in v:
                        v = datetime.fromisoformat(v.replace("Z", "+00:00"))
                    elif len(v) >= 19 and " " in v:
                        v = datetime.strptime(v[:19], "%Y-%m-%d %H:%M:%S")
                except Exception:
                    pass
            # Automatically deserialize stringified JSON fields from legacy tables
            elif isinstance(v, str) and (
                k.endswith("_json") or k in ("expected_topics", "strengths", "improvements", "star_evaluation", "action_items", "metadata_json", "content_json") or v.strip().startswith(("{", "["))
            ):
                try:
                    v = json.loads(v)
                except Exception:
                    pass
            setattr(inst, k, v)
        # Ensure id is set
        if not getattr(inst, "id", None):
            setattr(inst, "id", str(doc.get("_id", "")))
        # Attach session for lazy-loaded relationships
        inst._mongo_session = self

    def _instantiate_model(self, model_class: Type, doc: Dict[str, Any]) -> Any:
        try:
            # Instantiate model
            inst = model_class()
        except Exception:
            # Fallback if __init__ requires args
            inst = object.__new__(model_class)
        self._populate_instance(inst, doc)

        # Dynamically attach relationship properties if needed
        self._attach_relationships(inst, model_class, doc)
        return inst

    def _attach_relationships(self, inst: Any, model_class: Type, doc: Dict[str, Any]):
        """Attaches relation lookups e.g. admin.role, user.profile, etc."""
        class_name = model_class.__name__

        if class_name == "AdminUser" and hasattr(inst, "role_id") and inst.role_id:
            from app.models.models import AdminRole
            role_doc = self.query(AdminRole).filter_by(id=inst.role_id).first()
            inst.role = role_doc

        elif class_name == "InterviewAnswer" and hasattr(inst, "id") and inst.id:
            from app.models.models import InterviewFeedback
            fb = self.query(InterviewFeedback).filter_by(answer_id=inst.id).first()
            inst.feedback = fb

        elif class_name == "JobMatch":
            from app.models.models import JobDescription, User, Resume
            if hasattr(inst, "job_description_id") and inst.job_description_id:
                jd = self.query(JobDescription).filter_by(id=inst.job_description_id).first()
                inst.job_description = jd
            else:
                inst.job_description = None
            if hasattr(inst, "user_id") and inst.user_id:
                u = self.query(User).filter_by(id=inst.user_id).first()
                inst.user = u
            if hasattr(inst, "resume_id") and inst.resume_id:
                r = self.query(Resume).filter_by(id=inst.resume_id).first()
                inst.resume = r

        elif class_name == "ResumeAnalysis":
            from app.models.models import Resume, User
            if hasattr(inst, "resume_id") and inst.resume_id:
                r = self.query(Resume).filter_by(id=inst.resume_id).first()
                inst.resume = r
            if hasattr(inst, "user_id") and inst.user_id:
                u = self.query(User).filter_by(id=inst.user_id).first()
                inst.user = u

        elif class_name == "JobDescription":
            from app.models.models import User
            if hasattr(inst, "user_id") and inst.user_id:
                u = self.query(User).filter_by(id=inst.user_id).first()
                inst.user = u

        elif class_name == "InterviewSession":
            from app.models.models import User
            if hasattr(inst, "user_id") and inst.user_id:
                u = self.query(User).filter_by(id=inst.user_id).first()
                inst.user = u

        elif class_name == "Resume":
            from app.models.models import User
            if hasattr(inst, "user_id") and inst.user_id:
                u = self.query(User).filter_by(id=inst.user_id).first()
                inst.user = u
