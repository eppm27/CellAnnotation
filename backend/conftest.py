import os
import sys
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

# Ensure the backend package root is importable when running tests
BACKEND_ROOT = Path(__file__).resolve().parent
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))


@pytest.fixture()
def client(tmp_path):
    """FastAPI TestClient with isolated app data and CWD.

    - Sets APP_DATA_DIR to a temp directory so the sqlite DB is isolated.
    - chdir into tmp so file routes write into tmp/app_data/...
    """
    prev_cwd = os.getcwd()
    os.environ["APP_DATA_DIR"] = str(tmp_path / "data")
    os.chdir(tmp_path)
    from app.main import app  # import after env + cwd set

    try:
        with TestClient(app) as c:
            yield c
    finally:
        os.chdir(prev_cwd)


@pytest.fixture()
def auth_token(client):
    """Get an authentication token for the default admin user.
    
    Returns:
        str: Bearer token for admin@local.com
    """
    res = client.post(
        "/api/auth/login",
        json={"email": "admin@local.com", "password": "admin"}
    )
    assert res.status_code == 200, "Failed to get auth token"
    return res.json()


@pytest.fixture()
def auth_headers(auth_token):
    """Get authorization headers with bearer token.
    
    Returns:
        dict: Headers dictionary with Authorization bearer token
    """
    return {"Authorization": f"Bearer {auth_token}"}


@pytest.fixture()
def test_user(client):
    """Create a test user and return credentials.
    
    Returns:
        dict: User credentials with email, password, and token
    """
    email = "testuser@example.com"
    password = "TestPass123!"
    res = client.post(
        "/api/auth/register",
        json={"name": "Test User", "email": email, "password": password}
    )
    assert res.status_code == 200, "Failed to create test user"
    body = res.json()
    return {
        "email": email,
        "password": password,
        "token": body["token"],
        "user": body["user"]
    }


@pytest.fixture()
def db_session(tmp_path):
    """Get a database session for direct database operations in tests.
    
    Returns:
        Session: SQLAlchemy database session
    """
    prev_cwd = os.getcwd()
    os.environ["APP_DATA_DIR"] = str(tmp_path / "data")
    os.chdir(tmp_path)
    from app.utils.db_utils import SessionLocal, init_db
    
    try:
        init_db()
        db = SessionLocal()
        yield db
        db.close()
    finally:
        os.chdir(prev_cwd)
