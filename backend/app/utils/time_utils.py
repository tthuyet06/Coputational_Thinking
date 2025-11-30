from datetime import datetime, timezone
import pytz

def get_current_hour(tz_name: str = "Asia/Ho_Chi_Minh") -> int:
    """
    Trả về số giờ hiện tại (0–23) theo timezone.
    """
    try:
        tz = pytz.timezone(tz_name)
        now = datetime.now(tz)
        return now.hour
    except Exception:
        # fallback về UTC chuẩn (aware datetime)
        return datetime.now(timezone.utc).hour