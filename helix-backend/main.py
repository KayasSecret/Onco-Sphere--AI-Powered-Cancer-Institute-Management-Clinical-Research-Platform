from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import logging
import os

from app.config.settings import settings

# ── Structured logging setup ───────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO if settings.ENVIRONMENT == "production" else logging.DEBUG,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logging.getLogger("sqlalchemy.engine").setLevel(
    logging.WARNING if settings.ENVIRONMENT == "production" else logging.INFO
)
logger = logging.getLogger("helix.main")

from app.models import report_generator
from app.models import researcher_profile, researcher_draft  # register new models with ORM
from app.models import visit as visit_models  # register visit models with ORM
from app.database.db import create_tables
from app.routes.health import router as health_router
from app.routes.auth import router as auth_router
from app.routes.dashboard import router as dashboard_router
from app.routes.patients import router as patients_router
from app.routes.upload import router as upload_router
from app.routes.users import router as users_router
from app.routes.report_generator import router as report_generator_router
from app.routes.researcher import router as researcher_router
from app.routes.visits import router as visits_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup / shutdown lifecycle handler."""
    # Create all ORM-defined tables (idempotent — safe to call on every boot)
    create_tables()

    # Ensure auxiliary tables exist with MySQL-compatible syntax.
    # Both tables already exist in cancer_institute, so these are safe no-ops.
    from sqlalchemy import text
    from app.database.db import SessionLocal, engine
    with engine.connect() as raw_conn:
        raw_conn.execute(text("""
            CREATE TABLE IF NOT EXISTS patient_reports (
                id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
                patient_id INT NOT NULL,
                title VARCHAR(255) NOT NULL,
                file_url VARCHAR(500) NOT NULL,
                file_type VARCHAR(50) NOT NULL,
                created_at DATETIME DEFAULT NOW()
            )
        """))
        raw_conn.execute(text("""
            CREATE TABLE IF NOT EXISTS patient_cancer_images (
                id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
                patient_id INT NOT NULL,
                title VARCHAR(255),
                image_url VARCHAR(500) NOT NULL,
                captured_at DATETIME,
                created_at DATETIME DEFAULT NOW()
            )
        """))
        raw_conn.execute(text("""
            CREATE TABLE IF NOT EXISTS visits (
                id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
                visit_code VARCHAR(50) NOT NULL UNIQUE,
                patient_id INT NOT NULL,
                doctor_id INT,
                doctor_name VARCHAR(255),
                department VARCHAR(255) NOT NULL,
                visit_type VARCHAR(100) NOT NULL,
                status VARCHAR(50) NOT NULL DEFAULT 'Scheduled',
                scheduled_at DATETIME NOT NULL,
                checked_in_at DATETIME,
                token_number VARCHAR(20),
                room VARCHAR(100),
                chief_complaint TEXT,
                notes TEXT,
                created_by_id INT,
                created_at DATETIME DEFAULT NOW(),
                updated_at DATETIME DEFAULT NOW() ON UPDATE NOW()
            )
        """))
        raw_conn.execute(text("""
            CREATE TABLE IF NOT EXISTS visit_symptoms (
                id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
                visit_id INT NOT NULL,
                name VARCHAR(255) NOT NULL,
                severity_score TINYINT,
                severity_label VARCHAR(50),
                patient_note TEXT,
                recorded_by_role VARCHAR(50),
                created_at DATETIME DEFAULT NOW()
            )
        """))
        raw_conn.execute(text("""
            CREATE TABLE IF NOT EXISTS visit_investigations (
                id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
                visit_id INT NOT NULL,
                name VARCHAR(255) NOT NULL,
                status VARCHAR(50) NOT NULL DEFAULT 'ordered',
                ordered_at DATETIME DEFAULT NOW(),
                result_url VARCHAR(500)
            )
        """))
        raw_conn.execute(text("""
            CREATE TABLE IF NOT EXISTS visit_prescriptions (
                id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
                visit_id INT NOT NULL,
                medicines JSON NOT NULL,
                instructions TEXT,
                prescribing_doctor_id INT,
                prescribing_doctor_name VARCHAR(255),
                prescribed_at DATETIME DEFAULT NOW()
            )
        """))
        raw_conn.execute(text("""
            CREATE TABLE IF NOT EXISTS visit_treatments (
                id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
                visit_id INT NOT NULL,
                procedure_type VARCHAR(255) NOT NULL,
                notes TEXT,
                performed_by_name VARCHAR(255),
                created_at DATETIME DEFAULT NOW()
            )
        """))
        raw_conn.execute(text("""
            CREATE TABLE IF NOT EXISTS visit_followups (
                id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
                visit_id INT NOT NULL UNIQUE,
                advice_text TEXT,
                next_visit_id INT,
                next_appointment_note TEXT,
                created_at DATETIME DEFAULT NOW()
            )
        """))
        raw_conn.commit()


    db = SessionLocal()
    
    # 1. 'is_approved' column
    try:
        db.execute(text("SELECT is_approved FROM users LIMIT 1"))
    except Exception:
        db.rollback()
        try:
            db.execute(text("ALTER TABLE users ADD COLUMN is_approved VARCHAR(50) DEFAULT 'APPROVED' NOT NULL"))
            db.commit()
            logger.info("Column 'is_approved' added to 'users' table.")
        except Exception as e:
            db.rollback()
            logger.error("Failed to add column 'is_approved': %s", e)

    # 2. 'registration_reason' column
    try:
        db.execute(text("SELECT registration_reason FROM users LIMIT 1"))
    except Exception:
        db.rollback()
        try:
            db.execute(text("ALTER TABLE users ADD COLUMN registration_reason TEXT"))
            db.commit()
            logger.info("Column 'registration_reason' added to 'users' table.")
        except Exception as e:
            db.rollback()
            logger.error("Failed to add column 'registration_reason': %s", e)

    # 3. 'reset_otp' and 'reset_otp_expires_at' columns
    try:
        db.execute(text("SELECT reset_otp FROM users LIMIT 1"))
    except Exception:
        db.rollback()
        try:
            db.execute(text("ALTER TABLE users ADD COLUMN reset_otp VARCHAR(10)"))
            db.execute(text("ALTER TABLE users ADD COLUMN reset_otp_expires_at DATETIME"))
            db.commit()
            logger.info("Columns 'reset_otp' and 'reset_otp_expires_at' added to 'users' table.")
        except Exception as e:
            db.rollback()
            logger.error("Failed to add reset_otp columns: %s", e)

    # 4. 'photo_url' column
    try:
        db.execute(text("SELECT photo_url FROM users LIMIT 1"))
    except Exception:
        db.rollback()
        try:
            db.execute(text("ALTER TABLE users ADD COLUMN photo_url VARCHAR(500)"))
            db.commit()
            logger.info("Column 'photo_url' added to 'users' table.")
        except Exception as e:
            db.rollback()
            logger.error("Failed to add column 'photo_url': %s", e)

    # 5. 'captured_at' column in patient_cancer_images
    try:
        db.execute(text("SELECT captured_at FROM patient_cancer_images LIMIT 1"))
    except Exception:
        db.rollback()
        try:
            db.execute(text("ALTER TABLE patient_cancer_images ADD COLUMN captured_at DATETIME"))
            db.commit()
            logger.info("Column 'captured_at' added to 'patient_cancer_images' table.")
        except Exception as e:
            db.rollback()
            logger.error("Failed to add column 'captured_at': %s", e)

    finally:
        db.close()
        
    yield


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="HELIX Oncology Intelligence Platform — REST API",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    lifespan=lifespan,
)

# ---------------------------------------------------------------------------
# CORS
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://onco-sphere-ai-powered-cancer-insti.vercel.app",
        "https://onco-sphere-ai-powered-cancer-institute-management-8fwl8k2t.vercel.app",
        settings.FRONTEND_URL,
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routers — all mounted under /api/v1
# ---------------------------------------------------------------------------
API_PREFIX = "/api/v1"

app.include_router(health_router,            prefix=API_PREFIX)
app.include_router(auth_router,              prefix=API_PREFIX)
app.include_router(dashboard_router,         prefix=API_PREFIX)
app.include_router(patients_router,          prefix=API_PREFIX)
app.include_router(upload_router,            prefix=API_PREFIX)
app.include_router(users_router,             prefix=API_PREFIX)
app.include_router(report_generator_router,  prefix=API_PREFIX)
app.include_router(researcher_router,        prefix=API_PREFIX)
app.include_router(visits_router,            prefix=API_PREFIX)

# Create and mount static directory for local file uploads fallback
static_path = os.path.join(os.path.dirname(__file__), "static")
os.makedirs(static_path, exist_ok=True)
app.mount("/static", StaticFiles(directory=static_path), name="static")


# ---------------------------------------------------------------------------
# Root
# ---------------------------------------------------------------------------
@app.get("/", include_in_schema=False)
def root():
    return {
        "message": "HELIX API",
        "docs": "/api/docs",
        "version": settings.APP_VERSION,
    }
