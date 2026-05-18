from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime
from passlib.context import CryptContext

from app.utils.db_utils import Base

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(320), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(10), default="user")
    created_at = Column(DateTime, default=datetime.utcnow)

    def set_password(self, pw):
        self.password_hash = pwd_context.hash(pw)

    def check_password(self, pw):
        return pwd_context.verify(pw, self.password_hash)
