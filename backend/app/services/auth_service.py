from fastapi import HTTPException
from starlette import status
from pydantic import EmailStr
# from passlib.context import CryptContext # ĐÃ CHUYỂN SANG MOCK_DB

from backend.app.db.mock_db import (
    MOCK_USERS_DB,
    MOCK_ACCESS_TOKENS,
    MOCK_REFRESH_TOKENS,
    pwd_context  # Dùng chung context
)

class AuthService:

    @staticmethod
    def get_password_hash(password: str) -> str:
        return pwd_context.hash(password)

    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        return pwd_context.verify(plain_password, hashed_password)

    @staticmethod
    def register_user(email: EmailStr, username: str, password: str) -> dict:
        if not email:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                                detail={"email": ["Email không được để trống."]})
        if not username or not username.strip():
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                                detail={"full_name": ["Tên không được để trống"]})
        if not password or not password.strip():
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                                detail={"password": ["Mật khẩu không được để trống"]})
        if len(password) < 8:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                                detail={"password": ["Mật khẩu phải có ít nhất 8 ký tự"]})

        if len(password) > 32:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                                detail={"password": ["Mật khẩu không được vượt quá 32 ký tự"]})

        for existing_user in MOCK_USERS_DB:
            if existing_user['email'] == email:
                raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                                    detail={"email": ["Địa chỉ email này đã tồn tại."]})

        hashed_password = AuthService.get_password_hash(password)

        new_user = {
            "id": len(MOCK_USERS_DB) + 1,
            "email": email,
            "username": username,
            "password": hashed_password,
            "hobbies": [],  # Thêm field này cho đồng bộ
            "favorites": [],  # Thêm field này
        }
        # Ghi vào DB chung
        MOCK_USERS_DB.append(new_user)
        return new_user

    @staticmethod
    def login_user(email: EmailStr, password: str) -> dict:
        user = None
        # Đọc từ DB chung
        for existing_user in MOCK_USERS_DB:
            if existing_user['email'] == email:
                user = existing_user
                break

        if not user or not AuthService.verify_password(password, user["password"]):
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                                detail="Không tìm thấy tài khoản này với thông tin đăng nhập này.")

        access_token = f"access_for_{email}"
        refresh_token = f"refresh_for_{email}"

        # Ghi vào kho token chung
        MOCK_ACCESS_TOKENS[access_token] = email
        MOCK_REFRESH_TOKENS[refresh_token] = email

        return {
            "access_token": access_token,
            "refresh_token": refresh_token
        }

    @staticmethod
    def refresh_access_token(refresh_token: str) -> dict:
        # Đọc/ghi từ kho token chung
        if refresh_token not in MOCK_REFRESH_TOKENS:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail="Refresh token không hợp lệ, vui lòng đăng nhập lại."
            )

        email = MOCK_REFRESH_TOKENS[refresh_token]
        new_access_token = f"new_access_for_{email}"
        MOCK_ACCESS_TOKENS[new_access_token] = email

        return {
            "access_token": new_access_token
        }