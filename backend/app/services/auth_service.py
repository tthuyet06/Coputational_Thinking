from fastapi import HTTPException
from starlette import status
from pydantic import EmailStr
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

mock_database = []
mock_access_tokens = {}
mock_refresh_tokens = {}

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
        for existing_user in mock_database:
            if existing_user['email'] == email:
                raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                                    detail={"email": ["Địa chỉ email này đã tồn tại."]})

        hashed_password = AuthService.get_password_hash(password)

        new_user = {
            "id": len(mock_database) + 1,
            "email": email,
            "username": username,
            "password": hashed_password,
        }
        mock_database.append(new_user)
        return new_user

    @staticmethod
    def login_user(email: EmailStr, password: str) -> dict:
        user = None
        for existing_user in mock_database:
            if existing_user['email'] == email:
                user = existing_user
                break
        if not user or not AuthService.verify_password(password, user["password"]):
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
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
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail="Refresh token không hợp lệ, vui lòng đăng nhập lại."
            )

        email = mock_refresh_tokens[refresh_token]

        new_access_token = f"new_access_for_{email}"

        mock_access_tokens[new_access_token] = email

        return {
            "access_token": new_access_token
        }