# backend/app/services/tag_service.py

from typing import List, Dict, Any
from sqlalchemy.orm import Session
from backend.app.db.models import Hobby, Activity

# ----------------------------------------------------------------
# TAGS SERVICE
# ----------------------------------------------------------------

def list_hobby_tags(db: Session) -> List[Dict[str, Any]]:
    """
    Lấy danh sách hobbies từ DB và map sang format HobbyItem.
    """
    hobbies_db = db.query(Hobby).all()

    # Map dữ liệu để khớp với Schema HobbyItem
    results = [
        {
            "id": h.id,
            "tag": h.code,
            "name": h.name
        } for h in hobbies_db
    ]
    return results


def list_activity_tags(db: Session) -> List[Dict[str, Any]]:
    """
    Lấy danh sách activities từ DB và map sang format ActivityItem.
    """
    activities_db = db.query(Activity).all()

    # Map dữ liệu để khớp với Schema ActivityItem
    results = [
        {
            "id": a.id,
            "tag": a.code,
            "name": a.name
        } for a in activities_db
    ]
    return results