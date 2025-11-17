from backend.app.domain.user import Hobbies
# backend/app/domain/user_tag.py
from dataclasses import dataclass
from uuid import UUID


@dataclass(frozen=True)
class UserTag:
    user_id: UUID
    tag_id: str
