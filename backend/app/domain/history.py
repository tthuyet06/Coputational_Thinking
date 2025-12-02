#backend/app/domain/history.py
from dataclasses import dataclass

@dataclass
class History:
    place_id: int | None = None
    reco_count: int | None = None # chạy từ 7- 0 rồi nhảy đến 7

    def update_rec_counter(self):
        if self.reco_count == 0:
            self.reco_count = 7
            return

        self.reco_count -= 1