# backend/app/domain/location.py
from dataclasses import dataclass


@dataclass(frozen=True)
class Location:
    """
    Vị trí địa lý cơ bản: latitude, longitude.
    Dùng cho input của recommend engine.
    """
    latitude: float
    longitude: float
