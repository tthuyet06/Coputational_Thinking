from fastapi import APIRouter
from starlette import status
from backend.app.schemas.schemas import (RegisterRequest, LoginRequest, UserResponse,
                    LoginResponse, RefreshRequest, RefreshResponse)
from backend.app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])
auth_service = AuthService()


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user: RegisterRequest):
    new_user = auth_service.register_user(
        email=user.email,
        username=user.username,
        password=user.password
    )

    return UserResponse(
        id=new_user['id'],
        email=new_user['email'],
        username=new_user['username']
    )


@router.post("/login", response_model=LoginResponse, status_code=status.HTTP_200_OK)
async def login(credentials: LoginRequest):
    tokens = auth_service.login_user(
        email=credentials.email,
        password=credentials.password
    )

    return LoginResponse(
        access_token=tokens["access_token"],
        refresh_token=tokens["refresh_token"]
    )


@router.post("/refresh", response_model=RefreshResponse, status_code=status.HTTP_200_OK)
async def refresh_token(request: RefreshRequest):
    new_token = auth_service.refresh_access_token(
        refresh_token=request.refresh_token
    )

    return RefreshResponse(
        access_token=new_token["access_token"]
    )