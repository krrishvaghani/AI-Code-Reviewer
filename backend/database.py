"""
SQLAlchemy database engine and session factory for SQLite.

Using SQLite so no external database service is required.
The db file (ai_code_reviewer.db) is created in the backend/ directory.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

SQLITE_URL = "sqlite:///./ai_code_reviewer.db"

engine = create_engine(
    SQLITE_URL,
    # Required for SQLite to work with FastAPI's async threads
    connect_args={"check_same_thread": False},
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


# ---------------------------------------------------------------------------
# FastAPI dependency — yields a DB session and closes it after the request
# ---------------------------------------------------------------------------

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
