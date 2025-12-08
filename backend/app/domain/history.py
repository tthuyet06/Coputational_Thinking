#backend/app/domain/history.py
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone

def get_naive_utc7_now():
    utc_plus_7 = timezone(timedelta(hours=7))
    return datetime.now(utc_plus_7).replace(tzinfo=None)

@dataclass
class History:
    place_id: int | None = None
    reco_count: int | None = None # chạy từ 7- 0 rồi nhảy đến 7
    time: datetime = field(default_factory=get_naive_utc7_now)

    def update_rec_counter(self):
        if self.reco_count == 0:
            self.reco_count = 7
            return

        self.reco_count -= 1

        self.time = get_naive_utc7_now()