import pytest
from unittest.mock import patch
from starlette import status

# --- API THÊM YÊU THÍCH---
@patch('backend.app.api.v1.endpoints.favorites.add_favorite_item')
def test_add_favorite_success(mock_add_favorite_item, client, mock_user):
    place_id = 123
    mock_add_favorite_item.return_value = {"message": f"Place {place_id} added to favorites."}
    response = client.post(f"/api/v1/favorites/{place_id}")
    assert response.status_code == status.HTTP_201_CREATED
    assert response.json()["message"] == f"Place {place_id} added to favorites."
    mock_add_favorite_item.assert_called_once()

# --- API XÓA YÊU THÍCH---
@patch('backend.app.api.v1.endpoints.favorites.remove_favorite_item')
def test_remove_favorite_success(mock_remove_favorite_item, client, mock_user):
    place_id = 123
    mock_remove_favorite_item.return_value = {"message": f"Place {place_id} removed from favorites."}
    response = client.delete(f"/api/v1/favorites/{place_id}")
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["message"] == f"Place {place_id} removed from favorites."
    mock_remove_favorite_item.assert_called_once()

# --- API XEM DANH SÁCH---
@patch('backend.app.api.v1.endpoints.favorites.list_favorites')
def test_read_favorites_success(mock_list_favorites, client, mock_user):
    # Mock trả về 2 items đầy đủ thông tin theo Schema Place
    mock_list_favorites.return_value = [
        {
            "id": 101, "name": "Place A", "address": "123 Street",
            "image": None, "overview": None, "summarization": None,
            "tags": [], "rating": None, "open": None
        },
        {
            "id": 102, "name": "Place B", "address": "456 Avenue",
            "image": None, "overview": None, "summarization": None,
            "tags": [], "rating": None, "open": None
        }
    ]

    response = client.get("/api/v1/favorites/")

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert len(data) == 2
    assert data[0]["name"] == "Place A"
    mock_list_favorites.assert_called_once()