from fastapi import HTTPException
from starlette import status
from pydantic import EmailStr


mock_database = [
    {
        "id": 1,
        "email": "user1@example.com",
        "full_name": "User Mot",
        "password": "password123"
    },
    {
        "id": 2,
        "email": "user2@example.com",
        "full_name": "User Hai",
        "password": "password456"
    }
]

mock_access_tokens = {}
mock_refresh_tokens = {}

class AuthService:

    @staticmethod
    def register_user(email: EmailStr, full_name: str, password: str) -> dict:
        if not email:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                                detail={"email": ["Email không được để trống."]})
        if not full_name or not full_name.strip():
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                                detail={"full_name": ["Tên không được để trống"]})
        if not password or not password.strip():
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                                detail={"password": ["Mật khẩu không được để trống"]})
        for existing_user in mock_database:
            if existing_user['email'] == email:
                raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                                    detail={"email": ["Địa chỉ email này đã tồn tại."]})

        new_user = {
            "id": len(mock_database) + 1,
            "email": email,
            "full_name": full_name,
            "password": password,
        }
        mock_database.append(new_user)
        return new_user

    @staticmethod
    def login_user(email: EmailStr, password: str) -> dict:
        user = None
        for existing_user in mock_database:
            if existing_user['email'] == email and existing_user['password'] == password:
                user = existing_user
                break
        if not user or user["password"] != password:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                                detail="Không tìm thấy tài khoản này với thông tin đăng nhập này.")

        access_token = f"access_for_{email}"
        refresh_token = f"refresh_for_{email}"
        mock_access_tokens[access_token] = email
        mock_refresh_tokens[refresh_token] = email
        return {
            "access_token": access_token,
            "refresh_token": refresh_token
        }

    @staticmethod
    def refresh_access_token(refresh_token: str) -> dict:
        if refresh_token not in mock_refresh_tokens:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token không hợp lệ, vui lòng đăng nhập lại."
            )

        email = mock_refresh_tokens[refresh_token]

        new_access_token = f"new_access_for_{email}"

        mock_access_tokens[new_access_token] = email

        return {
            "access_token": new_access_token
        }

