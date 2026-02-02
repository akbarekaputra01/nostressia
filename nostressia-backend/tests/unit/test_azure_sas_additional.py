from datetime import datetime

import pytest

from app.utils import azure_sas


def test_sanitize_filename_and_folder():
    sanitized = azure_sas._sanitize_filename("../bad name!!.png")
    assert " " not in sanitized
    assert sanitized.startswith("bad")
    assert sanitized.endswith(".png")
    assert azure_sas._sanitize_filename("***") == "file"
    sanitized_folder = azure_sas._sanitize_folder("../bad/folder")
    assert ".." not in sanitized_folder
    assert sanitized_folder.endswith("bad/folder")
    assert azure_sas._sanitize_folder("") == "uploads"


def test_resolve_account_key_requires_key(monkeypatch):
    class DummyCredential:
        account_key = "secret"

    class DummyClient:
        credential = DummyCredential()
        account_name = "account"

    monkeypatch.setattr(azure_sas.settings, "azure_storage_account_name", "")
    name, key = azure_sas._resolve_account_key(DummyClient())
    assert name == "account"
    assert key == "secret"

    class MissingKey:
        pass

    class MissingClient:
        credential = MissingKey()
        account_name = "account"

    with pytest.raises(RuntimeError, match="account key"):
        azure_sas._resolve_account_key(MissingClient())


def test_generate_sas_urls(monkeypatch):
    class DummyCredential:
        account_key = "secret"

    class DummyClient:
        credential = DummyCredential()
        account_name = "account"

    monkeypatch.setattr(azure_sas.settings, "azure_storage_connection_string", "conn")
    monkeypatch.setattr(azure_sas.settings, "azure_storage_container", "container")
    monkeypatch.setattr(azure_sas, "_get_blob_service_client", lambda: DummyClient())
    monkeypatch.setattr(azure_sas, "generate_blob_sas", lambda **_: "token")

    sas_url, blob_url, expires_at = azure_sas.generate_profile_picture_sas("blob.png")
    assert sas_url.endswith("?token")
    assert blob_url == "https://account.blob.core.windows.net/container/blob.png"
    assert isinstance(expires_at, datetime)

    sas_url, blob_url, expires_at = azure_sas.generate_upload_sas("uploads/blob.png")
    assert sas_url.endswith("?token")
    assert "uploads/blob.png" in blob_url
    assert isinstance(expires_at, datetime)


def test_get_blob_service_client_requires_connection_string(monkeypatch):
    monkeypatch.setattr(azure_sas.settings, "azure_storage_connection_string", "")
    with pytest.raises(RuntimeError, match="connection string"):
        azure_sas._get_blob_service_client()
