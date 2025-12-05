import datetime
from datetime import date

def get_current_hour(tz_name: str = "Asia/Ho_Chi_Minh") -> float:
    """Trả về số giờ hiện tại (0–23) theo timezone."""
    now = datetime.datetime.now()

    hours = now.hour
    minutes = now.minute

    return hours + float(minutes / 60)

def to_decimal_hours(time_str: str) -> float:
    try:
        hours_str, minutes_str = time_str.split(':')

        hours = int(hours_str)
        minutes = int(minutes_str)

        if 0 <= minutes < 60 and 0 <= hours <= 23:
            return hours + float(minutes / 60)

        else:
            raise ValueError("Invalid time_str. 0 <= hours <= 23, 0 <= minutes < 60")

    except ValueError:
        raise ValueError("Invalid format. True format is hh:mm")


def format_decimal_hours(decimal_time: float) -> str:
    if decimal_time >= 24:
        raise ValueError("Invalid decimal_time. 0 <= decimal_time < 24")

    hours = int(decimal_time)
    minutes = int((decimal_time - hours) * 60)

    return f"{hours:02d}:{minutes:02d}"


def get_week_day() -> int:
    """t2 - cn: 0 - 6"""
    return date.today().weekday() + 1