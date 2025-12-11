import pytest
from unittest.mock import patch, MagicMock
from starlette import status
from backend.tests.conftest import MOCK_USER_UUID


# --- Mock AuthService Instance ---
@pytest.fixture
def mock_auth_service():
    """
    Fixture mock trực tiếp biến instance 'auth_service' trong file auth.py.
    """
    # QUAN TRỌNG: Patch vào biến 'auth_service' (chữ thường) đã được khởi tạo trong auth.py
    with patch('backend.app.api.v1.endpoints.auth.auth_service') as mock_instance:
        # 1. Mock Register
        # Tạo object User giả lập khớp với UserResponse schema
        mock_user_response = MagicMock()
        mock_user_response.id = MOCK_USER_UUID  # UUID hợp lệ
        mock_user_response.email = "new@user.com"
        mock_user_response.username = "newuser"
        mock_user_response.hobbies = []  # Bắt buộc vì UserResponse có field hobbies

        mock_instance.register_user.return_value = mock_user_response

        # 2. Mock Login
        mock_instance.login_user.return_value = {
            "access_token": "mock_access_token",
            "refresh_token": "mock_refresh_token"
        }

        # 3. Mock Refresh Token
        mock_instance.refresh_access_token.return_value = {
            "access_token": "new_mock_access_token"
        }

        # 4. Mock Logout
        mock_instance.logout_user.return_value = None

        yield mock_instance


def test_register_success(client, mock_auth_service):
    """Kiểm tra đăng ký thành công."""
    response = client.post(
        "/api/v1/auth/register",
        json={"email": "new@user.com", "username": "newuser", "password": "securepassword"}
    )

    # In ra nội dung lỗi nếu test fail
    assert response.status_code == status.HTTP_201_CREATED, response.text

    data = response.json()
    assert data["id"] == str(MOCK_USER_UUID)
    assert data["email"] == "new@user.com"
    assert data["username"] == "newuser"
    mock_auth_service.register_user.assert_called_once()


def test_login_success(client, mock_auth_service):
    """Kiểm tra đăng nhập thành công."""
    response = client.post(
        "/api/v1/auth/login",
        json={"username": "tester", "password": "securepassword"}
    )

    assert response.status_code == status.HTTP_200_OK, response.text
    data = response.json()
    assert data["access_token"] == "mock_access_token"
    assert data["refresh_token"] == "mock_refresh_token"
    mock_auth_service.login_user.assert_called_once()


def test_refresh_token_success(client, mock_auth_service):
    """Kiểm tra làm mới token thành công."""
    response = client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": "old_refresh_token"}
    )

    assert response.status_code == status.HTTP_200_OK, response.text
    data = response.json()
    assert data["access_token"] == "new_mock_access_token"
    mock_auth_service.refresh_access_token.assert_called_once()


def test_logout_success(client, mock_auth_service):
    """Kiểm tra đăng xuất thành công."""
    response = client.post(
        "/api/v1/auth/logout",
        json={"refresh_token": "token_to_invalidate"}
    )

    assert response.status_code == status.HTTP_204_NO_CONTENT, response.text
    assert response.content == b''
    mock_auth_service.logout_user.assert_called_once()