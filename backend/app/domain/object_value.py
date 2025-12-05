from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class OpeningRange:
    """
    Value Object đại diện cho một khung giờ mở cửa trong tuần.

    day_of_week: 0 = Monday, 6 = Sunday
    open_time, close_time: format 'HH:MM' (24h)
    """
    day_of_week: int
    open_time: str   # '08:00'
    close_time: str  # '17:00'


@dataclass(frozen=True)
class SpecialOpeningRuleDomain:
    """
    Value Object đại diện quy tắc mở cửa đặc biệt.

    rule_type:
        - 'yearly' : lặp lại hằng năm (không cần year)
        - 'date'   : chỉ áp dụng cho một ngày cụ thể (có year)

    Ví dụ:
        yearly:  month=1, day=1  ->  Tết dương lịch hằng năm
        date:    year=2025, month=12, day=20 -> Event 1 lần
    """
    rule_type: str              # 'yearly' | 'date'
    month: int
    day: int
    year: int | None = None     # chỉ dùng khi rule_type='date'
    open_time: str | None = None
    close_time: str | None = None
    is_closed: bool = False     # True = đóng cả ngày