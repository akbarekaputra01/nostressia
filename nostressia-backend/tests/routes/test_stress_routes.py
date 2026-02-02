from datetime import date

from app.models.user_model import User
from app.utils.hashing import hash_password
from app.utils.jwt_handler import create_access_token


def _create_user(db_session):
    user = User(
        name="Stress User",
        username="stress",
        email="stress@example.com",
        password=hash_password("Password123!"),
        gender="unspecified",
        user_dob=date(2000, 1, 1),
        is_verified=True,
        streak=0,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


def test_stress_log_flow(client, db_session):
    user = _create_user(db_session)
    token = create_access_token({"sub": user.email, "id": user.user_id, "username": user.username})

    payload = {
        "date": "2024-01-01",
        "stressLevel": 1,
        "gpa": 3.0,
        "extracurricularHourPerDay": 1.0,
        "physicalActivityHourPerDay": 1.0,
        "sleepHourPerDay": 7.0,
        "studyHourPerDay": 3.0,
        "socialHourPerDay": 2.0,
        "emoji": 1,
    }

    response = client.post(
        "/api/stress-levels/",
        headers={"Authorization": f"Bearer {token}"},
        json=payload,
    )
    assert response.status_code == 200

    response = client.get(
        "/api/stress-levels/my-logs",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200

    response = client.get(
        "/api/stress-levels/eligibility",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200

    response = client.post(
        "/api/stress-levels/restore",
        headers={"Authorization": f"Bearer {token}"},
        json={**payload, "date": "2024-01-02"},
    )
    assert response.status_code == 200
