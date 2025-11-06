import uuid
import jwt
from datetime import datetime, timedelta, UTC
from fastapi import HTTPException
from starlette import status
from pydantic import EmailStr
from backend.app.db.mock_db import (
    MOCK_USERS_DB,
    MOCK_ACCESS_TOKENS,
    MOCK_REFRESH_TOKENS,
    pwd_context
)

# ===== JWT CONFIG =====
SECRET_KEY = "super_secret_key"  # 🔐 Nên để trong .env
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 1


class AuthService:

    # ==========================
    # 🔒 PASSWORD FUNCTIONS
    # ==========================
    @staticmethod
    def get_password_hash(password: str) -> str:
        return pwd_context.hash(password)

    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        return pwd_context.verify(plain_password, hashed_password)

    # ==========================
    # 🧍 REGISTER USER
    # ==========================
    @staticmethod
    def register_user(email: EmailStr, username: str, password: str) -> dict:
        if not email:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                                detail={"email": ["Email không được để trống."]})
        if not username or not username.strip():
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                                detail={"username": ["Tên không được để trống"]})
        if not password or not password.strip():
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                                detail={"password": ["Mật khẩu không được để trống"]})
        if len(password) < 8:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                                detail={"password": ["Mật khẩu phải có ít nhất 8 ký tự"]})
        if len(password) > 32:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                                detail={"password": ["Mật khẩu không được vượt quá 32 ký tự"]})

        # Kiểm tra trùng email/username
        for existing_user in MOCK_USERS_DB:
            if existing_user['email'] == email:
                raise HTTPException(status_code=422, detail={"email": ["Email này đã tồn tại."]})
            if existing_user['username'] == username:
                raise HTTPException(status_code=422, detail={"username": ["Tên đăng nhập đã tồn tại."]})

        hashed_password = AuthService.get_password_hash(password)

        new_user = {
            "id": str(uuid.uuid4()),
            "email": email,
            "username": username,
            "password": hashed_password,
            "hobbies": [],
            "favorites": []
        }

        MOCK_USERS_DB.append(new_user)
        user_copy = new_user.copy()
        del user_copy["password"]
        return user_copy

    # ==========================
    # 🔑 TẠO JWT TOKEN THEO ID
    # ==========================
    @staticmethod
    def create_jwt_token(user_id: str, token_type: str = "access") -> str:
        """Tạo JWT token chứa id (UUID)"""
        if token_type == "access":
            expire = datetime.now(UTC) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        elif token_type == "refresh":
            expire = datetime.now(UTC) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
        else:
            raise ValueError("token_type không hợp lệ")

        payload = {
            "sub": user_id,
            "type": token_type,
            "exp": expire
        }

        return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

    # ==========================
    # 🔐 LOGIN USER BẰNG USERNAME
    # ==========================
    @staticmethod
    def login_user(username: str, password: str) -> dict:
        user = next((u for u in MOCK_USERS_DB if u["username"] == username), None)

        if not user or not AuthService.verify_password(password, user["password"]):
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                                detail="Sai tên đăng nhập hoặc mật khẩu.")

        # ✅ Token tạo dựa trên UUID (user["id"])
        access_token = AuthService.create_jwt_token(user["id"], token_type="access")
        refresh_token = AuthService.create_jwt_token(user["id"], token_type="refresh")

        MOCK_ACCESS_TOKENS[access_token] = user["id"]
        MOCK_REFRESH_TOKENS[refresh_token] = user["id"]

        return {
            "access_token": access_token,
            "refresh_token": refresh_token
        }

    # ==========================
    # 🔁 REFRESH ACCESS TOKEN
    # ==========================
    @staticmethod
    def refresh_access_token(refresh_token: str) -> dict:
        try:
            payload = jwt.decode(refresh_token, SECRET_KEY, algorithms=[ALGORITHM])
            if payload.get("type") != "refresh":
                raise HTTPException(status_code=401, detail="Token không phải là refresh token.")
        except jwt.ExpiredSignatureError:
            raise HTTPException(status_code=401, detail="Refresh token đã hết hạn.")
        except jwt.InvalidTokenError:
            raise HTTPException(status_code=401, detail="Refresh token không hợp lệ.")

        user_id = payload.get("sub")
        user = next((u for u in MOCK_USERS_DB if u["id"] == user_id), None)
        if not user:
            raise HTTPException(status_code=404, detail="Không tìm thấy người dùng tương ứng với token.")

        # ✅ Tạo access token mới cũng dựa trên id
        new_access_token = AuthService.create_jwt_token(user_id, token_type="access")
        MOCK_ACCESS_TOKENS[new_access_token] = user_id

        return {"access_token": new_access_token}
