import os
import logging
import urllib.parse
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.config.settings import settings

logger = logging.getLogger("helix.database")

# Resolve backend root path to find ca.pem reliably across local and cloud environments
BASE_DIR = Path(__file__).resolve().parent.parent.parent
DEFAULT_CA_PATH = BASE_DIR / "ca.pem"


def get_sanitized_database_url(raw_url: str) -> str:
    """
    Sanitize and normalize the database URL:
    - Strips surrounding quotes or whitespace
    - Automatically maps mysql:// to mysql+pymysql://
    - Removes incompatible query parameters like ?ssl-mode=REQUIRED which cause PyMySQL TypeErrors
    """
    if not raw_url:
        return raw_url
    url = raw_url.strip().strip("\"'")
    if url.startswith("mysql://"):
        url = "mysql+pymysql://" + url[len("mysql://"):]
    
    parsed = urllib.parse.urlparse(url)
    if parsed.query:
        qs = urllib.parse.parse_qsl(parsed.query, keep_blank_values=True)
        # Filter out ssl-mode parameters with hyphens which PyMySQL does not accept directly in query string
        clean_qs = [(k, v) for k, v in qs if k not in ["ssl-mode", "ssl_mode"]]
        new_query = urllib.parse.urlencode(clean_qs)
        parsed = parsed._replace(query=new_query)
        url = urllib.parse.urlunparse(parsed)
    return url


SANITIZED_DATABASE_URL = get_sanitized_database_url(settings.DATABASE_URL)
is_sqlite = SANITIZED_DATABASE_URL.startswith("sqlite")
connect_args = {"check_same_thread": False} if is_sqlite else {}

if not is_sqlite:
    is_local = "localhost" in SANITIZED_DATABASE_URL or "127.0.0.1" in SANITIZED_DATABASE_URL
    if not is_local:
        # Remote cloud MySQL (e.g. Aiven) requires SSL
        ca_candidate = os.getenv("MYSQL_SSL_CA") or os.getenv("SSL_CA_PATH") or (str(DEFAULT_CA_PATH) if DEFAULT_CA_PATH.exists() else None)
        if ca_candidate and os.path.exists(ca_candidate):
            logger.info("Enabling SSL with CA certificate: %s", ca_candidate)
            connect_args["ssl"] = {
                "ca": ca_candidate,
                "check_hostname": True,
            }
        else:
            logger.info("Enabling default SSL mode for remote database connection.")
            connect_args["ssl"] = {
                "check_hostname": False,
            }

engine_kwargs = {
    "echo": settings.ENVIRONMENT == "development",
    "connect_args": connect_args,
}

if not is_sqlite:
    engine_kwargs["pool_pre_ping"] = True
    engine_kwargs["pool_recycle"] = 1800  # Recycle idle connections before cloud timeouts

engine = create_engine(SANITIZED_DATABASE_URL, **engine_kwargs)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """FastAPI dependency — yields a DB session and ensures cleanup."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_tables():
    """Create all tables defined under Base. Called on startup."""
    Base.metadata.create_all(bind=engine)
