from app.models.user import User


def _scrub(u: User):
    return {
        "id": u.id,
        "name": u.name,
        "email": u.email,
        "role": u.role,
        "created_at": u.created_at.isoformat(),
    }
