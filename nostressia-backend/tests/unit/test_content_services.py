import pytest
from unittest.mock import MagicMock
from app.services import tips_service, motivation_service, bookmark_service
from app.models.tips_model import Tips, TipsCategory
from app.models.motivation_model import Motivation
from app.models.bookmark_model import Bookmark
from app.schemas.tips_schema import TipsCreate, TipsCategoryCreate
from app.schemas.motivation_schema import MotivationCreate


def test_create_category(mock_db_session):
    # Setup mock
    data = TipsCategoryCreate(category_name="Health")
    
    # Execute
    cat = tips_service.create_category(mock_db_session, data)
    
    # Assert
    assert cat.category_name == "Health"
    mock_db_session.add.assert_called_once()
    mock_db_session.commit.assert_called_once()


def test_create_motivation(mock_db_session):
    data = MotivationCreate(quote="Go!", uploader_id=1, author_name="Me")
    mot = motivation_service.create_motivation(mock_db_session, data)
    assert mot.quote == "Go!"
    mock_db_session.add.assert_called_once()

def test_delete_motivation_found(mock_db_session):
    mock_query = MagicMock()
    mock_db_session.query.return_value = mock_query
    mock_query.filter.return_value = mock_query
    mock_query.first.return_value = Motivation(motivation_id=1)

    motivation_service.delete_motivation(mock_db_session, 1)
    mock_db_session.delete.assert_called_once()
    mock_db_session.commit.assert_called_once()


def test_add_bookmark_success(mock_db_session):
    mock_query = MagicMock()
    mock_db_session.query.return_value = mock_query
    
    # Sequence: 1. Motivation found, 2. No existing bookmark found
    mock_query.filter.return_value.first.side_effect = [
        Motivation(motivation_id=1),
        None
    ]

    bookmark_service.add_bookmark(mock_db_session, user_id=1, motivation_id=1)
    mock_db_session.add.assert_called_once()
    mock_db_session.commit.assert_called_once()
