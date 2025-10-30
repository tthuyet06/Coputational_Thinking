from fastapi import FastAPI, HTTPException, Header
from pydantic import BaseModel, EmailStr
from typing import List, Optional
from fastapi import Depends


app = FastAPI(title="User Registration & Login API")


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    hobbies: Optional[List[str]] = []


class UserResponse(BaseModel):
    id: int
    email: EmailStr
    full_name: str
    hobbies: Optional[List[str]] = []


class LoginRequest(BaseModel):
    email: EmailStr
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
    full_name: str


database = []
places = []
access_tokens = {}
tokens = {}


@app.post("/api/auth/register", response_model=UserResponse, status_code=201)
def register_user(user: RegisterRequest):
    for existing_user in database:
        if existing_user["email"] == user.email:
            raise HTTPException(
                status_code=400,
                detail={"email": ["Địa chỉ email này đã tồn tại."]}
            )

 
    new_user = {
        "id": len(database) + 1,
        "email": user.email,
        "full_name": user.full_name,
        "password": user.password,
    }
    database.append(new_user)
    return new_user


@app.post("/api/auth/login", response_model=LoginResponse)
def login_user(credentials: LoginRequest):
    for user in database:
        if user["email"] == credentials.email and user["password"] == credentials.password:
            return LoginResponse(
                access_token=f"fake_access_token_for_{user['email']}",
                refresh_token=f"fake_refresh_token_for_{user['email']}"
            )


    raise HTTPException(
        status_code=401,
        detail="Không tìm thấy tài khoản nào với thông tin đăng nhập này."
    )


@app.post("/api/auth/refresh", response_model=RefreshResponse)
def refresh_token(req: RefreshRequest):
    if req.refresh_token not in tokens:
        raise HTTPException(
            status_code=401,
            detail="Refresh token không hợp lệ, vui lòng đăng nhập lại."
        )

    email = tokens[req.refresh_token]
    new_access_token = f"new_access_for_{email}"
    return RefreshResponse(access_token=new_access_token)


def get_current_user_from_token(Authorization: Optional[str] = Header(None)):
    if not Authorization or not Authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Thiếu hoặc sai định dạng Authorization header.")

    token = Authorization.replace("Bearer ", "")
    if token not in tokens:
        raise HTTPException(status_code=401, detail="Access token không hợp lệ hoặc đã hết hạn.")

    email = tokens[token]
    user = next((u for u in database if u["email"] == email), None)
    if not user:
        raise HTTPException(status_code=404, detail="Không tìm thấy người dùng.")

    return user


@app.get("/api/users/me", response_model=UserResponse)
def get_current_user(user=Depends(get_current_user_from_token)):
    return {
        "id": user["id"],
        "email": user["email"],
        "full_name": user["full_name"],
        "hobbies": user.get("hobbies", [])
    }


@app.get("/api/tags/hobbies")
def get_all_hobbies(user=Depends(get_current_user_from_token)):
    hobbies = [
        "#an_chinh",
        "#an_vat",
        "#cafe",
        "#van_hoa",
        "#yen_tinh",
        "#soi_dong",
        "#song_ao",
    ]
    return {"tags": hobbies}


@app.post("/api/users/me/hobbies", response_model=UpdateHobbiesResponse)
def update_user_hobbies(
    request: UpdateHobbiesRequest,
    user=Depends(get_current_user_from_token)
):
    user["hobbies"] = request.hobbies
    return {
        "message": "Cập nhật sở thích thành công!",
        "hobbies": request.hobbies
    }


class DurationTag(BaseModel):
    display_name: str
    tag_id: str

class DurationTagResponse(BaseModel):
    duration_tags: List[DurationTag]


@app.get("/api/tags/durations", response_model=DurationTagResponse)
def get_duration_tags():
    duration_tags = [
        {"display_name": "Dưới 1 tiếng", "tag_id": "#choc_lat"},
        {"display_name": "2-3 tiếng", "tag_id": "#vai_tieng"},
        {"display_name": "Nửa ngày", "tag_id": "#nua_ngay"},
    ]
    return {"duration_tags": duration_tags}


@app.post("/api/recommend", response_model=RecommendResponse)
def recommend_places(req: RecommendRequest, user=Depends(get_current_user_from_token)):
    results = []
    for p in places:
        if req.duration_tag in p["tags"]:
            if any(tag in p["tags"] for tag in user.get("hobbies", [])):
                results.append(p)

    if not results:
        raise HTTPException(status_code=404, detail="Không tìm thấy gợi ý nào phù hợp với lựa chọn của bạn.")
    return {"recommendations": results}


@app.get("/api/places/{place_id}", response_model=Place)
def get_place_detail(place_id: int, user=Depends(get_current_user_from_token)):
    for p in places:
        if p["id"] == place_id:
            return p
    raise HTTPException(status_code=404, detail="Không tìm thấy địa điểm.")


@app.post("/api/favorites")
def toggle_favorite(req: FavoriteRequest, user=Depends(get_current_user_from_token)):
    if "favorites" not in user:
        user["favorites"] = []

    if req.place_id in user["favorites"]:
        user["favorites"].remove(req.place_id)
        return {"message": "Đã bỏ lưu"}
    else:
        user["favorites"].append(req.place_id)
        return {"message": "Đã lưu vào yêu thích"}


@app.get("/api/favorites", response_model=List[Place])
def get_favorites(user=Depends(get_current_user_from_token)):
    fav_ids = user.get("favorites", [])
    fav_places = [p for p in places if p["id"] in fav_ids]
    return fav_places


@app.patch("/api/users/me", response_model=UserResponse)
def update_user_info(req: UpdateUserRequest, user=Depends(get_current_user_from_token)):
    user["full_name"] = req.full_name
    return {
        "id": user["id"],
        "email": user["email"],
        "full_name": user["full_name"],
        "hobbies": user.get("hobbies", [])
    }