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

# Import hàm _recommend_core chính
from backend.app.services.recommend_engine import (
    _recommend_core,
    # Xóa các hàm con không dùng nữa: _score_place, _filter_by_hobby, ...
)


# =========================================================
# PHẦN 3: MOCK DATA (Khắc phục lỗi NameError)
# =========================================================

# Định nghĩa các lớp Domain/Result bị thiếu (dùng cho _recommend_core)
@dataclass
class RecommendationResult:
    places: List[Any]  # Đối tượng trả về của _recommend_core


@dataclass
class MockLocation:
    latitude: float
    longitude: float


@dataclass
class MockUser:  # Đóng vai trò là DomainUser trong hàm _recommend_core
    id: int
    hobbies: List[str] | None = None

    # Hàm mock, giả định giá trị penalty
    def get_reco_count_by_place_id(self, place_id: int) -> int:
        # Giả định người dùng đã xem 2 lần (dùng để test logic penalty)
        return 2

    def update_history(self, place_id: int):
        # Đây là mock, không cần thực hiện
        pass


@dataclass
class MockCriteria:  # Đóng vai trò là RecommendationCriteria trong hàm _recommend_core
    location: MockLocation
    duration_tag: str
    activities: List[str]
    extra_tags: List[str] | None = None


# =========================================================
# PHẦN 4: HÀM TEST VỚI DỮ LIỆU DB THẬT
# =========================================================

def test_db_driven_recommendation():
    """
    Test quy trình gợi ý sử dụng dữ liệu thật từ DB bằng hàm _recommend_core.
    """
    print("--- Bắt đầu Test Gợi ý với Dữ liệu DB Thật (Dùng _recommend_core) ---")

    # 1. KHỞI TẠO DB SESSION
    db: SessionLocal | None = None
    try:
        db = SessionLocal()
        # print("11")
        # Khởi tạo Repository (Không cần thiết cho _recommend_core, nhưng giữ lại nếu cần debug)
        # place_repo = PlaceRepository()
        # tag_repo = TagRepositoryImpl()

        # 2. TẠO CRITERIA VÀ USER (Được sử dụng làm input cho _recommend_core)
        user_location = MockLocation(latitude=10.7750, longitude=106.6950)
        mock_criteria = MockCriteria(
            location=user_location,
            duration_tag="#long_time",
            activities=["#vegetarian", "#food", "#work_cafe"],
            extra_tags=["#coffee", "#chill", "#quiet"]
        )
        mock_user = MockUser(id=1, hobbies=mock_criteria.extra_tags)

        # 3. THỰC HIỆN GỢI Ý BẰNG HÀM TÍCH HỢP _recommend_core
        # Hàm này sẽ tự động lấy dữ liệu từ DB, lọc, tính điểm, và sắp xếp.
        result = _recommend_core(db, mock_user, mock_criteria)
        top_places = result.places

        if not top_places:
            print("❌ Lỗi: Không có gợi ý nào được tìm thấy. Kiểm tra logic lọc trong _recommend_core.")
            return

        print(f"✅ Đã nhận thành công {len(top_places)} địa điểm được gợi ý từ _recommend_core.")

        # 4. IN KẾT QUẢ
        print(f"\n--- KẾT QUẢ GỢI Ý TOP {len(top_places)} (Từ _recommend_core) ---")

        for i, place in enumerate(top_places):

            # LƯU Ý: Điểm số không được trả về bởi _recommend_core, nên ta chỉ in thông tin địa điểm
            print(f"Top {i + 1}")
            print(f"  Tên: {place.name}")
            print(f"  ID: {place.id}")
            print(f"  Tags: {place.tags}")
            print(f"  Địa chỉ: {place.address}")
            print("---")

    finally:
        if db:
            db.close()  # Đảm bảo session DB được đóng


if __name__ == "__main__":
    test_db_driven_recommendation()