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

from distance_service import calculate_osrm_distance
import sys
import asyncio
import time
import os

# Cấu hình path và import
# Đảm bảo import hàm mới, giả sử nó nằm trong distance_service.py
# (Bạn cần điều chỉnh import path cho đúng với cấu trúc thư mục của mình)
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))
# Giả sử hàm calculate_osrm_distance nằm trong distance_service
# Bạn có thể cần điều chỉnh dòng import này
from distance_service import calculate_osrm_distance
import sys
import asyncio
import time
import os

# ... (Phần import giữ nguyên) ...

# Thiết lập giới hạn
# Ví dụ: Giới hạn chỉ 3 yêu cầu chạy đồng thời một lúc
CONCURRENT_LIMIT = 3
# Khởi tạo Semaphore
semaphore = asyncio.Semaphore(CONCURRENT_LIMIT)


# --- CODE KIỂM THỬ MỚI VỚI SEMAPHORE ---

async def call_osrm_with_limit(lat_origin, lon_origin, lat_dest, lon_dest):
    # Dùng 'async with semaphore:' để giới hạn
    async with semaphore:
        # Code chỉ chạy khi có "slot" trống trong semaphore
        result = await calculate_osrm_distance(
            lat_origin=lat_origin,
            lon_origin=lon_origin,
            lat_dest=lat_dest,
            lon_dest=lon_dest
        )
        return result


async def run_concurrent_tests():
    tasks = []

    # Tạo 10 tác vụ, mỗi tác vụ đều được bọc bởi hàm giới hạn
    for i in range(0, 10):
        task = call_osrm_with_limit(10, 100, 11, 101)
        tasks.append(task)

    print(f"Bắt đầu chạy {len(tasks)} yêu cầu OSRM với giới hạn {CONCURRENT_LIMIT} đồng thời...")
    start_time = time.time()
    # Chạy tất cả các tác vụ
    results = await asyncio.gather(*tasks)
    end_time = time.time()

    # In kết quả
    # for result in results:
        # print(result)

    total_time = end_time - start_time
    print(f"\n✅ TỔNG THỜI GIAN CHẠY {len(tasks)} LẦN: {total_time:.3f} giây\n")


if __name__ == "__main__":
    asyncio.run(run_concurrent_tests())