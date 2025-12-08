import sys
import os
from typing import List, Any
from dataclasses import dataclass

# =========================================================
# PHẦN 1: SỬA LỖI ĐƯỜNG DẪN (BẮT BUỘC Ở DÒNG ĐẦU TIÊN)
# =========================================================
# current_dir là 'backend/app/tests/'
current_dir = os.path.dirname(os.path.abspath(__file__))

# Đi ngược lại BA cấp để đến thư mục gốc của dự án (Computonal_Thinking)
project_root = os.path.abspath(os.path.join(current_dir, "..", "..", ".."))

if project_root not in sys.path:
    sys.path.append(project_root)

# =========================================================
# PHẦN 2: CÁC LỆNH IMPORT CHÍNH (Sau khi sys.path đã được sửa)
# =========================================================

# Sửa lỗi ModuleNotFoundError: Sử dụng db_connection.py
from backend.app.db.db_connection import SessionLocal

# Import Repository (Giữ lại để khởi tạo)
from backend.app.repositories.place_repository import PlaceRepository
from backend.app.repositories.tag_repository import TagRepositoryImpl
from backend.app.utils.geo_utils import haversine_distance

# **QUAN TRỌNG:** Import hàm _recommend_core từ engine mới
from backend.app.services.recommend_engine_for_test import (
    _recommend_core,
    # Cần thêm các hàm con được sử dụng trong _recommend_core
    # Nếu không, bạn sẽ gặp lỗi NameError
)


# =========================================================
# PHẦN 3: MOCK DATA (Giữ nguyên)
# =========================================================


@dataclass
class MockLocation:
    latitude: float
    longitude: float


@dataclass
class MockUser:
    id: int
    hobbies: List[str] | None = None

    # Sử dụng @staticmethod để loại bỏ cảnh báo (như đã sửa ở lần trước)
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
# PHẦN 4: HÀM TEST VỚI DỮ LIỆU DB THẬT ĐÃ CHỈNH SỬA
# =========================================================

# SỬA LẠI KHỐI NÀY TRONG FILE test_recommendation.py

def test_db_driven_recommendation():
    """
    Test quy trình gợi ý sử dụng dữ liệu thật từ DB bằng hàm _recommend_core.
    Kiểm tra chức năng trả về Top N.
    """
    print("--- Bắt đầu Test Gợi ý với Dữ liệu DB Thật (Dùng _recommend_core) ---")

    # 1. KHỞI TẠO DB SESSION
    db: SessionLocal | None = None
    try:
        db = SessionLocal()

        # 2. CẤU HÌNH N VÀ CRITERIA
        user_location = MockLocation(latitude=10.7750, longitude=106.6950)
        mock_criteria = MockCriteria(
            location=user_location,
            duration_tag="#long_time",
            activities=["#movie"],
            extra_tags=["#music"]
        )
        mock_user = MockUser(id=1, hobbies=mock_criteria.extra_tags)

        # 3. THỰC HIỆN GỢI Ý (Truyền tham số n_results)
        # scored_places là List[tuple[float, float, DomainPlace]]
        scored_places = _recommend_core(db, mock_user, mock_criteria,)

        if not scored_places:
            print("❌ Lỗi: Không có gợi ý nào được tìm thấy. Kiểm tra logic lọc trong _recommend_core.")
            return

        print(f"✅ Đã nhận thành công Top {len(scored_places)} địa điểm được gợi ý từ _recommend_core.")

        # 4. IN KẾT QUẢ ĐÃ SẮP XẾP
        print(f"\n--- KẾT QUẢ GỢI Ý TOP {len(scored_places)} (Từ _recommend_core) ---")

        for i, scored_tuple in enumerate(scored_places):
            total_score, distance, place = scored_tuple

            print(f" Top {i + 1}🥇")
            print(f"  Total Score: {total_score:.4f} ✨")
            print(f"  Haversine Distance: {distance:.2f} km 🧭")
            print(f"  Tên: {place.name} 🏠")
            print(f"  ID: {place.id} 🆔")
            print(f"  Rating: {place.rating}/5.0 ⭐")
            print(f"  Tags: {place.tags} 🏷️")
            print(f"  Địa chỉ: {place.address} 📍")
            print("---------------------------------------")

    finally:
        if db:
            db.close()


if __name__ == "__main__":
    test_db_driven_recommendation()