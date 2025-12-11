import pytest
from unittest.mock import patch, MagicMock
from starlette import status

# --- Endpoint /tags/hobbies ---
@patch('backend.app.api.v1.endpoints.tags.tag_service.list_hobby_tags')
def test_get_hobbies_list_success(mock_list_hobby_tags, client):
    """Kiểm tra lấy danh sách tags sở thích."""
    # Mock trả về List[HobbyItem] (có id, tag, name)
    mock_list_hobby_tags.return_value = [
        {"id": 1, "tag": "#reading", "name": "Đọc sách"},
        {"id": 2, "tag": "#coding", "name": "Lập trình"}
    ]

    response = client.get("/api/v1/tags/hobbies")

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert len(data["hobbies"]) == 2
    assert data["hobbies"][0]["tag"] == "#reading"
    mock_list_hobby_tags.assert_called_once()

# --- Endpoint /tags/activities ---
@patch('backend.app.api.v1.endpoints.tags.tag_service.list_activity_tags')
def test_get_activities_list_success(mock_list_activity_tags, client):
    """Kiểm tra lấy danh sách tags hoạt động."""
    # Service trả về List, Endpoint đóng gói vào {"activities": ...}
    # Schema yêu cầu: id, tag, name
    mock_list_activity_tags.return_value = [
        {"id": 1, "tag": "ACT_A", "name": "Hoạt động A"},
        {"id": 2, "tag": "ACT_B", "name": "Hoạt động B"}
    ]

    response = client.get("/api/v1/tags/activities")

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert len(data["activities"]) == 2
    assert data["activities"][0]["tag"] == "ACT_A" # Sửa 'code' thành 'tag'
    mock_list_activity_tags.assert_called_once()

# --- Endpoint /tags/durations ---
@patch('backend.app.api.v1.endpoints.tags.list_duration_tags')
def test_get_duration_tags_success(mock_list_duration_tags, client):
    """Kiểm tra lấy danh sách tags thời lượng."""
    # Service trả về List, Schema yêu cầu: tag_id, display_name
    mock_list_duration_tags.return_value = [
        {"tag_id": "DUR_SHORT", "display_name": "Ngắn"}, # Sửa code->tag_id, name->display_name
        {"tag_id": "DUR_LONG", "display_name": "Dài"}
    ]

    response = client.get("/api/v1/tags/durations")

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert len(data["duration_tags"]) == 2
    assert data["duration_tags"][0]["tag_id"] == "DUR_SHORT"
    mock_list_duration_tags.assert_called_once()