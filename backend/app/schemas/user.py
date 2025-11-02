from typing import List, Optional
from pydantic import BaseModel, EmailStr

# Requests 
class UserRegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str

class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str

class RefreshTokenRequest(BaseModel):
    refresh_token: str

class UpdateUserRequest(BaseModel):
    full_name: Optional[str]

class UpdateHobbiesRequest(BaseModel):
    hobbies: List[str]

# Responses
class UserResponse(BaseModel):
    id: int
    email: EmailStr
    full_name: str

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str

class MessageHobbiesResponse(BaseModel):
    message: str
    hobbies: List[str]