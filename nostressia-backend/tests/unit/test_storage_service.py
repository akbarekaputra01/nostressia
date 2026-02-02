from datetime import date

import pytest
from fastapi import HTTPException

from app.models.user_model import User
from app.schemas.storage_schema import StorageUploadSasRequest
from app.services import storage_service
from app.utils.hashing import hash_password


def _create_user(user_id=None, username=None, email="user@example.com"):
    return User(
        user_id=user_id,
        name="Storage",
        username=username,
        email=email,
        password=hash_password("Password123!"),
        gender="unspecified",
        user_dob=date(2000, 1, 1),
        is_verified=True,
        streak=0,
    )


def test_resolve_user_namespace():
    assert storage_service._resolve_user_namespace(_create_user(user_id=5)) == "5"
    assert storage_service._resolve_user_namespace(_create_user(username="name")) == "name"
    assert storage_service._resolve_user_namespace(_create_user(email="mail@example.com")) == "mail@example.com"


def test_create_upload_sas_rejects_content_type():
    user = _create_user(user_id=1)
    payload = StorageUploadSasRequest(file_name="file.txt", content_type="text/plain")
    with pytest.raises(HTTPException, match="not supported"):
        storage_service.create_upload_sas(user, payload)


def test_create_upload_sas_requires_filename():
    user = _create_user(user_id=1)
    payload = StorageUploadSasRequest(file_name="", content_type="image/png")
    with pytest.raises(HTTPException, match="File name is required"):
        storage_service.create_upload_sas(user, payload)


def test_create_upload_sas_success(monkeypatch):
    user = _create_user(user_id=10)
    payload = StorageUploadSasRequest(file_name="avatar.png", content_type="image/png")

    monkeypatch.setattr(
        storage_service,
        "generate_upload_sas",
        lambda *_: ("https://upload", "https://blob", None),
    )

    response = storage_service.create_upload_sas(user, payload)
    assert response.upload_url == "https://upload"
    assert response.blob_url == "https://blob"
    assert "users/10" in response.blob_name
