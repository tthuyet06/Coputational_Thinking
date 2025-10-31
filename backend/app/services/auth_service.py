from fastapi import FastAPI, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from starlette import status
from models import (RegisterRequest, LoginRequest,
                    UserResponse, LoginResponse,
                    RefreshRequest, RefreshResponse)
app = FastAPI()
security = HTTPBearer()

mock_database = [
    {
        "id": 1,
        "email": "user1@example.com",
        "full_name": "User Mot",
        "password": "password123"
    },
    {
        "id": 2,
        "email": "user2@example.com",
        "full_name": "User Hai",
        "password": "password456"
    }
]

mock_access_tokens = {}
mock_refresh_tokens = {}

@app.post("/api/auth/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register_user(user: RegisterRequest):
    if user.email is None:
        raise HTTPException(status_code = status.HTTP_400_BAD_REQUEST,
                            detail = {"email": ["Email không được để trống."]})
    if user.full_name is None:
        raise HTTPException(status_code = status.HTTP_400_BAD_REQUEST,
                            detail = {"full_name": ["Tên không được để trống"]})
    if user.password is None:
        raise HTTPException(status_code = status.HTTP_400_BAD_REQUEST,
                            detail = {"password": ["Mật khẩu không được để trống"]})
    for existing_user in mock_database:
        if existing_user['email'] == user.email:
            raise HTTPException(status_code = status.HTTP_400_BAD_REQUEST,
                                detail = {"email": ["Địa chỉ email này đã tồn tại."]})

    new_user = {
        "id": len(mock_database) + 1,
        "email": user.email,
        "full_name": user.full_name,
        "password": user.password,
    }
    mock_database.append(new_user)
    return new_user


@app.post("/api/auth/login", response_model=LoginResponse, status_code=status.HTTP_200_OK)
async def login_user(user: LoginRequest):
    for existing_user in mock_database:
        if existing_user["email"] == user.email and existing_user["password"] == user.password:
            access_token = f"access_token_for_{user.email}"
            refresh_token = f"refresh_token_for_{user.email}"

            mock_access_tokens[access_token] = user.email
            mock_refresh_tokens[refresh_token] = user.email


            return LoginResponse(
                access_token=access_token,
                refresh_token=refresh_token
            )

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Không tìm thấy tài khoản nào với thông tin đăng nhập này."
    )


@app.post("/api/auth/refresh", response_model=RefreshResponse, status_code=status.HTTP_200_OK)
def refresh_access_token(req: RefreshRequest):
    if req.refresh_token not in mock_refresh_tokens:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token không hợp lệ, vui lòng đăng nhập lại."
        )

    email = mock_refresh_tokens[req.refresh_token]
    new_access_token = f"new_access_for_{email}"

    mock_access_tokens[new_access_token] = email
    return RefreshResponse(access_token=new_access_token)


def get_current_user_from_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials

    if token not in mock_access_tokens:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Access token không hợp lệ hoặc đã hết hạn.")

    email = mock_access_tokens[token]
    user = next((u for u in mock_database if u["email"] == email), None)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Không tìm thấy người dùng.")

    return user


@app.get("/api/users/me", response_model=UserResponse, status_code=status.HTTP_200_OK)
async def get_my_profile(current_user: dict = Depends(get_current_user_from_token)):
    return UserResponse(
        id=current_user['id'],
        email=current_user['email'],
        full_name=current_user['full_name']
    )

