from __future__ import annotations

from dataclasses import dataclass, field
from typing import List
from uuid import UUID

@dataclass
class User:
    id: UUID
    email: str
    username: str
    hobbies: List[str] = field(default_factory=list)

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
