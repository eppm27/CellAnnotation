"""Auth route tests."""


def test_login_success(client):
    """TC-011: Users can log in and log out - Login verification"""
    # default admin created in startup: admin@local.com / admin
    res = client.post(
        "/api/auth/login",
        json={"email": " admin@local.com ", "password": "admin"},
    )
    assert res.status_code == 200, res.text
    token = res.json()
    assert isinstance(token, str) and len(token) > 10


def test_login_invalid_password(client):
    """TC-011: Users can log in and log out - Invalid credentials rejection"""
    res = client.post(
        "/api/auth/login",
        json={"email": "admin@local.com", "password": "wrong"},
    )
    assert res.status_code == 401
    body = res.json()
    assert body.get("detail") == "Invalid credentials"


def test_me_requires_auth(client):
    res = client.get("/api/auth/me")
    assert res.status_code == 401


def test_me_with_token(client):
    """TC-011: Users can log in and log out - JWT token authentication"""
    # login to get token
    login = client.post(
        "/api/auth/login",
        json={"email": "admin@local.com", "password": "admin"},
    )
    assert login.status_code == 200, login.text
    token = login.json()

    # call /me with bearer token
    res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200, res.text
    me = res.json()
    assert me["email"] == "admin@local.com"
    assert me["role"] == "admin"
    assert "name" in me and len(me["name"]) > 0


def test_me_invalid_token_payload(client):
    """TC-011: Users can log in and log out - Invalid token payload rejection"""
    # Create a token missing required claims (role)
    from app.utils.auth_utils import create_access_token  # noqa: WPS433

    bad = create_access_token({"identity": "Someone", "email": "a@b.c"})
    res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {bad}"})
    assert res.status_code == 401


def test_me_jwt_error_invalid_token_string(client):
    # Triggers JWTError exception branch in get_current_user
    res = client.get("/api/auth/me", headers={"Authorization": "Bearer not-a-token"})
    assert res.status_code == 401


def test_register_success(client):
    """TC-009: Verify user registration via Sign Up"""
    res = client.post(
        "/api/auth/register",
        json={
            "name": "New User",
            "email": "new@example.com",
            "password": "StrongPass1!",
        },
    )
    assert res.status_code == 200, res.text
    body = res.json()
    assert body["user"]["email"] == "new@example.com"
    assert body["user"]["role"] == "user"
    token = body["token"]
    me = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 200
    assert me.json()["email"] == "new@example.com"


def test_register_requires_email_and_password(client):
    """TC-009: Verify user registration via Sign Up - Required fields validation"""
    res = client.post(
        "/api/auth/register",
        json={"name": "", "email": "  ", "password": ""},
    )
    assert res.status_code == 400
    assert res.json()["detail"] == "Email and password are required"


def test_change_password_flow(client):
    email = "changeme@example.com"
    original_password = "OrigPass1!"
    new_password = "NewPass2@"

    register = client.post(
        "/api/auth/register",
        json={"name": "Change Me", "email": email, "password": original_password},
    )
    assert register.status_code == 200, register.text
    token = register.json()["token"]

    # wrong current password should fail
    res = client.post(
        "/api/auth/change-password",
        headers={"Authorization": f"Bearer {token}"},
        json={"current_password": "WrongPass1!", "new_password": new_password},
    )
    assert res.status_code == 401
    assert res.json()["detail"] == "Current password is incorrect"

    # change password successfully
    res = client.post(
        "/api/auth/change-password",
        headers={"Authorization": f"Bearer {token}"},
        json={"current_password": original_password, "new_password": new_password},
    )
    assert res.status_code == 200, res.text
    assert res.json()["message"] == "Password updated successfully"

    # old password no longer works
    res = client.post(
        "/api/auth/login", json={"email": email, "password": original_password}
    )
    assert res.status_code == 401

    # new password works
    res = client.post(
        "/api/auth/login", json={"email": email, "password": new_password}
    )
    assert res.status_code == 200, res.text


def test_login_missing_email(client):
    """Test login with empty/whitespace email"""
    res = client.post(
        "/api/auth/login",
        json={"email": "   ", "password": "somepass"},
    )
    assert res.status_code == 400
    assert "Email is required" in res.json()["detail"]


def test_login_missing_password(client):
    """Test login with missing password"""
    res = client.post(
        "/api/auth/login",
        json={"email": "test@example.com", "password": ""},
    )
    assert res.status_code == 400
    assert "Password is required" in res.json()["detail"]


def test_register_name_too_short(client):
    """TC-010: Verify password validation - Name length validation"""
    res = client.post(
        "/api/auth/register",
        json={"name": "A", "email": "test@example.com", "password": "Pass123!"},
    )
    assert res.status_code == 400
    assert "Name must be at least 2 characters" in res.json()["detail"]


def test_register_with_whitespace_email(client):
    """Test that register properly handles emails with whitespace"""
    res = client.post(
        "/api/auth/register",
        json={"name": "Test User", "email": "  test@example.com  ", "password": "Pass123!"},
    )
    assert res.status_code == 200
    body = res.json()
    # Email should be normalized (stripped and lowercased)
    assert body["user"]["email"] == "test@example.com"
