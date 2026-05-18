def test_list_users_initial(client):
    res = client.get("/api/admin/users")
    assert res.status_code == 200
    users = res.json()
    assert isinstance(users, list)
    assert any(u["email"] == "admin@local.com" for u in users)


def test_create_user_and_duplicate_and_validation(client):
    """TC-013: Verify admin user creation via System Settings"""
    # missing email
    res = client.post("/api/admin/users", json={"email": "", "role": "user"})
    assert res.status_code == 400
    # missing password
    res = client.post(
        "/api/admin/users", json={"email": "ellis@local.com", "role": "user"}
    )
    assert res.status_code == 400
    # invalid role (handled in service)
    res = client.post(
        "/api/admin/users",
        json={"email": "ellis@local.com", "role": "badrole", "password": "pw"},
    )
    assert res.status_code == 400

    # create valid user
    res = client.post(
        "/api/admin/users",
        json={"email": "ellis@local.com", "role": "user", "password": "pw"},
    )
    assert res.status_code == 200, res.text
    user = res.json()
    assert user["email"] == "ellis@local.com"
    assert user["role"] == "user"
    uid = user["id"]

    # duplicate email
    res = client.post(
        "/api/admin/users",
        json={"email": "ellis@local.com", "role": "user", "password": "pw"},
    )
    assert res.status_code == 409

    # list should include created user
    res = client.get("/api/admin/users")
    assert res.status_code == 200
    users = res.json()
    assert any(u["id"] == uid for u in users)


def test_update_user_role_and_password_and_errors(client):
    # create a user
    res = client.post(
        "/api/admin/users",
        json={"email": "edit@local.com", "role": "user", "password": "pw1"},
    )
    assert res.status_code == 200
    uid = res.json()["id"]

    # update invalid role
    res = client.patch(
        f"/api/admin/users/{uid}",
        json={"role": "notarole"},
    )
    assert res.status_code == 400

    # update role to admin and password
    res = client.patch(
        f"/api/admin/users/{uid}",
        json={"role": "admin", "password": "pw2"},
    )
    assert res.status_code == 200
    updated = res.json()
    assert updated["role"] == "admin"

    # update non-existent user
    res = client.patch("/api/admin/users/99999", json={"role": "user"})
    assert res.status_code == 404

    # delete the user
    res = client.delete(f"/api/admin/users/{uid}")
    assert res.status_code == 200
    assert res.json()["ok"] is True

    # delete again -> not found
    res = client.delete(f"/api/admin/users/{uid}")
    assert res.status_code == 404
