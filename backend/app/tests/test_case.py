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
    duration_tag: str | None = None
    activities: List[str] | None = None
    extra_tags: List[str] | None = None


# Sửa lỗi: Cần import field từ dataclasses
from dataclasses import field


@dataclass
class TestCase:
    test_case_name: str
    criteria: MockCriteria
    # User mặc định sẽ sử dụng hobbies từ criteria nếu không được cung cấp rõ ràng
    user: MockUser


# =========================================================
# PHẦN 4: HÀM TEST (ĐÃ SỬA LỖI SYNTAX)
# =========================================================

def run_test_case(testcase: TestCase, n_results: int = 2):
    print(f"--- Bắt đầu Test Gợi ý với Dữ liệu Thật từ thông tin của test case: {testcase.test_case_name} ---")

    # 1. KHỞI TẠO DB SESSION
    db: SessionLocal | None = None
    try:  # <--- Bắt đầu khối TRY
        db = SessionLocal()

        # scored_places là List[tuple[float, float, DomainPlace]]
        # Truyền tham số n_results để giới hạn kết quả
        scored_places = _recommend_core(db, testcase.user, testcase.criteria, n_results=n_results)

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
            print(f"  Distance: {distance:.2f} km 🧭")
            print(f"  Tên: {place.name} 🏠")
            print(f"  ID: {place.id} 🆔")
            print(f"  Rating: {place.rating}/5.0 ⭐")
            print(f"  Tags: {place.tags} 🏷️")
            print(f"  Địa chỉ: {place.address} 📍")
            print("---------------------------------------")

    finally:  # <--- Thêm khối FINALLY để đóng DB Session (Fix SyntaxError)
        if db:
            db.close()


# =========================================================
# PHẦN 5: CHẠY TEST (ĐÃ SỬA LỖI NAMEERROR)
# =========================================================

if __name__ == "__main__":
    # Định nghĩa criteria trước để có thể dùng hobbies cho user
    criteria_1 = MockCriteria(location=MockLocation(latitude=10.7750, longitude=106.6950), duration_tag="#long_time", activities=[], extra_tags=[])
    testcase_1 = TestCase(test_case_name="Test 1: ",criteria=criteria_1, user=MockUser(id=1, hobbies=criteria_1.extra_tags))

    criteria_2 = MockCriteria(location=MockLocation(latitude=10.753467149192835, longitude=106.65386489099524), duration_tag="#")
    testcase_2 = TestCase(test_case_name="Test 2:")

    run_test_case(testcase_1)  # Giới hạn kết quả để dễ xem hơn