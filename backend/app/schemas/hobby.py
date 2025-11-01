from typing import List
from pydantic import BaseModel

class HobbyTagResponse(BaseModel):
    tags: List[str]

class DurationTag(BaseModel):
    display_name: str
    tag_id: str

class DurationTagsResponse(BaseModel):
    duration_tags: List[DurationTag]