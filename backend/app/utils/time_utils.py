import pytz
import math
from pytz import timezone
from datetime import date, time, datetime, timedelta

def get_current_time(tz_name: str = "Asia/Ho_Chi_Minh") -> datetime:
    """Trả về đối tượng datetime có nhận thức về múi giờ (timezone-aware datetime)
    cho múi giờ được chỉ định. Mặc định là "Asia/Ho_Chi_Minh"."""
    try:
        tz = timezone(tz_name)
    except pytz.exceptions.UnknownTimeZoneError:
        print(f"Warning: Timezone '{tz_name}' not found. Using UTC instead.")
        tz = pytz.utc

    now_tz = datetime.now(tz=tz)
    return now_tz

def get_current_hours(tz_name: str = "Asia/Ho_Chi_Minh") -> time:
    """Trả về thời điểm hiện tại (datetime.time) theo timezone được chỉ định.
    Mặc định là "Asia/Ho_Chi_Minh"."""

    try:
        tz = timezone(tz_name)
    except pytz.exceptions.UnknownTimeZoneError:
        # Xử lý nếu tên múi giờ không hợp lệ
        print(f"Warning: Timezone '{tz_name}' not found. Using local time instead.")
        return datetime.now().time()

    now_tz = datetime.now(tz=tz)

    return now_tz.time()

def to_decimal_hours(time_t: time) -> float:
    """Chuyển đổi đối tượng datetime.time thành giá trị số thập phân biểu thị
    tổng số giờ (bao gồm cả phần phút và giây).
    Ví dụ: time(hour=9, minute=30) sẽ trở thành 9.5"""

    hours = time_t.hour
    minutes = time_t.minute
    seconds = time_t.second

    decimal_hours = hours + (minutes / 60.0) + (seconds / 3600.0)

    return decimal_hours


def from_decimal_hours(decimal_hours: float) -> time:
    """Chuyển đổi giá trị số thập phân biểu thị tổng số giờ thành đối tượng datetime.time.
    Ví dụ: 9.5 sẽ trở thành time(hour=9, minute=30)
    Lưu ý: Hàm này chỉ xử lý trong phạm vi 24 giờ (0.0 đến 23.999...).
    Nếu giá trị >= 24.0, nó sẽ lấy phần dư (modulus 24)."""

    normalized_hours = decimal_hours % 24.0

    hours = int(normalized_hours)

    remaining_hours = normalized_hours - hours
    total_minutes = remaining_hours * 60.0

    minutes = int(total_minutes)

    remaining_minutes = total_minutes - minutes
    total_seconds = remaining_minutes * 60.0

    seconds = int(round(total_seconds))

    if seconds == 60:
        seconds = 0
        minutes += 1

    if minutes == 60:
        minutes = 0
        hours += 1

    hours = hours % 24

    return time(hour=hours, minute=minutes, second=seconds)

def sum_of_time(time_1: time, time_2: time) -> time:
    """Tính tổng của hai đối tượng datetime.time (giờ, phút, giây) và trả về
    kết quả dưới dạng đối tượng datetime.time, lấy modulo 24 giờ.

    Ví dụ: time(22, 30) + time(3, 30) -> time(4, 0)"""

    # 1. Chuyển đổi đối tượng time thành timedelta (tổng số giây)
    def time_to_timedelta(t: time) -> timedelta:
        return timedelta(hours=t.hour, minutes=t.minute, seconds=t.second)

    delta_1 = time_to_timedelta(time_1)
    delta_2 = time_to_timedelta(time_2)

    # 2. Tính tổng timedelta
    total_timedelta = delta_1 + delta_2

    # 3. Tính tổng số giây và lấy modulo 24 giờ (86400 giây)
    total_seconds = total_timedelta.total_seconds()
    seconds_in_day = 24 * 60 * 60

    # Số giây còn lại sau khi trừ đi các ngày đã trôi qua
    remainder_seconds = total_seconds % seconds_in_day

    # 4. Chuyển đổi số giây còn lại thành đối tượng datetime.time

    # Tạo một đối tượng timedelta mới từ số giây còn lại
    time_of_day_delta = timedelta(seconds=remainder_seconds)

    # Bắt đầu từ một mốc datetime cố định (ví dụ: 1/1/2000 00:00:00) và cộng timedelta vào.
    # Sau đó, trích xuất phần time.
    dummy_datetime = datetime(2000, 1, 1) + time_of_day_delta

    return dummy_datetime.time()

def combine_date_time(d: date, t: time) -> datetime:
    return datetime.combine(d, t)