import sys
import os
from pathlib import Path
from typing import List, Any
from dataclasses import dataclass

# =========================================================
# PHẦN 1: SỬA LỖI ĐƯỜNG DẪN (BẮT BUỘC Ở DÒNG ĐẦU TIÊN)
# =========================================================

# current_dir là 'backend/app/tests/'
try:
    # Bình thường __file__ tồn tại
    current_dir = Path(__file__).resolve().parent
except NameError:
    # Khi chạy trực tiếp (ví dụ PyCharm “Run File”) __file__ bị mất
    current_dir = Path().resolve()

# Đi ngược lại BA cấp để đến thư mục gốc Computonal_Thinking
project_root = current_dir.parent.parent.parent

if str(project_root) not in sys.path:
    sys.path.append(str(project_root))

# =========================================================
# PHẦN 2: IMPORT MODULE
# =========================================================

from backend.app.db.db_connection import SessionLocal
from backend.app.repositories.place_repository import PlaceRepository
from backend.app.repositories.tag_repository import TagRepositoryImpl
from backend.app.utils.geo_utils import haversine_distance

from backend.app.services.recommend_engine_for_test import (
    _recommend_core,
)

# =========================================================
# PHẦN 3: MOCK DATA
# =========================================================

@dataclass
class MockLocation:
    latitude: float
    longitude: float

@dataclass
class MockUser:
    id: int
    hobbies: List[str] | None = None

    @staticmethod
    def get_reco_count_by_place_id(place_id: int) -> int:
        return 2

    def update_history(self, place_id: int):
        pass


@dataclass
class MockCriteria:
    location: MockLocation
    duration_tag: str
    activities: List[str]
    extra_tags: List[str] | None = None


# =========================================================
# PHẦN 4: HÀM TEST
# =========================================================

def test_db_driven_recommendation():
    """
    Test gợi ý dùng dữ liệu thật từ DB.
    """
    print("--- Bắt đầu Test Gợi ý với Dữ liệu DB Thật (_recommend_core) ---")

    db: SessionLocal | None = None
    try:
        db = SessionLocal()

        # TEST INPUT
        user_location = MockLocation(latitude=10.7750, longitude=106.6950)
        mock_criteria = MockCriteria(
            location=user_location,
            duration_tag="#few_hours",
            activities=["#cafe"],
            extra_tags=["#chill"]
        )
        mock_user = MockUser(id=1, hobbies=mock_criteria.extra_tags)

        # GỌI HÀM TÍNH
        scored_places = _recommend_core(db, mock_user, mock_criteria, 2)
        # scored_places = _recommend_core(db, mock_user, mock_criteria)

        if not scored_places:
            print("❌ Không tìm thấy gợi ý nào. Kiểm tra logic trong _recommend_core.")
            return

        print(f"✅ Nhận Top {len(scored_places)} địa điểm từ _recommend_core.\n")

        print(f"--- KẾT QUẢ GỢI Ý TOP {len(scored_places)} ---")
        for i, (total_score, distance, place) in enumerate(scored_places):
        # for place in enumerate(scored_places):
            print(f" Top {i + 1}🥇")
            print(f"  Total Score: {total_score:.4f} ✨")
            print(f"  Distance: {distance:.2f} km 🧭")
            print(f"  Tên: {place.name} 🏠")
            print(f"  ID: {place.id} 🆔")
            print(f"  Rating: {place.rating}/5 ⭐")
            print(f"  Tags: {place.tags} 🏷️")
            print(f"  Địa chỉ: {place.address} 📍")
            print("---------------------------------------")

    finally:
        if db:
            db.close()


# =========================================================
# PHẦN 5: ENTRY POINT
# =========================================================

if __name__ == "__main__":
    test_db_driven_recommendation()