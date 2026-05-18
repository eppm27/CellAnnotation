import os
from pathlib import Path

APP_DATA_DIR = Path(os.getenv("ANN_APP_DATA_DIR", "./app_data")).resolve()
APP_DATA_DIR.mkdir(parents=True, exist_ok=True)


class Config:
    SECRET_KEY = os.getenv("ANN_SECRET_KEY", "dev")
    ALGORITHM = os.getenv("ANN_ALGORITHM", "HS256")
    JWT_SECRET_KEY = os.getenv("ANN_JWT_SECRET_KEY", "devjwt")
    SQLALCHEMY_DATABASE_URI = f"sqlite:///{APP_DATA_DIR/'db.sqlite3'}"
    LOGS_DIR = Path(os.getenv("ANN_LOGS_DIR", "./logs")).resolve()
