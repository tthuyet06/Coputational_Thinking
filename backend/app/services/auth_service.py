from fastapi import HTTPException
from starlette import status
from pydantic import EmailStr
from jose import ExpiredSignatureError, JWTError
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, UTC
from backend.app.db import models


# ✅ Import các hàm và config từ security.py
from backend.app.core.security import (
    get_password_hash,
    verify_password,
    create_jwt_token,
    decode_jwt_token,
    REFRESH_TOKEN_EXPIRE_DAYS
)

class AuthService:

    # ==========================
    # 🧍 REGISTER USER
    # ==========================
    @staticmethod
    def register_user(db : Session, email: EmailStr, username: str, password: str) -> models.User:
        if not email:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                                detail={"email": ["Email cannot be empty"]})
        if not username or not username.strip():
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                                detail={"username": ["Username cannot be empty"]})
        if not password or not password.strip():
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                                detail={"password": ["Password cannot be empty"]})
        if len(password) < 8:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                                detail={"password": ["Password must be at least 8 characters long"]})
        if len(password) > 32:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                                detail={"password": ["Password cannot exceed 32 characters"]})

        # Kiểm tra trùng email/username
        existing_user = db.query(models.User).filter(
            (models.User.email == email) | (models.User.username == username)
        ).first()

        if existing_user:
            if existing_user.email == email:
                raise HTTPException(status_code=422, detail={"email": ["This email already exists."]})
            if existing_user.username == username:
                raise HTTPException(status_code=422, detail={"username": ["This username already exists."]})

        # ✅ Dùng hàm import từ security.py
        hashed_password = get_password_hash(password)

        new_user = models.User(
            email=email,
            username=username,
            password_hash=hashed_password,
            hobbies=""
        )

        db.add(new_user)
        db.commit()
        db.refresh(new_user) # Lấy ID và các giá trị default

        return new_user

    @staticmethod
    def login_user(db: Session, username: str, password: str) -> dict:  # << THAY ĐỔI: Nhận db

        # ✅ Truy vấn user từ DB
        user = db.query(models.User).filter(models.User.username == username).first()

        if not user or not verify_password(password, user.password_hash):
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                                detail="Incorrect username or password.")

        user_id = str(user.id)

        access_token = create_jwt_token(user_id, token_type="access")
        refresh_token = create_jwt_token(user_id, token_type="refresh")

        # ✅ Lưu refresh token vào DB
        # 1. Lấy giờ UTC "aware"
        aware_now = datetime.now(UTC)
        # 2. Bỏ timezone đi để thành "naive"
        naive_now = aware_now.replace(tzinfo=None)

        expires_at = naive_now + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)

        db_token = models.RefreshToken(
            token=refresh_token,
            user_id=user.id,
            expired_at=expires_at
        )
        db.add(db_token)
        db.commit()

        return {
            "access_token": access_token,
            "refresh_token": refresh_token
        }

    # ==========================
    # 🔁 REFRESH ACCESS TOKEN
    # ==========================
    @staticmethod
    def refresh_access_token(db: Session, refresh_token: str) -> dict:  # << THAY ĐỔI: Nhận db
        try:
            payload = decode_jwt_token(refresh_token)
            if payload.get("type") != "refresh":
                raise HTTPException(status_code=401, detail="Token is not a refresh token.")
        except ExpiredSignatureError:
            raise HTTPException(status_code=401, detail="Refresh token has expired.")
        except JWTError:
            raise HTTPException(status_code=401, detail="Invalid refresh token.")

        user_id = str(payload.get("sub"))

        # ✅ Kiểm tra refresh token trong DB
        db_token = db.query(models.RefreshToken).filter(
            models.RefreshToken.token == refresh_token
        ).first()

        if not db_token:
            raise HTTPException(status_code=401, detail="Invalid refresh token (not found).")

        # Lấy giờ UTC "naive" (bằng cách bỏ timezone)
        current_time_naive_utc = datetime.now(UTC).replace(tzinfo=None)
        if db_token.expired_at < current_time_naive_utc:
            raise HTTPException(status_code=401, detail="Refresh token has expired (in DB).")

        if str(db_token.user_id) != user_id:
            raise HTTPException(status_code=401, detail="Token does not match the user.")

        # ✅ Tạo access token mới
        new_access_token = create_jwt_token(user_id, token_type="access")

        return {"access_token": new_access_token}

    @staticmethod
    def logout_user(db: Session, refresh_token: str) -> bool:
        """
        Xóa Refresh Token khỏi DB để vô hiệu hóa nó.
        """
        try:
            payload = decode_jwt_token(refresh_token)

            if payload is None:
                return True

            if payload.get("type") != "refresh":
                # Nếu không phải refresh token, token này không phải là token mà
                # hệ thống dùng để refresh, ta vẫn coi như đã hoàn thành việc logout.
                # Tuy nhiên, nếu bạn muốn nghiêm ngặt, có thể raise lỗi 401:
                # raise HTTPException(status_code=401, detail="Invalid token type.")
                pass  # Vẫn tiếp tục xóa, chỉ dựa vào token string

        except ExpiredSignatureError:
            # Token hết hạn -> đã vô hiệu hóa -> coi như đã logout thành công
            return True
        except JWTError:
            # Token không hợp lệ -> đã vô hiệu hóa -> coi như đã logout thành công
            return True

        # ✅ Tìm và xóa Refresh Token khỏi DB
        db_token = db.query(models.RefreshToken).filter(
            models.RefreshToken.token == refresh_token
        ).first()

        if db_token:
            db.delete(db_token)
            db.commit()
            return True

        # Trả về True ngay cả khi không tìm thấy, vì mục tiêu là "đảm bảo token không còn hiệu lực"
        # Nếu token không tồn tại trong DB, nó đã vô hiệu hóa (logout) rồi.
        return True