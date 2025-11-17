# backend/app/domain/place_tag.py
from dataclasses import dataclass


@dataclass(frozen=True)
class PlaceTag:
    place_id: int
    tag_id: str
