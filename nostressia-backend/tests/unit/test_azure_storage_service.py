import io

from fastapi import UploadFile
from starlette.datastructures import Headers

from app.services import azure_storage_service


def test_save_local_avatar(tmp_path, monkeypatch):
    monkeypatch.setattr(azure_storage_service, "LOCAL_AVATAR_ROOT", tmp_path)

    upload = UploadFile(
        file=io.BytesIO(b"data"),
        filename="avatar.png",
        headers=Headers({"content-type": "image/png"}),
    )
    result = azure_storage_service._save_local_avatar(upload, user_id=1)

    assert result.startswith("/uploads/avatars/1/")
    saved_path = tmp_path / "1" / result.split("/")[-1]
    assert saved_path.exists()


def test_upload_avatar_cloud(monkeypatch):
    class FakeBlobClient:
        def __init__(self):
            self.url = "https://blob.example.com/avatars/1/avatar.png"
            self.uploaded = False

        def upload_blob(self, *_args, **_kwargs):
            self.uploaded = True

    class FakeContainer:
        def __init__(self):
            self.created = False
            self.blob_client = FakeBlobClient()

        def create_container(self):
            self.created = True

        def get_blob_client(self, _):
            return self.blob_client

    class FakeService:
        def __init__(self):
            self.container = FakeContainer()

        def get_container_client(self, _):
            return self.container

    monkeypatch.setattr(azure_storage_service.settings, "azure_storage_connection_string", "conn")
    monkeypatch.setattr(azure_storage_service.settings, "azure_storage_container_name", "container")
    monkeypatch.setattr(
        azure_storage_service.BlobServiceClient,
        "from_connection_string",
        lambda *_: FakeService(),
    )

    upload = UploadFile(
        file=io.BytesIO(b"data"),
        filename="avatar.png",
        headers=Headers({"content-type": "image/png"}),
    )
    url = azure_storage_service.upload_avatar(upload, user_id=1)

    assert url == "https://blob.example.com/avatars/1/avatar.png"
