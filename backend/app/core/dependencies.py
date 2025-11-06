from typing import Optional, Dict, Any
from fastapi import HTTPException, status, Depends
# Import các class mới của FastAPI
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from backend.app.db.mock_db import MOCK_USERS_DB, MOCK_ACCESS_TOKENS

security = HTTPBearer()


def get_current_user(creds: HTTPAuthorizationCredentials = Depends(security)) -> Dict[str, Any]:
    """
    Dependency chung (phiên bản dùng HTTPBearer):

    - FastAPI tự động gọi `Depends(security)` trước.
    - `security` sẽ tìm header 'Authorization', kiểm tra 'Bearer'
      và trả về object `creds`.
    - Nếu header sai, FastAPI tự động raise lỗi 401.

    - Logic của chúng ta chỉ cần:
      1. Lấy token từ `creds.credentials`.
      2. Kiểm tra token trong MOCK_ACCESS_TOKENS.
      3. Tìm user trong MOCK_USERS_DB.
    """

    # 'creds.credentials' chính là <token> (FastAPI đã tách)
    token = creds.credentials

    if token not in MOCK_ACCESS_TOKENS:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Access token không hợp lệ hoặc đã hết hạn."
        )

    # Lấy email từ kho token
    email = MOCK_ACCESS_TOKENS[token]

    # Tìm user từ kho user
    user = next((u for u in MOCK_USERS_DB if u["email"] == email), None)

    if not user:
        # User có token hợp lệ nhưng đã bị xóa khỏi DB
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Người dùng không tồn tại."
        )

    return user