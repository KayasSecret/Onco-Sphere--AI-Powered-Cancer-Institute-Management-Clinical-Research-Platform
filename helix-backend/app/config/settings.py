import os
from pathlib import Path
from pydantic_settings import BaseSettings
from pydantic import ConfigDict
from functools import lru_cache

# Dynamically locate the backend base directory and .env path
BASE_DIR = Path(__file__).resolve().parent.parent.parent
ENV_PATH = BASE_DIR / ".env"


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "mysql+pymysql://root:password@localhost:3306/helix_db"

    # JWT
    JWT_SECRET: str = "helix_dev_secret_change_in_production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Cloudinary
    CLOUDINARY_CLOUD_NAME: str = "placeholder"
    CLOUDINARY_API_KEY: str = "placeholder"
    CLOUDINARY_API_SECRET: str = "placeholder"

    # App
    APP_NAME: str = "HELIX Oncology Intelligence Platform"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"

    # ── Email (Resend HTTPS API) ──────────────────────────────────────────────
    RESEND_API_KEY: str = ""              # Required in production (set in Render env vars)
    EMAIL_FROM: str = ""                  # Verified sender e.g. noreply@yourdomain.com
    EMAIL_FROM_NAME: str = "Onco Sphere"
    EMAIL_REPLY_TO: str = ""              # Optional reply-to address
    SUPER_ADMIN_EMAIL: str = ""           # Where new application alerts are sent
    FRONTEND_URL: str = "http://localhost:5173"

    # Email subjects (configurable via environment — no hardcoding)
    EMAIL_SUBJECT_REGISTRATION: str = "Application Received — Onco Sphere Research Office"
    EMAIL_SUBJECT_OTP: str = "Your Onco Sphere Draft Resume Verification Code"
    EMAIL_SUBJECT_APPROVED: str = "Congratulations! Your Onco Sphere Access Has Been Approved"
    EMAIL_SUBJECT_REJECTED: str = "Update: Your Onco Sphere Access Request"
    EMAIL_SUBJECT_PASSWORD_RESET: str = "Password Reset Verification Code — Onco Sphere"
    EMAIL_SUBJECT_ADMIN_NEW_APPLICATION: str = "New Researcher Application Pending Review"

    # Email retry config
    EMAIL_MAX_RETRIES: int = 3
    EMAIL_RETRY_BASE_DELAY: float = 1.0  # seconds, doubles each attempt

    model_config = ConfigDict(
        env_file=str(ENV_PATH) if ENV_PATH.exists() else ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache()
def get_settings() -> Settings:
    """Return cached settings instance."""
    return Settings()


settings = get_settings()
