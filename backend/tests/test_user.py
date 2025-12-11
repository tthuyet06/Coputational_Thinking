import pytest
from unittest.mock import patch, MagicMock
from starlette import status


# --- Endpoint /users/me ---
@patch('backend.app.api.v1.endpoints.users.get_profile')
def test_get_me_success(mock_get_profile, client, mock_user):
    mock_get_profile.return_value = {
        "id": mock_user.id,
        "email": mock_user.email,
        "username": mock_user.username
    }
    response = client.get("/api/v1/users/me")
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["username"] == "tester"
    mock_get_profile.assert_called_once_with(mock_user)


@patch('backend.app.api.v1.endpoints.users.update_name')
@patch('backend.app.api.v1.endpoints.users.get_profile')
def test_patch_me_success(mock_get_profile, mock_update_name, client, mock_user):
    updated_user = MagicMock(id=mock_user.id, email=mock_user.email, username="new_name")
    mock_update_name.return_value = updated_user
    mock_get_profile.return_value = {
        "id": updated_user.id,
        "email": updated_user.email,
        "username": updated_user.username
    }
    response = client.patch("/api/v1/users/me", json={"username": "new_name"})
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["username"] == "new_name"
    mock_update_name.assert_called_once()
    mock_get_profile.assert_called_once_with(updated_user)


@patch('backend.app.api.v1.endpoints.users.change_user_password')
def test_update_password_success(mock_change_user_password, client, mock_user):
    mock_change_user_password.return_value = {"message": "Password changed successfully."}
    response = client.put(
        "/api/v1/users/me/password",
        json={"old_password": "securepassword", "new_password": "newsecurepassword"}
    )
    assert response.status_code == status.HTTP_200_OK
    mock_change_user_password.assert_called_once()


# --- Endpoint /users/me/hobbies ---
@patch('backend.app.api.v1.endpoints.hobbies.update_hobbies')
def test_post_me_hobbies_success(mock_update_hobbies, client):
    normalized_hobbies = ["hiking", "coding"]
    mock_update_hobbies.return_value = normalized_hobbies
    response = client.post(
        "/api/v1/users/me/hobbies",
        json={"hobbies": ["reading", "hiking"]}
    )
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["hobbies"] == normalized_hobbies
    mock_update_hobbies.assert_called_once()
