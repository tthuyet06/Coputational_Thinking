import math

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Tính khoảng cách "đường chim bay" giữa hai điểm địa lý (tính bằng km).
    Sử dụng công thức Haversine.
    """
    R = 6371  # Bán kính Trái Đất (km)

    # Chuyển đổi từ độ sang radian
    lat1_rad = math.radians(lat1)
    lon1_rad = math.radians(lon1)
    lat2_rad = math.radians(lat2)
    lon2_rad = math.radians(lon2)

    # Chênh lệch vĩ độ và kinh độ
    dlon = lon2_rad - lon1_rad
    dlat = lat2_rad - lat1_rad

    # Áp dụng công thức Haversine
    a = math.sin(dlat / 2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    distance = R * c
    return distance