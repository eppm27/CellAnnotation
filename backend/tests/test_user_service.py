import os
import pytest
from typing import cast


def get_db_session(tmp_path):
    os.environ["APP_DATA_DIR"] = str(tmp_path)
    from app.utils.db_utils import SessionLocal, init_db  # noqa: WPS433

    init_db()
    return SessionLocal()


def test_register_invalid_role(tmp_path):
    from app.services import user_service  # noqa: WPS433

    db = get_db_session(tmp_path)
    with pytest.raises(Exception) as ei:
        user_service.register("x@x.com", "pw", "bad", db, name="X")
    assert getattr(ei.value, "status_code", None) == 400


def test_update_delete_not_found(tmp_path):
    from app.services import user_service  # noqa: WPS433

    db = get_db_session(tmp_path)
    with pytest.raises(Exception) as ei:
        user_service.update(999999, db, role="user")
    assert getattr(ei.value, "status_code", None) == 404

    with pytest.raises(Exception) as ei2:
        user_service.delete(999999, db)
    assert getattr(ei2.value, "status_code", None) == 404


def test_register_integrity_error_rolls_back_and_raises(tmp_path, monkeypatch):
    from app.services import user_service  # noqa: WPS433
    from sqlalchemy.exc import IntegrityError

    db = get_db_session(tmp_path)

    # Ensure pre-check passes (no user exists with the email)
    assert user_service.find_by_email("dup@local.com", db) is None

    # Monkeypatch commit to simulate DB unique constraint violation
    original_commit = db.commit

    def boom():
        raise IntegrityError("stmt", None, Exception("dup"))

    db.commit = boom  # type: ignore
    try:
        with pytest.raises(Exception) as ei:
            user_service.register("dup@local.com", "pw", "user", db, name="Dup")
        assert getattr(ei.value, "status_code", None) == 409
    finally:
        db.commit = original_commit  # restore

def test_normalize_email_none(tmp_path):
    """Test normalize_email with None raises error"""
    from app.services import user_service  # noqa: WPS433

    with pytest.raises(Exception) as ei:
        user_service.normalize_email(cast(str, None))
    assert getattr(ei.value, "status_code", None) == 400
    assert "Email is required" in str(getattr(ei.value, "detail", ei.value))
    assert "Email is required" in str(getattr(ei.value, "detail", ei.value))


def test_normalize_email_empty_string(tmp_path):
    """Test normalize_email with empty/whitespace string raises error"""
    from app.services import user_service  # noqa: WPS433

    with pytest.raises(Exception) as ei:
        user_service.normalize_email("   ")
    assert getattr(ei.value, "status_code", None) == 400
    assert "Email is required" in str(getattr(ei.value, "detail", ei.value))


def test_normalize_email_invalid_format(tmp_path):
    """Test normalize_email with invalid email format"""
    from app.services import user_service  # noqa: WPS433

    with pytest.raises(Exception) as ei:
        user_service.normalize_email("notanemail")
    assert getattr(ei.value, "status_code", None) == 400
    assert "Invalid email format" in str(getattr(ei.value, "detail", ei.value))


def test_validate_password_strength_none(tmp_path):
    """Test password validation with None"""
    from app.services import user_service  # noqa: WPS433

    with pytest.raises(Exception) as ei:
        user_service.validate_password_strength(None)
    assert getattr(ei.value, "status_code", None) == 400
    assert "Password is required" in str(getattr(ei.value, "detail", ei.value))


def test_validate_password_strength_not_string(tmp_path):
    """Test password validation with non-string type"""
    from app.services import user_service  # noqa: WPS433

    with pytest.raises(Exception) as ei:
        user_service.validate_password_strength(cast(str, 123))
    assert getattr(ei.value, "status_code", None) == 400
    assert "Password is required" in str(getattr(ei.value, "detail", ei.value))


def test_validate_password_strength_with_spaces(tmp_path):
    """Test password validation with leading/trailing spaces"""
    from app.services import user_service  # noqa: WPS433

    with pytest.raises(Exception) as ei:
        user_service.validate_password_strength(" Pass123! ")
    assert getattr(ei.value, "status_code", None) == 400
    assert "cannot start or end with spaces" in str(getattr(ei.value, "detail", ei.value))


def test_validate_password_strength_too_short(tmp_path):
    """Test password validation with password too short"""
    from app.services import user_service  # noqa: WPS433

    with pytest.raises(Exception) as ei:
        user_service.validate_password_strength("Pa1!")
    assert getattr(ei.value, "status_code", None) == 400
    assert "at least 8 characters" in str(getattr(ei.value, "detail", ei.value))


def test_validate_password_strength_no_uppercase(tmp_path):
    """Test password validation without uppercase letter"""
    from app.services import user_service  # noqa: WPS433

    with pytest.raises(Exception) as ei:
        user_service.validate_password_strength("pass123!")
    assert getattr(ei.value, "status_code", None) == 400
    assert "uppercase letter" in str(getattr(ei.value, "detail", ei.value))


def test_validate_password_strength_no_number(tmp_path):
    """Test password validation without number"""
    from app.services import user_service  # noqa: WPS433

    with pytest.raises(Exception) as ei:
        user_service.validate_password_strength("Password!")
    assert getattr(ei.value, "status_code", None) == 400
    assert "number" in str(getattr(ei.value, "detail", ei.value))


def test_validate_password_strength_no_special_char(tmp_path):
    """Test password validation without special character"""
    from app.services import user_service  # noqa: WPS433

    with pytest.raises(Exception) as ei:
        user_service.validate_password_strength("Password123")
    assert getattr(ei.value, "status_code", None) == 400
    assert "special character" in str(getattr(ei.value, "detail", ei.value))


def test_ensure_valid_name_too_short(tmp_path):
    """Test name validation with name too short"""
    from app.services import user_service  # noqa: WPS433

    with pytest.raises(Exception) as ei:
        user_service._ensure_valid_name("A", "test@example.com")
    assert getattr(ei.value, "status_code", None) == 400
    assert "at least 2 characters" in str(getattr(ei.value, "detail", ei.value))


def test_ensure_valid_name_uses_fallback(tmp_path):
    """Test that empty name uses email prefix as fallback"""
    from app.services import user_service  # noqa: WPS433

    name = user_service._ensure_valid_name("", "test@example.com")
    assert name == "test"


def test_update_with_empty_role_string(tmp_path):
    """Test update with empty role string"""
    from app.services import user_service  # noqa: WPS433

    db = get_db_session(tmp_path)
    # First create a user
    user = user_service.register("test0@example.com", "Pass123!", "user", db, name="Test")
    
    with pytest.raises(Exception) as ei:
        user_service.update(user["id"], db, role="   ")
    assert getattr(ei.value, "status_code", None) == 400
    assert "Invalid role" in str(getattr(ei.value, "detail", ei.value))


def test_change_password_missing_current_password(tmp_path):
    """Test change password with missing current password"""
    from app.services import user_service  # noqa: WPS433

    db = get_db_session(tmp_path)
    user_service.register("test1@example.com", "Pass123!", "user", db, name="Test")
    
    with pytest.raises(Exception) as ei:
        user_service.change_password("test1@example.com", "", "NewPass123!", db)
    assert getattr(ei.value, "status_code", None) == 400
    assert "Current password is required" in str(getattr(ei.value, "detail", ei.value))


def test_change_password_same_as_current(tmp_path):
    """Test change password with new password same as current"""
    from app.services import user_service  # noqa: WPS433

    db = get_db_session(tmp_path)
    password = "Pass123!"
    user_service.register("test2@example.com", password, "user", db, name="Test")
    
    with pytest.raises(Exception) as ei:
        user_service.change_password("test2@example.com", password, password, db)
    assert getattr(ei.value, "status_code", None) == 400
    assert "must be different" in str(getattr(ei.value, "detail", ei.value))


def test_change_password_user_not_found(tmp_path):
    """Test change password for non-existent user"""
    from app.services import user_service  # noqa: WPS433

    db = get_db_session(tmp_path)
    
    with pytest.raises(Exception) as ei:
        user_service.change_password("nonexistent@example.com", "Pass123!", "NewPass123!", db)
    assert getattr(ei.value, "status_code", None) == 404
    assert "User not found" in str(getattr(ei.value, "detail", ei.value))


def test_reset_password_user_not_found(tmp_path):
    """Test reset password for non-existent user"""
    from app.services import user_service  # noqa: WPS433

    db = get_db_session(tmp_path)
    
    with pytest.raises(Exception) as ei:
        user_service.reset_password(999999, db)
    assert getattr(ei.value, "status_code", None) == 404
    assert "User not found" in str(getattr(ei.value, "detail", ei.value))


def test_reset_password_without_autogenerated(tmp_path):
    """Test reset password requires password when autogeneration disabled"""
    from app.services import user_service  # noqa: WPS433

    db = get_db_session(tmp_path)
    user = user_service.register("test3@example.com", "Pass123!", "user", db, name="Test")
    
    with pytest.raises(Exception) as ei:
        user_service.reset_password(user["id"], db, new_password=None, allow_autogenerated=False)
    assert getattr(ei.value, "status_code", None) == 400
    assert "New password is required" in str(getattr(ei.value, "detail", ei.value))


def test_reset_password_with_explicit_password(tmp_path):
    """Test reset password with explicit password provided"""
    from app.services import user_service  # noqa: WPS433

    db = get_db_session(tmp_path)
    user = user_service.register("test4@example.com", "Pass123!", "user", db, name="Test")
    
    result = user_service.reset_password(user["id"], db, new_password="NewPass456!")
    assert result["user"]["id"] == user["id"]
    assert "temporary_password" not in result  # Should not include temp password when explicit password used


def test_generate_temporary_password(tmp_path):
    """Test that generated temporary passwords meet strength requirements"""
    from app.services import user_service  # noqa: WPS433

    temp_pass = user_service._generate_temporary_password(12)
    assert len(temp_pass) == 12
    # Should not raise an exception
    user_service.validate_password_strength(temp_pass)
