from __future__ import annotations

from dataclasses import dataclass


@dataclass
class Activity:
    """
    Thực thể Activity ở tầng domain.

    Dùng để mô tả loại hình địa điểm / hoạt động:
    ví dụ: cafe, food, milktea, park, cinema, ...
    """
    id: int
    code: str      # code nội bộ, duy nhất: "cafe", "food", "milktea", ...
    name: str