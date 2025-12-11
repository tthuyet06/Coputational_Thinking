import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
import uuid  # Cần import uuid để tạo UUID giả lập
from typing import Callable

# Cần đảm bảo các imports này hoạt động (đã khắc phục bằng PYTHONPATH)
from backend.app.main import app
from backend.app.db.db_connection import get_db
from backend.app.core.dependencies import get_current_user
from backend.app.db.models import User  # Giả định models.User là Model SQLAlchemy


# --- 1. FIXTURE DB VÀ USER GIẢ LẬP ---

@pytest.fixture(scope="session")
def mock_db():
    # ... (giữ nguyên MockDB)
    class MockDB:
        def __enter__(self): return self

        def __exit__(self, exc_type, exc_val, exc_tb): pass

        def add(self, *args, **kwargs): pass

        def commit(self): pass

        def refresh(self, *args, **kwargs): pass

        def query(self, *args, **kwargs): return self

        def filter(self, *args, **kwargs): return self

        def first(self, *args, **kwargs): return None

        def all(self, *args, **kwargs): return []

    return MockDB()


# UUID giả lập sẽ được dùng để khớp với UserResponse.id: UUID
MOCK_USER_UUID = uuid.uuid4()


@pytest.fixture(scope="session")
def mock_user() -> User:
    """
    Người dùng giả để kiểm tra các API /me.
    Đã sửa lỗi: Chỉ truyền các cột chính vào constructor và gán giá trị sau.
    """
    # Khởi tạo đối tượng User chỉ với các cột (Column)
    user = User(
        id=MOCK_USER_UUID,
        email="test@example.com",
        username="tester",
        password_hash="mock_hashed_password"  # password_hash là NOT NULL trong models.py
    )

    # Thiết lập các thuộc tính Relationship/Text (hobbies là Text)
    # LƯU Ý: Nếu hobbies là Text (chuỗi tags), bạn phải gán chuỗi, không phải list.
    user.hobbies = ""  # Gán chuỗi rỗng nếu model lưu Text

    # Model User không có cột 'activities'.
    # Thuộc tính 'activities' phải được loại bỏ khỏi constructor và gán.
    # Tuy nhiên, nếu bạn cần nó cho các hàm service, ta có thể mock thêm,
    # nhưng không nên gán trực tiếp lên model nếu nó không tồn tại.

    # Do bạn cần 'activities' trong các test, ta sẽ giả lập nó là một thuộc tính:
    user.activities = []

    return user


# --- 2. FIXTURE CLIENT VÀ OVERRIDE DEPENDENCIES ---

@pytest.fixture(scope="module")
def client(mock_user: User, mock_db: Session):
    """TestClient cho ứng dụng FastAPI, override các dependency chính."""

    # ... (phần override dependencies giữ nguyên)

    def override_get_db():
        try:
            yield mock_db
        finally:
            pass

    def override_get_current_user():
        return mock_user

    original_get_db = app.dependency_overrides.get(get_db)
    original_get_current_user = app.dependency_overrides.get(get_current_user)

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user

    with TestClient(app) as c:
        yield c

    # ... (phần khôi phục dependencies giữ nguyên)
    if original_get_db:
        app.dependency_overrides[get_db] = original_get_db
    else:
        app.dependency_overrides.pop(get_db, None)

    if original_get_current_user:
        app.dependency_overrides[get_current_user] = original_get_current_user
    else:
        app.dependency_overrides.pop(get_current_user, None)