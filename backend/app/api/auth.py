from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.models import User, Profile
from app.schemas.schemas import UserRegister, UserLogin, UserResponse, Token
from app.services.auth_service import verify_password, get_password_hash, create_access_token, get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user_in.email.lower()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists."
        )
    
    hashed = get_password_hash(user_in.password)
    user = User(
        email=user_in.email.lower(),
        hashed_password=hashed,
        full_name=user_in.full_name,
        phone=user_in.phone,
        experience_level=user_in.experience_level or "Mid-Level",
        target_job_role=user_in.target_job_role or "Software Engineer"
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Automatically create initial empty profile record
    profile = Profile(
        user_id=user.id,
        headline=f"{user.target_job_role} ({user.experience_level})",
        summary=""
    )
    db.add(profile)
    db.commit()

    # Sync to MongoDB Atlas
    from app.database.mongodb import mongodb_manager
    mongodb_manager.save_document_sync("users", user.id, {
        "email": user.email,
        "full_name": user.full_name,
        "phone": user.phone,
        "experience_level": user.experience_level,
        "target_job_role": user.target_job_role,
        "created_at": str(user.created_at)
    })

    token = create_access_token({"sub": user.id, "email": user.email})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user
    }

@router.post("/login", response_model=Token)
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_data.email.lower()).first()
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    from app.database.mongodb import mongodb_manager
    mongodb_manager.save_document_sync("users", user.id, {
        "email": user.email,
        "full_name": user.full_name,
        "last_login": str(user.updated_at or user.created_at)
    })

    token = create_access_token({"sub": user.id, "email": user.email})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user
    }


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.post("/logout")
def logout(current_user: User = Depends(get_current_user)):
    # Standard client-side token discard, confirmed here
    return {"message": "Successfully logged out"}
