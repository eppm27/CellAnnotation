import os
from pathlib import Path

APP_DATA_DIR = Path(os.getenv("ANN_APP_DATA_DIR", "./app_data")).resolve()
APP_DATA_DIR.mkdir(parents=True, exist_ok=True)

APP_ENV = os.getenv("ANN_ENV", "development").strip().lower()
ENABLE_DEV_SEED = os.getenv("ANN_ENABLE_DEV_SEED", "false").strip().lower() in {
    "1",
    "true",
    "yes",
    "on",
}


def _require_secret(name: str, default_value: str) -> str:
    value = os.getenv(name)
    if APP_ENV == "production" and (not value or value == default_value):
        raise RuntimeError(f"{name} must be set in production")
    return value or default_value


class Config:
    APP_ENV = APP_ENV
    ENABLE_DEV_SEED = ENABLE_DEV_SEED
    ALGORITHM = os.getenv("ANN_ALGORITHM", "HS256")
    SECRET_KEY = _require_secret("ANN_SECRET_KEY", "dev")
    JWT_SECRET_KEY = _require_secret("ANN_JWT_SECRET_KEY", "devjwt")
    SQLALCHEMY_DATABASE_URI = f"sqlite:///{APP_DATA_DIR/'db.sqlite3'}"
    LOGS_DIR = Path(os.getenv("ANN_LOGS_DIR", "./logs")).resolve()
