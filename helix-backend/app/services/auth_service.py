import random
import string
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from fastapi import HTTPException, status, BackgroundTasks

from app.models.user import User, UserRole
from app.models.researcher_profile import ResearcherProfile
from app.models.researcher_draft import ResearcherDraft
from app.schemas.auth import (
    LoginRequest,
    RegisterRequest,
    TokenResponse,
    RegisterResponse,
    UserResponse,
    ForgotPasswordRequest,
    VerifyResetOTPRequest,
    ResetPasswordRequest,
)
from app.utils.password import hash_password, verify_password
from app.utils.jwt import create_access_token, create_refresh_token, decode_token, create_reset_token
from app.services import email_service


def _generate_otp(length: int = 6) -> str:
    """Generate a cryptographically simple numeric OTP."""
    return "".join(random.choices(string.digits, k=length))


def login_user(payload: LoginRequest, db: Session) -> TokenResponse:
    """Authenticate a user and return JWT tokens."""
    clean_email = payload.email.strip().lower()
    user = db.query(User).filter(User.email.ilike(clean_email)).first()

    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
        )

    if user.is_approved == "PENDING":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your registration request is pending Super Admin approval. Please wait until approved.",
        )
    elif user.is_approved == "REJECTED":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your registration request has been rejected. Contact administrator.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account has been deactivated. Contact your administrator.",
        )

    # Update last login timestamp
    user.last_login_at = datetime.utcnow()
    db.commit()
    db.refresh(user)

    token_data = {"sub": str(user.id), "role": user.role.value}
    return TokenResponse(
        access_token=create_access_token(token_data),
        refresh_token=create_refresh_token(token_data),
        user=UserResponse.model_validate(user),
    )


def register_user(payload: RegisterRequest, db: Session) -> RegisterResponse:
    """
    Register a new user account.
    If any researcher fields are provided, also creates a ResearcherProfile record.
    Marks the associated draft as 'submitted' if one exists for this email.
    """
    clean_email = payload.email.strip().lower()
    existing = db.query(User).filter(User.email.ilike(clean_email)).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    assigned_role = UserRole.STUDENT
    is_approved = "PENDING"

    # ── 1. Create User (auth fields only) ────────────────────────────────────
    new_user = User(
        full_name=payload.full_name,
        email=clean_email,
        password_hash=hash_password(payload.password),
        role=assigned_role,
        is_active=(is_approved == "APPROVED"),
        is_approved=is_approved,
        registration_reason=payload.registration_reason,
        photo_url=payload.photo_url,
    )
    db.add(new_user)
    db.flush()  # flush to get new_user.id before creating profile

    # ── 2. Create ResearcherProfile if researcher fields are present ──────────
    has_researcher_data = any([
        payload.institution, payload.qualification, payload.specialization,
        payload.researcher_role, payload.research_area, payload.id_proof_url,
    ])

    if has_researcher_data:
        profile = ResearcherProfile(
            user_id=new_user.id,
            phone=payload.phone,
            date_of_birth=payload.date_of_birth,
            gender=payload.gender,
            institution=payload.institution,
            qualification=payload.qualification,
            specialization=payload.specialization,
            researcher_role=payload.researcher_role,
            experience_years=payload.experience_years,
            linkedin_url=payload.linkedin_url,
            research_area=payload.research_area,
            cancer_interest=payload.cancer_interest,
            research_duration=payload.research_duration,
            supervisor_name=payload.supervisor_name,
            prior_work_details=payload.prior_work_details,
            id_proof_url=payload.id_proof_url,
            institutional_id_url=payload.institutional_id_url,
            letter_of_intent_url=payload.letter_of_intent_url,
            publications_url=payload.publications_url,
        )
        db.add(profile)

    # ── 3. Mark associated draft as 'submitted' ───────────────────────────────
    draft = db.query(ResearcherDraft).filter(ResearcherDraft.email == payload.email).first()
    if draft:
        draft.status = "submitted"

    db.commit()
    db.refresh(new_user)

    # ── 4. Return response ────────────────────────────────────────────────────
    # Email notification is queued by the route layer (routes/auth.py) via
    # FastAPI BackgroundTasks after this function returns, keeping the service
    # layer free of I/O side-effects and easy to unit-test.
    if is_approved == "PENDING":
        return RegisterResponse(
            pending=True,
            message="Your researcher application has been submitted and is pending Super Admin approval. Please check your email for confirmation.",
            user=UserResponse.model_validate(new_user),
        )

    token_data = {"sub": str(new_user.id), "role": new_user.role.value}
    return RegisterResponse(
        pending=False,
        access_token=create_access_token(token_data),
        refresh_token=create_refresh_token(token_data),
        user=UserResponse.model_validate(new_user),
    )


def refresh_access_token(refresh_token: str, db: Session) -> dict:
    """Exchange a valid refresh token for a new access token."""
    payload = decode_token(refresh_token)

    if payload is None or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token.",
        )

    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == int(user_id)).first()

    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or deactivated.",
        )

    token_data = {"sub": str(user.id), "role": user.role.value}
    return {
        "access_token": create_access_token(token_data),
        "token_type": "bearer",
    }


def forgot_password_service(payload: ForgotPasswordRequest, background_tasks: BackgroundTasks, db: Session) -> dict:
    """
    Generate 6-digit OTP for password reset, save to DB with 10-min expiration,
    and trigger email via BackgroundTasks.
    """
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No registered user account found with this email address.",
        )

    otp = _generate_otp(6)
    user.reset_otp = otp
    user.reset_otp_expires_at = datetime.utcnow() + timedelta(minutes=10)
    db.commit()

    # Queue background email task
    background_tasks.add_task(
        email_service.send_password_reset_otp,
        user_email=user.email,
        user_name=user.full_name,
        otp_code=otp,
        expiry_minutes=10,
    )

    return {
        "message": "A 6-digit verification code has been sent to your email address.",
        "email": user.email,
    }



def verify_reset_otp_service(payload: VerifyResetOTPRequest, db: Session) -> dict:
    """
    Verify the 6-digit OTP code against the user's recorded reset_otp.
    Invalidates the OTP upon successful verification and generates a temporary reset JWT token.
    """
    user = db.query(User).filter(User.email == payload.email).first()

    if not user or not user.reset_otp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification code.",
        )

    # Check expiration
    if user.reset_otp_expires_at is None or datetime.utcnow() > user.reset_otp_expires_at:
        user.reset_otp = None
        user.reset_otp_expires_at = None
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification code has expired. Please request a new code.",
        )

    # Check OTP match
    if user.reset_otp != payload.otp.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect 6-digit verification code. Please try again.",
        )

    # OTP is valid — invalidate OTP immediately to prevent replay attacks
    user.reset_otp = None
    user.reset_otp_expires_at = None
    db.commit()

    # Create temporary password reset token valid for 15 minutes
    reset_token = create_reset_token({"sub": str(user.id), "email": user.email})

    return {
        "message": "OTP verified successfully.",
        "reset_token": reset_token,
    }


def reset_password_service(payload: ResetPasswordRequest, db: Session) -> dict:
    """Reset user password using temporary reset token."""
    decoded = decode_token(payload.token)
    if not decoded or decoded.get("type") != "reset_password":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token. Please request a new OTP code.",
        )

    user_id = decoded.get("sub")
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User account not found or deactivated.",
        )

    user.password_hash = hash_password(payload.new_password)
    user.reset_otp = None
    user.reset_otp_expires_at = None
    db.commit()

    return {"message": "Password has been reset successfully. Please log in with your new password."}

