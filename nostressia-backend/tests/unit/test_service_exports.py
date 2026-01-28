from app.services import (
    auth_service,
    azure_storage_service,
    diary_service,
    email_service,
    forecast_service,
    global_forecast_service,
    ml_service,
    notification_scheduler,
    personalized_forecast_service,
    profile_service,
    push_notification_service,
    stress_service,
    user_auth_service,
)


def test_service_exports_are_available():
    assert callable(auth_service.authenticate_admin)
    assert callable(azure_storage_service.upload_avatar)
    assert callable(diary_service.create_diary)
    assert callable(email_service.send_otp_email)
    assert callable(forecast_service.get_global_forecast_for_user)
    assert callable(global_forecast_service.global_forecast_service.get_required_history_days)
    assert callable(ml_service.ml_service.predict_stress)
    assert callable(notification_scheduler.upsert_daily_reminder_job)
    assert callable(personalized_forecast_service.personalized_forecast_service.predict_next_day_for_user)
    assert callable(profile_service.create_profile_picture_sas)
    assert callable(push_notification_service.send_push)
    assert callable(stress_service.get_user_stress_logs)
    assert callable(user_auth_service.authenticate_user)
