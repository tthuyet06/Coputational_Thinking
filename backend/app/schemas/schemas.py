from typing import List, Optional
from pydantic import BaseModel, EmailStr, field_validator
from uuid import UUID
from backend.app.utils.tag_parser import parse_comma_separated_string

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    username: str
    hobbies: Optional[List[str]] = []


class UserResponse(BaseModel):
    id: UUID
    email: EmailStr
    username: str
    hobbies: Optional[List[str]] = []

    class Config:
        from_attributes = True


class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    access_token: str
    refresh_token: str


class RefreshRequest(BaseModel):
    refresh_token: str


class RefreshResponse(BaseModel):
    access_token: str


class UpdateHobbiesRequest(BaseModel):
    hobbies: List[str]


class UpdateHobbiesResponse(BaseModel):
    message: str
    hobbies: List[str]

class HobbyItem(BaseModel):
    id: int
    tag: str
    name: str

    class Config:
        from_attributes = True

class HobbyTagsResponse(BaseModel):
    hobbies: List[HobbyItem]

class DurationTag(BaseModel):
    display_name: str
    tag_id: str


class DurationTagResponse(BaseModel):
    duration_tags: List[DurationTag]


class RecommendationRequest(BaseModel):
    latitude: float
    longitude: float
    duration_tag: str
    hobby: List[str] | None = None
    activity: List[str] | None = None

class RecommendationErrorResponse(BaseModel):
    error: str

class Place(BaseModel):
    favorite: bool
    id: int
    name: str
    address: str
    image: Optional[str] = None
    overview: Optional[str] = None
    summarization: Optional[str] = None 
    tags: List[str] = []
    rating: Optional[float] = None
    open: Optional[str] = None

    @field_validator('tags', mode='before')
    @classmethod
    def convert_tags(cls, v):
        # Gọi hàm xử lý từ file tag_parser.py
        return parse_comma_separated_string(v)

    class Config:
        from_attributes = True


class RecommendationResponse(BaseModel):
    recommendations: List[Place]


class FavoriteRequest(BaseModel):
    place_id: int


class UpdateUserRequest(BaseModel):
    username: str


class UpdateActivitiesRequest(BaseModel):
    """Request khi user muốn cập nhật activity của mình"""
    activities: List[str]  # list code activity


class UpdateActivitiesResponse(BaseModel):
    """Response sau khi cập nhật activity"""
    message: str
    activities: List[str]  # list code activity đã chuẩn hóa


class ActivityItem(BaseModel):
    """Thông tin chi tiết 1 activity, cấu trúc giống HobbyItem"""
    id: int
    tag: str  # Đổi tên từ 'code' sang 'tag' để đồng nhất với Hobby
    name: str

    class Config:
        from_attributes = True

class ActivityCodesResponse(BaseModel):
    activities: List[str]

class ActivityTagsResponse(BaseModel):
    activities: List[ActivityItem]
