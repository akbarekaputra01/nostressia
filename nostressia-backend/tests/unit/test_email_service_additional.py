from app.services import email_service


def test_get_brevo_client_requires_key(monkeypatch):
    monkeypatch.setattr(email_service, "BREVO_API_KEY", "")
    api, error = email_service._get_brevo_client()
    assert api is None
    assert "BREVO_API_KEY" in error


def test_send_otp_email_success(monkeypatch):
    class FakeClient:
        def __init__(self):
            self.sent = False

        def send_transac_email(self, _payload):
            self.sent = True

    fake_client = FakeClient()
    monkeypatch.setattr(email_service, "_get_brevo_client", lambda: (fake_client, None))

    ok, error = email_service.send_otp_email("user@example.com", "123456")
    assert ok is True
    assert error is None
    assert fake_client.sent is True


def test_send_reset_password_email_client_error(monkeypatch):
    monkeypatch.setattr(email_service, "_get_brevo_client", lambda: (None, "missing"))
    ok, error = email_service.send_reset_password_email("user@example.com", "123456")
    assert ok is False
    assert "missing" in error


def test_send_weekly_report_email_client_error(monkeypatch):
    monkeypatch.setattr(email_service, "_get_brevo_client", lambda: (None, "missing"))
    ok, error = email_service.send_weekly_report_email("user@example.com", {})
    assert ok is False
    assert "missing" in error
