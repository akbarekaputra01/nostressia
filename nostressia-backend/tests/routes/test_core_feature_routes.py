from datetime import date

from app.models.diary_model import Diary
from app.models.motivation_model import Motivation
from app.models.stress_log_model import StressLevel
from app.models.tips_model import Tips, TipsCategory
from app.models.user_model import User
from app.schemas.stress_schema import EligibilityResponse, GlobalForecastPayload, GlobalForecastResult
from app.utils.hashing import hash_password
from app.utils.jwt_handler import create_access_token


def _create_user(db_session):
    user = User(
        name="Core Feature User",
        username="coreuser",
        email="core@example.com",
        password=hash_password("Password123!"),
        gender="unspecified",
        user_dob=date(2000, 1, 1),
        is_verified=True,
        streak=5,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


def _auth_header(user):
    token = create_access_token(
        {"sub": user.email, "id": user.user_id, "username": user.username}
    )
    return {"Authorization": f"Bearer {token}"}


def test_dashboard_stress_prediction_and_forecast(client, db_session, monkeypatch):
    user = _create_user(db_session)

    monkeypatch.setattr(
        "app.routes.stress_insight_route.ml_service.predict_stress", lambda *_: "Low"
    )

    response = client.post(
        "/api/stress/current",
        json={
            "studyHours": 4,
            "extracurricularHours": 1,
            "sleepHours": 7,
            "socialHours": 2,
            "physicalHours": 1,
            "gpa": 3.5,
        },
    )

    assert response.status_code == 200
    assert response.json()["data"]["result"] == "Low"

    eligibility = EligibilityResponse(
        user_id=user.user_id,
        eligible=True,
        streak=5,
        required_streak=7,
        restore_used=1,
        restore_remaining=2,
        restore_limit=3,
        missing=0,
        note="Eligible",
    )

    monkeypatch.setattr(
        "app.routes.stress_insight_route.stress_service.check_global_eligibility",
        lambda *_: eligibility,
    )

    forecast_payload = GlobalForecastPayload(
        forecast=GlobalForecastResult(
            user_id=user.user_id,
            forecast_date="2024-01-06",
            probability=0.2,
            chance_percent=20.0,
            threshold=0.5,
            prediction_binary=0,
            prediction_label="Low",
            model_type="global_markov",
        ),
        eligibility=eligibility,
    )

    monkeypatch.setattr(
        "app.routes.stress_insight_route.forecast_service.get_global_forecast_for_user",
        lambda *_: forecast_payload,
    )

    forecast_response = client.get(
        "/api/stress/forecast",
        headers=_auth_header(user),
    )

    assert forecast_response.status_code == 200
    assert forecast_response.json()["data"]["forecast"]["predictionLabel"] == "Low"


def test_dashboard_stress_level_flow(client, db_session, monkeypatch):
    user = _create_user(db_session)
    headers = _auth_header(user)

    create_response = client.post(
        "/api/stress-levels/",
        json={
            "date": date.today().isoformat(),
            "stressLevel": 2,
            "gpa": 3.4,
            "sleepHourPerDay": 7,
            "studyHourPerDay": 4,
            "socialHourPerDay": 2,
            "physicalActivityHourPerDay": 1,
            "extracurricularHourPerDay": 1,
            "emoji": 4,
        },
        headers=headers,
    )

    assert create_response.status_code == 200
    assert create_response.json()["data"]["stressLevel"] == 2

    restore_response = client.post(
        "/api/stress-levels/restore",
        json={
            "date": date.today().isoformat(),
            "stressLevel": 1,
            "gpa": 3.5,
            "sleepHourPerDay": 8,
            "studyHourPerDay": 3,
            "socialHourPerDay": 2,
            "physicalActivityHourPerDay": 1,
            "extracurricularHourPerDay": 1,
            "emoji": 3,
        },
        headers=headers,
    )

    assert restore_response.status_code == 200
    assert restore_response.json()["data"]["isRestored"] is True

    logs_response = client.get("/api/stress-levels/my-logs", headers=headers)
    assert logs_response.status_code == 200
    assert len(logs_response.json()["data"]) == 2

    eligibility = EligibilityResponse(
        user_id=user.user_id,
        eligible=True,
        streak=5,
        required_streak=7,
        restore_used=1,
        restore_remaining=2,
        restore_limit=3,
        missing=0,
        note="Eligible",
    )

    monkeypatch.setattr(
        "app.routes.stress_route.stress_service.check_global_eligibility",
        lambda *_: eligibility,
    )

    eligibility_response = client.get("/api/stress-levels/eligibility", headers=headers)
    assert eligibility_response.status_code == 200
    assert eligibility_response.json()["data"]["restoreRemaining"] == 2


def test_analytics_feature_summary_and_logs(client, db_session):
    user = _create_user(db_session)
    db_session.add(
        StressLevel(
            user_id=user.user_id,
            date=date.today(),
            stress_level=2,
            emoji=0,
        )
    )
    db_session.add(
        Diary(
            title="Log",
            note="Feeling ok",
            date=date.today(),
            emoji="😊",
            font="sans-serif",
            user_id=user.user_id,
        )
    )
    db_session.commit()

    headers = _auth_header(user)
    logs_response = client.get("/api/stress-levels/my-logs", headers=headers)

    assert logs_response.status_code == 200
    assert logs_response.json()["data"][0]["stressLevel"] == 2

    summary_response = client.get("/api/analytics/summary", headers=headers)

    assert summary_response.status_code == 200
    assert summary_response.json()["data"]["stressLogsCount"] == 1
    assert summary_response.json()["data"]["diaryCount"] == 1


def test_motivation_feature_listing_and_bookmarks(client, db_session):
    user = _create_user(db_session)
    motivation = Motivation(
        quote="Keep going!",
        uploader_id=1,
        author_name="Team",
    )
    db_session.add(motivation)
    db_session.commit()
    db_session.refresh(motivation)

    response = client.get("/api/motivations/")

    assert response.status_code == 200
    assert response.json()["data"][0]["quote"] == "Keep going!"

    headers = _auth_header(user)
    bookmark_response = client.post(
        f"/api/bookmarks/{motivation.motivation_id}", headers=headers
    )
    assert bookmark_response.status_code == 201

    bookmarks_response = client.get("/api/bookmarks/me", headers=headers)
    assert bookmarks_response.status_code == 200
    assert bookmarks_response.json()["data"][0]["motivationId"] == motivation.motivation_id

    delete_response = client.delete(
        f"/api/bookmarks/{motivation.motivation_id}", headers=headers
    )
    assert delete_response.status_code == 200


def test_tips_feature_listing(client, db_session):
    category = TipsCategory(category_name="Focus")
    db_session.add(category)
    db_session.commit()
    db_session.refresh(category)

    db_session.add(
        Tips(
            detail="Try a 25-minute focus sprint.",
            tip_category_id=category.tip_category_id,
            uploader_id=1,
        )
    )
    db_session.commit()

    categories_response = client.get("/api/tips/categories")
    assert categories_response.status_code == 200
    assert categories_response.json()["data"][0]["categoryName"] == "Focus"

    tips_response = client.get("/api/tips/")
    assert tips_response.status_code == 200
    assert tips_response.json()["data"][0]["detail"].startswith("Try a 25-minute")

    category_response = client.get(f"/api/tips/by-category/{category.tip_category_id}")
    assert category_response.status_code == 200
    assert category_response.json()["data"][0]["detail"].startswith("Try a 25-minute")


def test_diary_feature_flow(client, db_session):
    user = _create_user(db_session)
    headers = _auth_header(user)

    create_response = client.post(
        "/api/diary/",
        json={
            "title": "Day One",
            "note": "Feeling good",
            "date": date.today().isoformat(),
            "emoji": "😊",
            "font": "sans-serif",
        },
        headers=headers,
    )

    assert create_response.status_code == 200
    diary_id = create_response.json()["data"]["diaryId"]

    list_response = client.get("/api/diary/", headers=headers)

    assert list_response.status_code == 200
    assert list_response.json()["data"][0]["title"] == "Day One"

    detail_response = client.get(f"/api/diary/{diary_id}", headers=headers)
    assert detail_response.status_code == 200
    assert detail_response.json()["data"]["note"] == "Feeling good"

    update_response = client.put(
        f"/api/diary/{diary_id}",
        json={"note": "Updated note"},
        headers=headers,
    )

    assert update_response.status_code == 200
    assert update_response.json()["data"]["note"] == "Updated note"
