"""
Researcher Application API
--------------------------
Public endpoints (no JWT required) for managing draft researcher applications.

Endpoints:
  POST   /api/v1/researcher/save-draft      — Create or upsert draft by email
  PUT    /api/v1/researcher/update-draft/:id — Auto-save step + form_data
  POST   /api/v1/researcher/request-otp     — Send OTP for draft resume (stdout in dev)
  POST   /api/v1/researcher/verify-otp      — Verify OTP → return draft data if valid
"""
import json
from datetime import datetime, timedelta

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.db import get_db
from app.models.user import User
from app.models.researcher_draft import ResearcherDraft
from app.schemas.researcher import (
    DraftSaveRequest,
    DraftUpdateRequest,
    DraftResponse,
    OTPRequest,
    OTPVerifyRequest,
)
from app.services import email_service
from app.utils.password import generate_otp

router = APIRouter(prefix="/researcher", tags=["Researcher Application"])

OTP_EXPIRY_MINUTES = 10


def _serialize_draft(draft: ResearcherDraft) -> DraftResponse:
    """Convert ORM draft to response schema, parsing JSON form_data."""
    form_data = {}
    if draft.form_data:
        try:
            form_data = json.loads(draft.form_data)
        except (json.JSONDecodeError, TypeError):
            form_data = {}
    return DraftResponse(
        id=draft.id,
        email=draft.email,
        current_step=draft.current_step,
        form_data=form_data,
        status=draft.status,
        updated_at=draft.updated_at,
    )


# ─────────────────────────────────────────────────────────────────────────────
# POST /researcher/save-draft
# ─────────────────────────────────────────────────────────────────────────────
@router.post("/save-draft", response_model=DraftResponse, status_code=status.HTTP_201_CREATED)
def save_draft(payload: DraftSaveRequest, db: Session = Depends(get_db)):
    """
    Create or upsert a draft by email.
    Rejects immediately if an account with this email already exists or if a draft was already submitted.
    Returns the draft record so frontend can store the draft ID.
    """
    clean_email = payload.email.strip().lower()

    existing_user = db.query(User).filter(User.email.ilike(clean_email)).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists. Please sign in or use a different email.",
        )

    existing = db.query(ResearcherDraft).filter(ResearcherDraft.email.ilike(clean_email)).first()

    if existing:
        # Upsert — update existing draft
        if existing.status == "submitted":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An application for this email has already been submitted. Please log in or contact support.",
            )
        existing.email = clean_email
        existing.current_step = payload.current_step
        existing.form_data = json.dumps(payload.form_data)
        db.commit()
        db.refresh(existing)
        return _serialize_draft(existing)

    # New draft
    draft = ResearcherDraft(
        email=clean_email,
        current_step=payload.current_step,
        form_data=json.dumps(payload.form_data),
        status="draft",
    )
    db.add(draft)
    db.commit()
    db.refresh(draft)
    return _serialize_draft(draft)


# ─────────────────────────────────────────────────────────────────────────────
# PUT /researcher/update-draft/{draft_id}
# ─────────────────────────────────────────────────────────────────────────────
@router.put("/update-draft/{draft_id}", response_model=DraftResponse)
def update_draft(draft_id: int, payload: DraftUpdateRequest, db: Session = Depends(get_db)):
    """
    Auto-save or manual-save update for an existing draft.
    Called every 60 seconds by the frontend auto-save timer.
    """
    draft = db.query(ResearcherDraft).filter(ResearcherDraft.id == draft_id).first()
    if not draft:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Draft not found.")

    if draft.status == "submitted":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This application has already been submitted and cannot be modified.",
        )

    draft.current_step = payload.current_step
    draft.form_data = json.dumps(payload.form_data)
    db.commit()
    db.refresh(draft)
    return _serialize_draft(draft)


# ─────────────────────────────────────────────────────────────────────────────
# POST /researcher/request-otp
# ─────────────────────────────────────────────────────────────────────────────
@router.post("/request-otp", response_model=dict)
def request_otp(
    payload: OTPRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """
    Generate and send an OTP for secure draft resume verification.
    The OTP is saved to the database synchronously, then an email is
    dispatched asynchronously via BackgroundTasks -- the API never waits
    for email delivery to respond.
    Only sends OTP if a 'draft' (not submitted) exists for this email.
    """
    clean_email = payload.email.strip().lower()
    draft = db.query(ResearcherDraft).filter(ResearcherDraft.email.ilike(clean_email)).first()

    if not draft:
        # Neutral response -- don't reveal whether email has a draft (security)
        return {"message": "If a draft exists for this email, an OTP has been sent."}

    if draft.status == "submitted":
        return {"message": "This application has already been submitted."}

    otp = generate_otp()
    draft.otp_code = otp
    draft.otp_expires_at = datetime.utcnow() + timedelta(minutes=OTP_EXPIRY_MINUTES)
    db.commit()

    # Queue the OTP email as a non-blocking background task.
    # The HTTP response is sent immediately; email delivery happens after.
    # If email fails, it is logged -- the OTP in the DB remains valid.
    background_tasks.add_task(
        email_service.send_otp_email,
        user_email=draft.email,
        otp_code=otp,
        expiry_minutes=OTP_EXPIRY_MINUTES,
    )

    return {"message": "If a draft exists for this email, an OTP has been sent."}


# ─────────────────────────────────────────────────────────────────────────────
# POST /researcher/verify-otp
# ─────────────────────────────────────────────────────────────────────────────
@router.post("/verify-otp", response_model=DraftResponse)
def verify_otp(payload: OTPVerifyRequest, db: Session = Depends(get_db)):
    """
    Verify an OTP and return the full draft data if valid.
    Clears the OTP after successful verification.
    """
    clean_email = payload.email.strip().lower()
    draft = db.query(ResearcherDraft).filter(ResearcherDraft.email.ilike(clean_email)).first()

    if not draft or not draft.otp_code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification code.",
        )

    # Check expiry
    if draft.otp_expires_at is None or datetime.utcnow() > draft.otp_expires_at:
        draft.otp_code = None
        draft.otp_expires_at = None
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification code has expired. Please request a new one.",
        )

    # Check OTP match
    if draft.otp_code != payload.otp.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect verification code. Please try again.",
        )

    # Valid — clear OTP and return draft
    draft.otp_code = None
    draft.otp_expires_at = None
    db.commit()
    db.refresh(draft)

    return _serialize_draft(draft)
