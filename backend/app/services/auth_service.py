import uuid
from fastapi import HTTPException
from starlette import status
from pydantic import EmailStr
import jwt # Vẫn cần jwt để bắt các Exception như ExpiredSignatureError/InvalidTokenError

# ✅ Import các hàm và config từ security.py
from backend.app.core.security import (
    get_password_hash,
    verify_password,
    create_jwt_token,
    decode_jwt_token
)
from backend.app.db.mock_db import (
    MOCK_USERS_DB,
    MOCK_ACCESS_TOKENS,
    MOCK_REFRESH_TOKENS
)


class AuthService:

    @staticmethod
    def get_password_hash(password: str) -> str:
        return get_password_hash(password)

    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        return verify_password(plain_password, hashed_password)

    # ==========================
    # 🧍 REGISTER USER
    # ==========================
    @staticmethod
    def register_user(email: EmailStr, username: str, password: str) -> dict:
        # ... (Kiểm tra validation/trùng lặp giữ nguyên) ...
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

        # ✅ Dùng hàm import từ security.py
        hashed_password = get_password_hash(password)

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

    # 🔐 LOGIN USER BẰNG USERNAME
    # ==========================
    @staticmethod
    def login_user(username: str, password: str) -> dict:
        user = next((u for u in MOCK_USERS_DB if u["username"] == username), None)

        # ✅ Dùng hàm verify import từ security.py
        if not user or not verify_password(password, user["password"]):
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                                detail="Sai tên đăng nhập hoặc mật khẩu.")

        user_id = str(user["id"])

        # ✅ Dùng hàm create_jwt_token import từ security.py
        access_token = create_jwt_token(user_id, token_type="access")
        refresh_token = create_jwt_token(user_id, token_type="refresh")

        MOCK_ACCESS_TOKENS[access_token] = user_id
        MOCK_REFRESH_TOKENS[refresh_token] = user_id

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
            # ✅ Dùng hàm decode_jwt_token import từ security.py
            payload = decode_jwt_token(refresh_token)
            if payload.get("type") != "refresh":
                raise HTTPException(status_code=401, detail="Token không phải là refresh token.")
        except jwt.ExpiredSignatureError:
            raise HTTPException(status_code=401, detail="Refresh token đã hết hạn.")
        except jwt.InvalidTokenError:
            raise HTTPException(status_code=401, detail="Refresh token không hợp lệ.")

        user_id = str(payload.get("sub"))
        user = next((u for u in MOCK_USERS_DB if str(u["id"]) == user_id), None)
        if not user:
            raise HTTPException(status_code=404, detail="Không tìm thấy người dùng tương ứng với token.")

        # ✅ Dùng hàm create_jwt_token import từ security.py
        new_access_token = create_jwt_token(user_id, token_type="access")
        MOCK_ACCESS_TOKENS[new_access_token] = user_id

        return {"access_token": new_access_token}