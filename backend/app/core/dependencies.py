from typing import Dict, Any
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError, ExpiredSignatureError
from backend.app.services.auth_service import SECRET_KEY, ALGORITHM
from backend.app.db.mock_db import MOCK_USERS_DB


security = HTTPBearer()


def get_current_user(creds: HTTPAuthorizationCredentials = Depends(security)) -> Dict[str, Any]:
    """
    Dependency dùng để xác thực người dùng qua JWT (Bearer token).

    - FastAPI tự động gọi `Depends(security)` để kiểm tra header Authorization.
    - Token hợp lệ => decode lấy user_id (sub) => tìm user trong DB.
    """
    token = creds.credentials

    try:
        # Giải mã token JWT
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")

        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token không chứa thông tin người dùng hợp lệ."
            )

        # Tìm user theo id trong mock DB
        user = next((u for u in MOCK_USERS_DB if str(u["id"]) == user_id), None)

        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Người dùng không tồn tại hoặc đã bị xóa."
            )

        return user

    except ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token đã hết hạn, vui lòng đăng nhập lại."
        )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token không hợp lệ."
        )
