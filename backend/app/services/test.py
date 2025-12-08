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

from weather_service import get_main_weather

print(get_main_weather(10, 100))