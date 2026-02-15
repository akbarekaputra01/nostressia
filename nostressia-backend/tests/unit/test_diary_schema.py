from app.schemas.diary_schema import DiaryUpdate


def test_diary_update_ignores_unknown_fields():
    payload = DiaryUpdate.model_validate(
        {
            "title": "Updated",
            "note": "Safe content",
            "createdAt": "2026-01-01T00:00:00Z",
            "diaryId": 16,
            "unknownField": "legacy-client",
        }
    )

    assert payload.title == "Updated"
    assert payload.note == "Safe content"
    assert not hasattr(payload, "createdAt")
