import uuid
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError, ExpiredSignatureError
from sqlalchemy.orm import Session

from backend.app.core.config import SECRET_KEY, ALGORITHM
from backend.app.db.deps import get_db
from backend.app.db import models



security = HTTPBearer()


def get_current_user(
        creds: HTTPAuthorizationCredentials = Depends(security),
        db: Session = Depends(get_db)  # << MỚI: Inject DB session
) -> models.User:  # << MỚI: Trả về một object models.User
    """
    Dependency dùng để xác thực người dùng qua JWT (Bearer token).

    - FastAPI tự động gọi `Depends(security)` để kiểm tra header Authorization.
    - Token hợp lệ => decode lấy user_id (sub) => tìm user trong DB.
    """
    token = creds.credentials

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id_str: str = payload.get("sub")

        if not user_id_str:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token không chứa thông tin người dùng hợp lệ."
            )

        try:
            # ✅ Chuyển 'sub' (vốn là string) sang int
            user_id_uuid = uuid.UUID(user_id_str)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token không hợp lệ (user id)."
            )

        # ✅ Tìm user theo id bằng SQLAlchemy
        user = db.query(models.User).filter(models.User.id == user_id_uuid).first()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Người dùng không tồn tại hoặc đã bị xóa."
            )

        return user  # Trả về object User của SQLAlchemy

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