from typing import List, Optional
from fastapi import FastAPI
from pydantic import BaseModel, EmailStr
from uuid import UUID

app = FastAPI(title="User Registration & Login API")


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

class HobbyTagsResponse(BaseModel):
    tags: List[str]


class DurationTag(BaseModel):
    display_name: str
    tag_id: str


class DurationTagResponse(BaseModel):
    duration_tags: List[DurationTag]


class RecommendRequest(BaseModel):
    latitude: float
    longitude: float
    duration_tag: str


class Place(BaseModel):
    id: int
    name: str
    address: str
    image_url: str
    description: str
    tags: List[str]


class RecommendResponse(BaseModel):
    recommendations: List[Place]


class FavoriteRequest(BaseModel):
    place_id: int


class UpdateUserRequest(BaseModel):
    username: str



