import pytest
from unittest.mock import MagicMock, Session
from app.services import admin_service
from app.models.user_model import User
from app.models.diary_model import Diary
from app.schemas.user_auth_schema import AdminUserUpdate

def test_get_all_users(mock_db_session):
    # Mock query
    mock_query = MagicMock()
    mock_db_session.query.return_value = mock_query
    mock_query.filter.return_value = mock_query
    mock_query.offset.return_value = mock_query
    mock_query.limit.return_value = mock_query
    mock_query.all.return_value = [User(user_id=1, username="test")]
    mock_query.count.return_value = 1

    result = admin_service.get_all_users(mock_db_session, page=1, limit=10)
    
    assert result["total"] == 1
    assert len(result["data"]) == 1
    assert result["data"][0].username == "test"

def test_get_user_by_id_found(mock_db_session):
    mock_query = MagicMock()
    mock_db_session.query.return_value = mock_query
    mock_query.filter.return_value = mock_query
    mock_query.first.return_value = User(user_id=1, username="test")

    user = admin_service.get_user_by_id(mock_db_session, 1)
    assert user.username == "test"

def test_update_user_by_admin(mock_db_session):
    user = User(user_id=1, username="old", email="old@test.com")
    mock_query = MagicMock()
    mock_db_session.query.return_value = mock_query
    mock_query.filter.return_value = mock_query
    mock_query.first.side_effect = [user, None, None] # First for get_user, others for duplicate checks

    update_data = AdminUserUpdate(username="new")
    updated_user = admin_service.update_user_by_admin(mock_db_session, 1, update_data)

    assert updated_user.username == "new"
    mock_db_session.commit.assert_called()

def test_delete_diary_by_admin(mock_db_session):
    diary = Diary(diary_id=10, note="Secret")
    mock_query = MagicMock()
    mock_db_session.query.return_value = mock_query
    mock_query.filter.return_value = mock_query
    mock_query.first.return_value = diary

    admin_service.delete_diary_by_admin(mock_db_session, 10)
    mock_db_session.delete.assert_called_with(diary)
    mock_db_session.commit.assert_called()
