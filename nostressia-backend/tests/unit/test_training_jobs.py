from datetime import date, datetime, timedelta, timezone

from app.models.model_registry_model import ModelRegistry
from app.models.training_job_model import TrainingJob
from app.models.user_model import User
from app.schemas.stress_schema import EligibilityResponse, StressLevelCreate
from app.services import forecast_service, personalized_forecast_service, stress_service
from app.services.model_registry_service import model_registry_service
from app.services.training_job_service import enqueue_global_training_if_due
from app.utils.hashing import hash_password


def _create_user(db_session) -> User:
    user = User(
        name="Training User",
        username="traininguser",
        email="training@example.com",
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


def _build_log(entry_date: date) -> StressLevelCreate:
    return StressLevelCreate(
        date=entry_date,
        stress_level=2,
        gpa=3.4,
        extracurricular_hour_per_day=1,
        physical_activity_hour_per_day=1,
        sleep_hour_per_day=7,
        study_hour_per_day=2,
        social_hour_per_day=1,
        emoji=1,
    )


def test_personalized_job_enqueued_on_milestone(db_session, monkeypatch):
    user = _create_user(db_session)

    monkeypatch.setattr(stress_service, "get_user_current_streak", lambda *_: 60)
    stress_service.create_stress_log(db_session, _build_log(date(2024, 1, 1)), user.user_id)

    job_count = db_session.query(TrainingJob).count()
    assert job_count == 1


def test_personalized_job_not_duplicated_for_same_milestone(db_session, monkeypatch):
    user = _create_user(db_session)

    monkeypatch.setattr(stress_service, "get_user_current_streak", lambda *_: 60)
    stress_service.create_stress_log(db_session, _build_log(date(2024, 1, 1)), user.user_id)
    stress_service.create_stress_log(db_session, _build_log(date(2024, 1, 2)), user.user_id)

    job_count = db_session.query(TrainingJob).count()
    assert job_count == 1


def test_personalized_milestone_resets_after_streak_reset(db_session, monkeypatch):
    user = _create_user(db_session)
    user.last_personalized_trained_milestone = 60
    db_session.commit()

    monkeypatch.setattr(stress_service, "get_user_current_streak", lambda *_: 2)
    stress_service.create_stress_log(db_session, _build_log(date(2024, 1, 1)), user.user_id)
    db_session.refresh(user)

    assert user.last_personalized_trained_milestone == 0


def test_global_training_job_enqueued_after_interval(db_session):
    now = datetime.now(timezone.utc)
    model = ModelRegistry(
        model_type="global",
        artifact_url="https://example.com/global.joblib",
        trained_at=now - timedelta(days=61),
        is_active=True,
    )
    db_session.add(model)
    db_session.commit()

    job = enqueue_global_training_if_due(db_session, now=now)
    db_session.commit()

    assert job is not None
    assert db_session.query(TrainingJob).count() == 1


def test_global_training_job_not_enqueued_before_interval(db_session):
    now = datetime.now(timezone.utc)
    model = ModelRegistry(
        model_type="global",
        artifact_url="https://example.com/global.joblib",
        trained_at=now - timedelta(days=10),
        is_active=True,
    )
    db_session.add(model)
    db_session.commit()

    job = enqueue_global_training_if_due(db_session, now=now)
    db_session.commit()

    assert job is None
    assert db_session.query(TrainingJob).count() == 0


def test_inference_uses_personalized_model_when_available(db_session, monkeypatch):
    user = _create_user(db_session)
    global_model = ModelRegistry(
        model_type="global",
        artifact_url="https://example.com/global.joblib",
        trained_at=datetime.now(timezone.utc),
        is_active=True,
    )
    personalized_model = ModelRegistry(
        model_type="personalized",
        user_id=user.user_id,
        milestone=60,
        artifact_url="https://example.com/personalized.joblib",
        trained_at=datetime.now(timezone.utc),
        is_active=True,
    )
    db_session.add(global_model)
    db_session.add(personalized_model)
    db_session.commit()

    monkeypatch.setattr(model_registry_service, "load_artifact", lambda *_: {"meta": {}})
    monkeypatch.setattr(
        personalized_forecast_service.personalized_forecast_service,
        "predict_next_day_for_user_with_artifact",
        lambda *_: {
            "forecast_date": "2024-01-02",
            "probability": 0.9,
            "chance_percent": 90.0,
            "threshold": 0.5,
            "prediction_binary": 1,
            "prediction_label": "HighRisk",
            "model_type": "personalized",
        },
    )

    eligibility = EligibilityResponse(
        user_id=user.user_id,
        eligible=True,
        streak=60,
        required_streak=1,
        restore_used=0,
        restore_remaining=3,
        missing=0,
        note="Eligible",
    )

    payload = forecast_service.get_global_forecast_for_user(user.user_id, eligibility, db_session)
    assert payload["forecast"]["modelType"] == "personalized"
