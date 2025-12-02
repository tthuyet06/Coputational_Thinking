from __future__ import annotations

from dataclasses import dataclass, field
from typing import List
from uuid import UUID
from backend.app.domain.history import History

@dataclass
class User:
    id: UUID
    email: str
    username: str
    hobbies: List[str] = field(default_factory=list)
    history: List[History] | None = None

    def set_hobbies(self, new_hobbies: List[str]) -> None:
        seen = set()
        cleaned: list[str] = []
        for h in new_hobbies:
            h_norm = h.strip()
            if not h_norm or h_norm in seen:
                continue
            seen.add(h_norm)
            cleaned.append(h_norm)
        self.hobbies = cleaned

    def has_hobby(self, tag: str) -> bool:
        """
        Kiểm tra user có sở thích với tag này không
        (so sánh dạng lowercase, bỏ khoảng trắng).
        """
        t = tag.strip().lower()
        return any(h.strip().lower() == t for h in self.hobbies)


    def update_history(self, place_id: int):
        for h in self.history:
            if h.place_id == place_id:
                h.update_rec_counter()
                return

        # nếu chưa tồn tại place_id thì thêm vào với reco_count: 0->7
        self.history.append(History(place_id=place_id,reco_count=7))


    def get_reco_count_by_place_id(self, place_id: int) -> int:
        for h in self.history:
            if h.place_id == place_id:
                return h.reco_count

        return 0