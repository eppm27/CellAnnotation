import logging

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

from app.config import Config

logger = logging.getLogger(__name__)

Base = declarative_base()

# DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(
    Config.SQLALCHEMY_DATABASE_URI, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def init_db():
    logger.info("Initializing database...")
    Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
