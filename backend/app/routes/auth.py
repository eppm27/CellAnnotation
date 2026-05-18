from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.services import user_service
import app.utils.db_utils as db_utils
from app.utils.auth_utils import create_access_token
from app.utils.auth_utils import get_current_user

router = APIRouter(prefix="/api/auth")


class LoginRequest(BaseModel):
    email: str
    password: str


@router.post("/login")
def login(login_req: LoginRequest, db: Session = Depends(db_utils.get_db)):
    email, pw = login_req.email.strip().lower(), login_req.password
    user = user_service.find_by_email(email, db)
    if not user or not user.check_password(pw or ""):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token(
        data={"identity": str(user.name), "role": user.role, "email": user.email}
    )
    return token


@router.get("/me")
def get_me(current_user=Depends(get_current_user)):
    return current_user


class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str


@router.post("/register")
def register(req: RegisterRequest, db: Session = Depends(db_utils.get_db)):
    email = req.email.strip().lower()
    name = req.name.strip()
    if not email or not req.password:
        raise HTTPException(status_code=400, detail="Email and password are required")
    # All self-registered users get the 'user' role
    user = user_service.register(email, req.password, "user", db, name=name)
    # Optionally return a token to auto-login
    token = create_access_token(
        data={"identity": user["name"], "role": user["role"], "email": user["email"]}
    )
    return {"user": user, "token": token}
