from datetime import date

from app.models.push_delivery_log_model import PushDeliveryLog
from app.models.push_subscription_model import PushSubscription
from app.models.user_model import User
from app.services import notification_scheduler
from app.utils.hashing import hash_password


def _create_user(db_session):
    user = User(
        name="Notify User",
        username="notify",
        email="notify@example.com",
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


def test_payload_and_helpers():
    payload = notification_scheduler._build_payload()
    assert payload["title"]
    assert notification_scheduler._normalize_tz("") == notification_scheduler.DEFAULT_TZ
    assert notification_scheduler._normalize_tz("Invalid/TZ") == notification_scheduler.DEFAULT_TZ
    assert notification_scheduler._parse_hhmm("08:30") == (8, 30)
    assert notification_scheduler._job_id_for_subscription(5) == "daily-reminder-sub-5"


def test_scheduler_start_stop(monkeypatch):
    notification_scheduler._scheduler = None

    class FakeScheduler:
        def __init__(self, *_args, **_kwargs):
            self.running = False
            self.jobs = []

        def start(self):
            self.running = True

        def add_job(self, *args, **kwargs):
            self.jobs.append((args, kwargs))

        def remove_job(self, _job_id):
            self.jobs = [job for job in self.jobs if job[1].get("id") != _job_id]

        def shutdown(self, wait=False):
            self.running = False

    monkeypatch.setattr(notification_scheduler, "BackgroundScheduler", FakeScheduler)

    scheduler = notification_scheduler._ensure_scheduler_started()
    assert scheduler.running is True

    notification_scheduler.stop_notification_scheduler(scheduler)
    assert notification_scheduler._scheduler is None


def test_upsert_and_remove_job(monkeypatch):
    notification_scheduler._scheduler = None

    class FakeScheduler:
        def __init__(self, *_args, **_kwargs):
            self.running = True
            self.added = []
            self.removed = []

        def start(self):
            self.running = True

        def add_job(self, *args, **kwargs):
            self.added.append((args, kwargs))

        def remove_job(self, job_id):
            self.removed.append(job_id)

    fake_scheduler = FakeScheduler()
    monkeypatch.setattr(notification_scheduler, "_ensure_scheduler_started", lambda: fake_scheduler)

    notification_scheduler.upsert_daily_reminder_job(1, "08:00", "Asia/Jakarta")
    assert fake_scheduler.added

    notification_scheduler.remove_daily_reminder_job(1)
    assert "daily-reminder-sub-1" in fake_scheduler.removed


def test_load_jobs_from_db(db_session, monkeypatch):
    notification_scheduler._scheduler = None
    user = _create_user(db_session)

    subscription = PushSubscription(
        user_id=user.user_id,
        endpoint="https://example.com",
        p256dh="p256dh",
        auth="auth",
        reminder_time="08:00",
        timezone="Asia/Jakarta",
        is_active=True,
    )
    db_session.add(subscription)
    db_session.commit()

    loaded = {"count": 0}

    class FakeScheduler:
        running = True

    monkeypatch.setattr(notification_scheduler, "_ensure_scheduler_started", lambda: FakeScheduler())
    monkeypatch.setattr(notification_scheduler, "SessionLocal", lambda: db_session)
    monkeypatch.setattr(
        notification_scheduler,
        "upsert_daily_reminder_job",
        lambda **_kwargs: loaded.__setitem__("count", loaded["count"] + 1),
    )

    notification_scheduler.load_jobs_from_db()
    assert loaded["count"] == 1


def test_send_daily_reminder_creates_log(db_session, monkeypatch):
    user = _create_user(db_session)
    subscription = PushSubscription(
        user_id=user.user_id,
        endpoint="https://example.com",
        p256dh="p256dh",
        auth="auth",
        reminder_time="08:00",
        timezone="Asia/Jakarta",
        is_active=True,
    )
    db_session.add(subscription)
    db_session.commit()
    db_session.refresh(subscription)

    class SessionWrapper:
        def __init__(self, session):
            self._session = session

        def __getattr__(self, item):
            return getattr(self._session, item)

        def close(self):
            return None

    monkeypatch.setattr(notification_scheduler, "SessionLocal", lambda: SessionWrapper(db_session))
    monkeypatch.setattr(notification_scheduler, "send_push", lambda *_: None)

    notification_scheduler._send_daily_reminder(subscription.subscription_id)

    assert db_session.query(PushDeliveryLog).count() == 1
