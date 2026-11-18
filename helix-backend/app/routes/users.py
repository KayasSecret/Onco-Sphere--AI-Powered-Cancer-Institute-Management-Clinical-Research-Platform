from typing import List, Optional
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database.db import get_db
from app.models.user import User, UserRole
from app.middleware.auth import require_roles, get_current_user
from app.utils.password import hash_password, verify_password
from app.schemas.auth import UserResponse, ChangePasswordRequest
from pydantic import BaseModel, EmailStr, Field
from app.services import email_service

router = APIRouter(prefix="/users", tags=["Admin Management"])


# ── Schemas for Admin CRUD ──────────────────────────────────────────────────

class AdminCreate(BaseModel):
    full_name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(min_length=8)
    role: UserRole = UserRole.ADMIN


class AdminUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None


class AdminStatusUpdate(BaseModel):
    is_active: bool


# ── Endpoints (Super Admin and Admin CRUD) ───────────────────────────────────

@router.get("", response_model=dict, dependencies=[Depends(require_roles([UserRole.SUPER_ADMIN, UserRole.ADMIN]))])
def list_admins(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    search: Optional[str] = Query(None),
    role_filter: Optional[UserRole] = Query(None, alias="role"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    List admin and student accounts.
    Super Admin and Admin access. Admin cannot see Super Admins.
    """
    query = db.query(User)

    # Filter out SUPER_ADMINs from list if current user is only an ADMIN
    if current_user.role != UserRole.SUPER_ADMIN:
        query = query.filter(User.role != UserRole.SUPER_ADMIN)

    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                User.full_name.ilike(search_term),
                User.email.ilike(search_term),
            )
        )

    if role_filter:
        query = query.filter(User.role == role_filter)

    total = query.count()
    users = query.order_by(User.created_at.desc()).offset((page - 1) * limit).limit(limit).all()

    return {
        "total": total,
        "page": page,
        "limit": limit,
        "items": [UserResponse.model_validate(u) for u in users],
    }


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_roles([UserRole.SUPER_ADMIN, UserRole.ADMIN]))])
def create_admin(
    payload: AdminCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Create a new admin/student user.
    Super Admin and Admin access. Admin cannot create SUPER_ADMIN.
    """
    if current_user.role != UserRole.SUPER_ADMIN and payload.role == UserRole.SUPER_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admins are not allowed to create Super Admin accounts.",
        )

    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    new_user = User(
        full_name=payload.full_name,
        email=payload.email,
        password_hash=hash_password(payload.password),
        role=payload.role,
        is_active=True,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    photo_url: Optional[str] = None

@router.put("/profile", response_model=UserResponse)
def update_own_profile(
    payload: ProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update authenticated user's own profile info (full_name, photo_url)."""
    if payload.full_name is not None:
        name_val = payload.full_name.strip()
        if len(name_val) < 2:
            raise HTTPException(status_code=400, detail="Name must be at least 2 characters.")
        current_user.full_name = name_val
    if "photo_url" in payload.model_fields_set:
        current_user.photo_url = payload.photo_url if (payload.photo_url and payload.photo_url.strip() != "") else None
    
    db.commit()
    db.refresh(current_user)
    return current_user


@router.put("/{user_id}", response_model=UserResponse, dependencies=[Depends(require_roles([UserRole.SUPER_ADMIN, UserRole.ADMIN]))])
def update_admin(
    user_id: int,
    payload: AdminUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Update admin details.
    Super Admin and Admin access. Admin cannot modify SUPER_ADMIN.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    # Prevent regular ADMIN from modifying a SUPER_ADMIN account
    if current_user.role != UserRole.SUPER_ADMIN and user.role == UserRole.SUPER_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admins cannot modify Super Admin details.",
        )

    # Prevent regular ADMIN from upgrading another account to SUPER_ADMIN
    if current_user.role != UserRole.SUPER_ADMIN and payload.role == UserRole.SUPER_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admins cannot assign the Super Admin role.",
        )

    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(user, key, value)

    db.commit()
    db.refresh(user)
    return user


@router.patch("/{user_id}/status", response_model=UserResponse, dependencies=[Depends(require_roles([UserRole.SUPER_ADMIN, UserRole.ADMIN]))])
def update_admin_status(
    user_id: int,
    payload: AdminStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Soft-delete / Toggle status of user.
    Super Admin and Admin access. Admin cannot toggle SUPER_ADMIN status.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    # Prevent regular ADMIN from toggling status of a SUPER_ADMIN
    if current_user.role != UserRole.SUPER_ADMIN and user.role == UserRole.SUPER_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admins cannot alter status of Super Admin accounts.",
        )

    user.is_active = payload.is_active
    db.commit()
    return user


@router.post("/{user_id}/change-password", response_model=dict)
def change_user_password(
    user_id: int,
    payload: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Verify current password and update user password.
    Accessible by the user themselves or a Super Admin.
    """
    if current_user.id != user_id and current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to change this password."
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found."
        )

    if not verify_password(payload.current_password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect current password."
        )

    user.password_hash = hash_password(payload.new_password)
    db.commit()
    return {"message": "Password changed successfully."}


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(require_roles([UserRole.SUPER_ADMIN, UserRole.ADMIN]))])
def delete_admin(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Hard delete an admin/student user from the database.
    Super Admin and Admin access. Admin cannot delete SUPER_ADMIN.
    """
    if current_user.id == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot delete your own account."
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found."
        )

    if user.role == UserRole.SUPER_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super Admin accounts cannot be deleted."
        )

    db.delete(user)
    db.commit()
    return None


class ApprovalUpdate(BaseModel):
    action: str  # 'APPROVE' or 'REJECT'
    reason: Optional[str] = None  # Optional rejection reason shown in the rejection email


@router.patch("/{user_id}/approval", response_model=UserResponse, dependencies=[Depends(require_roles([UserRole.SUPER_ADMIN, UserRole.ADMIN]))])
def update_user_approval(
    user_id: int,
    payload: ApprovalUpdate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Approve or reject a user registration request.
    Super Admin and Admin access. Admin cannot approve/reject SUPER_ADMIN.
    On decision, a non-blocking email notification is queued via BackgroundTasks.
    The DB update and HTTP response are never delayed by email delivery.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    if current_user.role != UserRole.SUPER_ADMIN and user.role == UserRole.SUPER_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admins cannot approve/reject Super Admin accounts.",
        )

    action = payload.action.upper()
    if action == "APPROVE":
        user.is_approved = "APPROVED"
        user.is_active = True
        db.commit()
        db.refresh(user)

        # Queue approval email -- fully non-blocking
        background_tasks.add_task(
            email_service.send_approval_email,
            user_email=user.email,
            user_name=user.full_name,
            role=user.role.value,
        )

        return user

    elif action == "REJECT":
        user.is_approved = "REJECTED"
        user.is_active = False
        db.commit()
        db.refresh(user)

        # Queue rejection email -- fully non-blocking
        background_tasks.add_task(
            email_service.send_rejection_email,
            user_email=user.email,
            user_name=user.full_name,
            rejection_reason=payload.reason,
        )

        return user

    else:
        raise HTTPException(status_code=400, detail="Invalid action. Must be APPROVE or REJECT.")
