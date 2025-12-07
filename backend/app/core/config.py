# config.py

# ==========================
# 🔑 JWT CONFIGURATION
# ==========================
# Khóa bí mật dùng để ký token
SECRET_KEY = "super_secret_key"

# Thuật toán mã hóa
ALGORITHM = "HS256"

# Thời gian hết hạn của Access Token (phút)
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Thời gian hết hạn của Refresh Token (ngày)
REFRESH_TOKEN_EXPIRE_DAYS = 1

# ==========================
# 🔒 PASSWORD HASHING CONFIG (Nếu cần)
# ==========================

# ==========================
# ☁️ OPENWEATHER CONFIG
# ==========================
OPENWEATHER_API_KEY = "2ab54102a7b4fcd1c91f89a1fae1e132"

# ==========================
# 🚗 OSRM CONFIG (Thay cho Google Maps)
# ==========================
# Sử dụng server public demo của OSRM
OSRM_API_URL = "http://router.project-osrm.org/route/v1/driving"