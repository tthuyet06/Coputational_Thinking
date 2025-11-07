import jwt
from datetime import datetime, timedelta, UTC
from passlib.context import CryptContext
from typing import Dict, Any

# ✅ Import config từ config.py
from backend.app.core.config import (
    SECRET_KEY,
    ALGORITHM,
    ACCESS_TOKEN_EXPIRE_MINUTES,
    REFRESH_TOKEN_EXPIRE_DAYS
)


# ==========================
# 🔒 PASSWORD HASHING
# ==========================
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


# ==========================
# 🔑 JWT TOKEN FUNCTIONS
# ==========================
def create_jwt_token(user_id: str, token_type: str = "access") -> str:
    """Tạo JWT token chứa id (UUID) dựa trên type ('access' hoặc 'refresh')"""
    if token_type == "access":
        # ✅ Dùng biến import từ config.py
        expire = datetime.now(UTC) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    elif token_type == "refresh":
        # ✅ Dùng biến import từ config.py
        expire = datetime.now(UTC) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    else:
        raise ValueError("token_type không hợp lệ")

    payload = {
        "sub": user_id,
        "type": token_type,
        "exp": expire
    }

    # ✅ Dùng biến import từ config.py
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def decode_jwt_token(token: str) -> Dict[str, Any]:
    """Giải mã JWT token và trả về payload."""
    # ✅ Dùng biến import từ config.py
    return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])