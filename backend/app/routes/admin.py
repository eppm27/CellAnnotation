from typing import Optional

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

import app.utils.db_utils as db_utils
import app.services.user_service as user_service

# from auth import require_role

router = APIRouter(prefix="/api/admin")


# list users
@router.get("/users")
# @require_role("admin")
def list_users(db: Session = Depends(db_utils.get_db)):
    return user_service.list_users(db)


class AdminUserRequest(BaseModel):
    email: str
    role: str
    password: Optional[str] = None
    name: Optional[str] = None


# admin role update in admin page (partial update)
class UpdateUserRequest(BaseModel):
    role: Optional[str] = None
    password: Optional[str] = None


# create users
@router.post("/users")
# @require_role("admin")
def create_user(
    admin_user_req: AdminUserRequest, db: Session = Depends(db_utils.get_db)
):
    email = admin_user_req.email.strip().lower()
    role = admin_user_req.role.strip().lower()
    password = admin_user_req.password
    name = (admin_user_req.name or email.split("@")[0] or "User").strip()
    if not email:
        raise HTTPException(status_code=400, detail="Email is required")
    if not password:
        raise HTTPException(status_code=400, detail="Password is required")
    return user_service.register(email, password, role, db, name=name)


# update user roles
@router.patch("/users/{uid}")
# @require_role("admin")
def update_user(
    uid: int, update_req: UpdateUserRequest, db: Session = Depends(db_utils.get_db)
):
    return user_service.update(uid, db, update_req.role, update_req.password)


# delete users
@router.delete("/users/{uid}")
# @require_role("admin")
def delete_user(uid: int, db: Session = Depends(db_utils.get_db)):
    return user_service.delete(uid, db)
