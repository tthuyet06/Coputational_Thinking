#backend/app/domain/history.py
from dataclasses import dataclass

@dataclass
class History:
    place_id: int | None = None
    reco_count: int | None = None # chạy từ 0-7 rồi về 0

    def update_rec_counter(self):
        if self.reco_count < 7:
            self.reco_count += 1
        else:
            self.reco_count = 0