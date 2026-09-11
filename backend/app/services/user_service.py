import secrets
import string
from typing import Optional

from fastapi import HTTPException
from app.models.user import User
from app.utils.db_utils import SessionLocal
import app.utils.user_utils as user_utils
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
import logging
from app.config import Config

logger = logging.getLogger(__name__)

VALID_ROLES = {"user", "admin"}


def normalize_email(email: str) -> str:
    if not isinstance(email, str) or not email.strip():
        raise HTTPException(status_code=400, detail="Email is required")
    normalized = email.strip().lower()
    if "@" not in normalized or normalized.startswith("@") or normalized.endswith("@"):
        raise HTTPException(status_code=400, detail="Invalid email format")
    return normalized


def validate_password_strength(password: str) -> None:
    if not isinstance(password, str) or not password:
        raise HTTPException(status_code=400, detail="Password is required")
    if password != password.strip():
        raise HTTPException(
            status_code=400,
            detail="Password cannot start or end with spaces",
        )
    if len(password) < 8:
        raise HTTPException(
            status_code=400,
            detail="Password must be at least 8 characters",
        )
    if not any(ch.isupper() for ch in password):
        raise HTTPException(
            status_code=400,
            detail="Password must include an uppercase letter",
        )
    if not any(ch.isdigit() for ch in password):
        raise HTTPException(status_code=400, detail="Password must include a number")
    if not any(not ch.isalnum() for ch in password):
        raise HTTPException(
            status_code=400,
            detail="Password must include a special character",
        )


def _ensure_valid_name(name: Optional[str], email: str) -> str:
    safe_name = (name or "").strip() or normalize_email(email).split("@")[0]
    if len(safe_name) < 2:
        raise HTTPException(
            status_code=400,
            detail="Name must be at least 2 characters",
        )
    return safe_name


def _generate_temporary_password(length: int = 14) -> str:
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
    while True:
        password = "".join(secrets.choice(alphabet) for _ in range(max(length, 8)))
        try:
            validate_password_strength(password)
            return password
        except HTTPException:
            continue


def register(
    email: str, password: str, role: str, db: Session, name: Optional[str] = None
):
    email = normalize_email(email)
    validate_password_strength(password)
    safe_name = _ensure_valid_name(name, email)
    role = (role or "").strip().lower()
    user = find_by_email(email, db)
    if user:
        raise HTTPException(status_code=409, detail="Email already registered")
    if role not in VALID_ROLES:
        raise HTTPException(status_code=400, detail="Invalid role")
    new_user = User(email=email, role=role, name=safe_name)
    new_user.set_password(password)
    db.add(new_user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        # Likely duplicate email constraint
        raise HTTPException(status_code=409, detail="Email already registered")
    db.refresh(new_user)
    return user_utils._scrub(new_user)


def update(
    uid: int,
    db: Session,
    role: Optional[str] = None,
    password: Optional[str] = None,
):
    user = db.get(User, uid)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if role is not None:
        normalized_role = role.strip().lower()
        if normalized_role not in VALID_ROLES:
            raise HTTPException(status_code=400, detail="Invalid role")
        user.role = normalized_role
    if password is not None:
        validate_password_strength(password)
        user.set_password(password)
    db.commit()
    db.refresh(user)
    return user_utils._scrub(user)


def delete(uid: int, db: Session):
    user = db.get(User, uid)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()
    return {"ok": True}


def list_users(db: Session):
    q = db.query(User).order_by(User.id.asc()).all()
    return [user_utils._scrub(u) for u in q]


def find_by_email(email: str, db: Session):
    return db.query(User).filter(User.email == normalize_email(email)).first()


def change_password(email: str, current_password: str, new_password: str, db: Session):
    email = normalize_email(email)
    if not current_password:
        raise HTTPException(status_code=400, detail="Current password is required")
    validate_password_strength(new_password)
    if current_password == new_password:
        raise HTTPException(
            status_code=400,
            detail="New password must be different from current password",
        )
    user = find_by_email(email, db)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not user.check_password(current_password):
        raise HTTPException(status_code=401, detail="Current password is incorrect")
    user.set_password(new_password)
    db.commit()
    return {"message": "Password updated successfully"}


def reset_password(
    uid: int,
    db: Session,
    new_password: Optional[str] = None,
    allow_autogenerated: bool = True,
):
    user = db.get(User, uid)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    temporary_password = None
    password = new_password
    if password is None:
        if not allow_autogenerated:
            raise HTTPException(status_code=400, detail="New password is required")
        temporary_password = _generate_temporary_password()
        password = temporary_password

    validate_password_strength(password)
    user.set_password(password)
    db.commit()
    db.refresh(user)

    result = {"user": user_utils._scrub(user)}
    if temporary_password:
        result["temporary_password"] = temporary_password
    return result


def create_superuser():
    """
    Create default admin user if not exists
    """
    if not Config.ENABLE_DEV_SEED:
        logger.info("Development seeding disabled; skipping demo user creation")
        return

    db = SessionLocal()

    if not db.query(User).filter_by(email="admin@local.com").first():
        logger.info("Creating default admin user: admin@local.com")
        admin1 = User(name="Super Administrator", email="admin@local.com", role="admin")
        admin1.set_password("admin")
        db.add(admin1)
        db.commit()

    if not db.query(User).filter_by(email="demo@example.com").first():
        logger.info("Creating default admin user: demo@example.com")
        admin2 = User(name="Demo Administrator", email="demo@example.com", role="admin")
        admin2.set_password("demo")
        db.add(admin2)
        db.commit()
    db.close()
