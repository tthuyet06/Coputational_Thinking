# domain/place/place_service.py
from __future__ import annotations

from datetime import datetime, time
from typing import Sequence

from backend.app.domain.object_value import OpeningRange, SpecialOpeningRuleDomain


def _parse_time_str(t: str | None) -> time | None:
    """Chuyển 'HH:MM' thành datetime.time.
    Trả về None nếu chuỗi rỗng / None."""
    if not t:
        return None
    t = t.strip()
    if not t:
        return None
    hour, minute = map(int, t.split(":"))
    return time(hour=hour, minute=minute)

def _is_time_in_range(now_t: time, start: time, end: time) -> bool:
    """Kiểm tra now_t có nằm trong khoảng [start, end] hay không.

    - Nếu end >= start: khung giờ trong cùng 1 ngày (vd 08:00–17:00)
    - Nếu end < start: khung giờ qua ngày hôm sau (vd 18:00–02:00)
      => Mở từ start -> 23:59 và 00:00 -> end"""
    if end >= start:
        return start <= now_t <= end
    # trường hợp qua ngày
    return now_t >= start or now_t <= end

# def _match_special_rules_for_date(
#     rules: Sequence[SpecialOpeningRuleDomain],
#     now: datetime,
# ) -> list[SpecialOpeningRuleDomain]:
#     """
#     Lọc ra các special rules áp dụng cho ngày hiện tại.
#
#     - rule_type='date': so khớp đủ (year, month, day)
#     - rule_type='yearly': chỉ so khớp month, day (bỏ qua year)
#     """
#     y, m, d = now.year, now.month, now.day
#
#     matched: list[SpecialOpeningRuleDomain] = []
#     for r in rules:
#         if r.rule_type == "date":
#             if r.year == y and r.month == m and r.day == d:
#                 matched.append(r)
#         elif r.rule_type == "yearly":
#             if r.month == m and r.day == d:
#                 matched.append(r)
#         else:
#             # rule_type lạ -> bỏ qua
#             continue
#     return matched


# def _is_open_by_special_rules(
#     rules_for_today: Sequence[SpecialOpeningRuleDomain],
#     now: datetime,
# ) -> bool:
#     """
#     Xử lý logic mở cửa dựa trên các special rules của ngày hôm nay.
#     ƯU TIÊN special_rules: nếu có bất kỳ rule cho hôm nay thì
#     KHÔNG dùng weekly opening nữa.
#     """
#     if not rules_for_today:
#         # Không có special rule cho hôm nay
#         return False
#
#     now_t = now.time()
#
#     # Nếu tất cả rule đều đánh dấu đóng -> đóng cả ngày
#     if all(r.is_closed for r in rules_for_today):
#         return False
#
#     # Ngược lại: xem các rule mở cửa (is_closed == False)
#     for r in rules_for_today:
#         if r.is_closed:
#             continue
#         start = _parse_time_str(r.open_time)
#         end = _parse_time_str(r.close_time)
#         if not start or not end:
#             # Rule không đầy đủ giờ -> bỏ qua
#             continue
#         if _is_time_in_range(now_t, start, end):
#             return True
#
#     # Có rule nhưng không trùng khung giờ hiện tại
#     return False


def _is_open_by_weekly(
    weekly_ranges: Sequence[OpeningRange],
    now: datetime,
) -> bool:
    """Xử lý logic mở cửa theo các khung giờ lặp lại trong tuần (OpeningRange)."""
    weekday = now.weekday()  # Monday=0 ... Sunday=6
    today_ranges = [r for r in weekly_ranges if r.day_of_week == weekday]

    if not today_ranges:
        # Hôm nay không có khung giờ mở
        return False

    now_t = now.time()

    for r in today_ranges:
        start = _parse_time_str(r.open_time)
        end = _parse_time_str(r.close_time)
        if not start or not end:
            continue
        if _is_time_in_range(now_t, start, end):
            return True

    return False


def is_open_at(
    weekly_ranges: Sequence[OpeningRange],
    # special_rules: Sequence[SpecialOpeningRuleDomain],
    at: datetime,
) -> bool:
    """
    Hàm domain chính: kiểm tra một địa điểm có đang mở tại thời điểm `at` không.

    ƯU TIÊN:
    1. Nếu có special rule (ngày lễ / event) cho hôm đó:
       - Nếu tất cả is_closed=True => đóng
       - Nếu có rule mở cửa => dùng các khung giờ này
    2. Nếu không có special rule:
       - Dùng weekly_ranges (theo day_of_week)
    """
    # 1. Xử lý special rules cho ngày hiện tại
    # today_special_rules = _match_special_rules_for_date(special_rules, at)
    # if today_special_rules:
        # return _is_open_by_special_rules(today_special_rules, at)

    # 2. Không có special rule -> fallback qua weekly opening
    return _is_open_by_weekly(weekly_ranges, at)


def is_open_now(
    weekly_ranges: Sequence[OpeningRange],
    # special_rules: Sequence[SpecialOpeningRuleDomain],
    now: datetime | None = None,
) -> bool:
    """
    Wrapper tiện dụng: dùng thời gian hiện tại (datetime.now())
    để kiểm tra địa điểm có đang mở không.
    """
    if now is None:
        now = datetime.now()
    return is_open_at(weekly_ranges, now)