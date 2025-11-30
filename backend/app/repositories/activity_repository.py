from __future__ import annotations

from typing import List, Optional

from sqlalchemy.orm import Session

from backend.app.domain.activity import Activity
from backend.app.db.models import Activity


class ActivityRepository:
    """
    Repository truy cập dữ liệu Activity bằng SQLAlchemy.

    Tầng service / API sẽ dùng class này để:
    - Lấy danh sách toàn bộ activities (cho user chọn)
    - Lấy activity theo id / code (phục vụ validate, filter, ...)
    """

    def __init__(self, session: Session) -> None:
        self._session = session

    # ----- Helpers nội bộ -----

    @staticmethod
    def _to_domain(orm: Activity) -> Activity:
        """
        Chuyển từ ActivityORM (SQLAlchemy model)
        sang Activity (domain model).
        """
        return Activity(
            id=orm.id,
            code=orm.code,
            name=orm.name,
        )

    # ----- API chính dùng ở service -----

    def list_all(self) -> List[Activity]:
        """
        Trả về toàn bộ activities, sắp xếp theo tên.
        Dùng để render ra frontend cho user chọn.
        """
        records: List[Activity] = (
            self._session.query(Activity)
            .order_by(Activity.label_en.asc())
            .all()
        )
        return [self._to_domain(r) for r in records]

    def get_by_id(self, id: int) -> Optional[Activity]:
        """
        Lấy một Activity theo id. Trả về None nếu không tồn tại.
        """
        orm = self._session.get(Activity, id)
        return self._to_domain(orm) if orm else None

    def get_by_code(self, code: str) -> Optional[Activity]:
        """
        Lấy một Activity theo code (vd: 'cafe', 'food', ...).
        So sánh code theo đúng chuỗi lưu trong DB.
        """
        orm: Optional[Activity] = (
            self._session.query(Activity)
            .filter(Activity.code == code)
            .first()
        )
        return self._to_domain(orm) if orm else None

    # ----- (Tuỳ chọn) hàm seed / upsert cơ bản -----

    def create_if_not_exists(self, code: str, label_en: str) -> Activity:
        """
        Tạo mới một Activity nếu code chưa tồn tại,
        ngược lại trả về Activity hiện có.

        Hữu ích cho bước seed dữ liệu ban đầu.
        """
        existing = self.get_by_code(code)
        if existing:
            return existing

        orm = Activity(code=code, label_en=label_en)
        self._session.add(orm)
        self._session.commit()
        self._session.refresh(orm)
        return self._to_domain(orm)
