from sqlalchemy.orm import Session
from backend.app.db.db_connection import get_db
from fastapi import APIRouter
from backend.app.schemas.schemas import HobbyTagsResponse, DurationTagResponse
from fastapi import Depends
from backend.app.db.models import Hobby

from backend.app.services.user_service import (
    list_duration_tags,
)

router = APIRouter(prefix="/tags", tags=["tags"])


@router.get("/hobbies", response_model=HobbyTagsResponse, summary="Danh sách Hobbies từ DB")
def get_hobbies_list(db: Session = Depends(get_db)):
    """
    GET /api/v1/tags/hobbies
    - Lấy dữ liệu thật từ bảng 'hobbies'.
    - Map field 'code' -> 'tag'.
    - Map field 'label_en' -> 'name'.
    """

    # 1. Query tất cả hobby từ DB
    hobbies_db = db.query(Hobby).all()

    # 2. Map dữ liệu để khớp với Schema HobbyItem
    results = []
    for h in hobbies_db:
        results.append({
            "id": h.id,
            "tag": h.code,  # DB là 'code' (vd: #cafe)
            "name": h.name  # DB là 'label_en' (vd: Coffee)
        })

    return {"hobbies": results}

@router.get("/durations", response_model=DurationTagResponse, summary="Danh sách tag thời lượng")
def get_duration_tags():
    """
    GET /api/v1/tags/durations
    - Public.
    - Gọi service list_duration_tags() để lấy 3 lựa chọn theo hợp đồng API.
    """
    return {"duration_tags": list_duration_tags()}
