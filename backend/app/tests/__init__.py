import sys
import os

# =========================================================
# KHẮC PHỤC LỖI IMPORT CHO PYTEST
# =========================================================

# Vị trí hiện tại: backend/app/tests/
current_dir = os.path.dirname(os.path.abspath(__file__))

# Đi ngược lại 3 cấp để đến thư mục gốc của dự án (Computonal_Thinking)
# tests/ -> app/ -> backend/ -> Computonal_Thinking/
project_root = os.path.abspath(os.path.join(current_dir, "..", "..", ".."))

if project_root not in sys.path:
    sys.path.append(project_root)

# =========================================================
# KHỐI IMPORT NỘI BỘ (NẾU CẦN)
# =========================================================

# Bây giờ, các lệnh import nội bộ sẽ hoạt động vì project_root đã được thêm
# Ví dụ, nếu bạn cần import Recommendation:
# from backend.app.services.recommend_engine import Recommendation