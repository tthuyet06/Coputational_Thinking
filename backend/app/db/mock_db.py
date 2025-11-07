from typing import List, Dict, Any
from passlib.context import CryptContext

# Dùng chung passlib context
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

# =========================
# KHO USERS
# =========================
# Chúng ta mã hóa mật khẩu ngay từ đầu để mock cho thật
# "password123" -> $argon2id$v=19$m=65536,t=3,p=4$...
# "password456" -> $argon2id$v=19$m=65536,t=3,p=4$...
MOCK_USERS_DB: List[Dict[str, Any]] = [
    {
        "id": 1,
        "email": "user1@example.com",
        "username": "User Mot",
        "password": pwd_context.hash("password123"),
        "hobbies": ["#cafe", "#yen_tinh"],
        "favorites": [101], # ID từ MOCK_PLACES_DB
    },
    {
        "id": 2,
        "email": "user2@example.com",
        "username": "User Hai",
        "password": pwd_context.hash("password456"),
        "hobbies": ["#song_ao", "#vai_tieng"],
        "favorites": [],
    }
]

# =========================
# KHO TOKENS
# =========================
# Khi user login, token sẽ được thêm vào đây
MOCK_ACCESS_TOKENS: Dict[str, str] = {
    # map access_token -> email
    "access_for_user1@example.com": "user1@example.com",
    "access_for_user2@example.com": "user2@example.com"
}

MOCK_REFRESH_TOKENS: Dict[str, str] = {
    # map refresh_token -> email
    "refresh_for_user1@example.com": "user1@example.com",
    "refresh_for_user2@example.com": "user2@example.com"
}


# =========================
# KHO PLACES
# =========================
# Lấy từ user_service.py và recommend.py gộp lại
MOCK_PLACES_DB: List[Dict[str, Any]] = [
    {
        "id": 101,
        "name": "Bảo tàng Chứng tích Chiến tranh",
        "address": "28 Võ Văn Tần, Quận 3",
        "image_url": "https://link-to-image.png",
        "description": "Nơi lưu giữ tư liệu lịch sử, phù hợp cho buổi chiều tìm hiểu văn hóa.",
        "tags": ["#vai_tieng", "#van_hoa", "#trong_nha"]
    },
    {
        "id": 102,
        "name": "Cà phê Sách XYZ",
        "address": "456 Đường ABC, Quận 1",
        "image_url": "https://link-to-image2.png",
        "description": "Quán cà phê yên tĩnh với decor cổ điển, lý tưởng để đọc sách.",
        "tags": ["#vai_tieng", "#cafe", "#yen_tinh"]
    },
    {
        "id": 103,
        "name": "Phố đi bộ Nguyễn Huệ",
        "address": "Nguyễn Huệ, Quận 1",
        "image_url": "https://link-to-image3.png",
        "description": "Địa điểm vui chơi sôi động, phù hợp dạo phố buổi tối.",
        "tags": ["#toi", "#soi_dong", "#ngoai_troi"]
    }
]