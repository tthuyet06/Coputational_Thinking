from fastapi import APIRouter, Depends
from starlette import status
from sqlalchemy.orm import Session
from backend.app.db.deps import get_db
from backend.app.schemas.schemas import (
    RegisterRequest, LoginRequest, UserResponse,
    LoginResponse, RefreshRequest, RefreshResponse
)
from backend.app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])
auth_service = AuthService()


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user: RegisterRequest,
    db: Session = Depends(get_db) # << THÊM DEPENDENCY
):
    new_user = auth_service.register_user(
        db=db, # << DB VÀO SERVICE
        email=user.email,
        username=user.username,
        password=user.password
    )
    # new_user giờ là một object SQLAlchemy
    return UserResponse(
        id=new_user.id,
        email=new_user.email,
        username=new_user.username
    )


@router.post("/login", response_model=LoginResponse, status_code=status.HTTP_200_OK)
async def login(
    credentials: LoginRequest,
    db: Session = Depends(get_db) # << THÊM DEPENDENCY
):
    tokens = auth_service.login_user(
        db=db, # << DB VÀO SERVICE
        username=credentials.username,
        password=credentials.password
    )
    return LoginResponse(
        access_token=tokens["access_token"],
        refresh_token=tokens["refresh_token"]
    )


@router.post("/refresh", response_model=RefreshResponse, status_code=status.HTTP_200_OK)
async def refresh_token(
    request: RefreshRequest,
    db: Session = Depends(get_db) # << THÊM DEPENDENCY
):
    new_token = auth_service.refresh_access_token(
        db=db, # << DB VÀO SERVICE
        refresh_token=request.refresh_token
    )
    return RefreshResponse(
        access_token=new_token["access_token"]
    )