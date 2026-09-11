from jose import jwt, JWTError
from datetime import datetime, timedelta
from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer

from app.config import Config

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")


def create_access_token(data: dict, expires_delta: timedelta = timedelta(minutes=15)):
    to_encode = data.copy()
    expire = datetime.utcnow() + expires_delta
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(
        to_encode, Config.JWT_SECRET_KEY, algorithm=Config.ALGORITHM
    )
    return encoded_jwt


def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(
            token, Config.JWT_SECRET_KEY, algorithms=[Config.ALGORITHM]
        )
        identity = payload.get("identity")
        role = payload.get("additional_claims", {}).get("role") or payload.get("role")
        email = payload.get("email")
        if not identity or not role:
            raise HTTPException(status_code=401, detail="Invalid token payload")
        return {"name": identity, "email": email, "role": role}
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
