# backend/app/db/seed_db.py

from sqlalchemy.orm import Session
from backend.app.db.db_connection import SessionLocal
from backend.app.db import models


def seed_hobbies(db: Session):
    """
    Seed bảng hobbies nếu chưa có dữ liệu.
    """
    default_hobbies = [
        ("#an_chinh", "Main meal"),
        ("#an_vat", "Snack"),
        ("#cafe", "Cafe"),
        ("#van_hoa", "Culture"),
        ("#yen_tinh", "Quiet places"),
        ("#soi_dong", "Vibrant"),
        ("#song_ao", "Check-in / Photography"),
    ]

    for code, label in default_hobbies:
        exists = db.query(models.Hobby).filter(models.Hobby.code == code).first()
        if exists:
            continue

        db.add(models.Hobby(code=code, name=label))
        print(f"✔ Added hobby: {code}")

    db.commit()
    print("🎉 Hobbies seeding complete.")


def seed_places(db: Session):
    """
    Seed một số địa điểm mẫu để test recommend engine.
    """
    sample_places = [
        {
            "name": "Highlands Coffee",
            "address": "Quận 1, TP.HCM",
            "link_address": "District 1",
            "lat": 10.776887,
            "lon": 106.700806,
            "overview": "A popular coffee chain.",
            "image": "",
            "tags": "cafe,van_hoa",
        },
        {
            "name": "Phở Lý Quốc Sư",
            "address": "Quận 3, TP.HCM",
            "link_address": "District 3",
            "lat": 10.782707,
            "lon": 106.694275,
            "overview": "Famous Vietnamese pho.",
            "image": "",
            "tags": "an_chinh",
        },
        {
            "name": "Cà phê Bệt Nhà Thờ",
            "address": "Nhà Thờ Đức Bà",
            "link_address": "District 1",
            "lat": 10.780079,
            "lon": 106.699707,
            "overview": "Outdoor coffee spot, vibrant vibe.",
            "image": "",
            "tags": "cafe,soi_dong,song_ao",
        },
    ]

    for p in sample_places:
        exists = (
            db.query(models.Place)
            .filter(models.Place.name == p["name"])
            .first()
        )
        if exists:
            continue

        place = models.Place(
            name=p["name"],
            address=p["address"],
            link_address=p["link_address"],
            lat=p["lat"],
            lon=p["lon"],
            overview=p["overview"],
            image=p["image"],
            tags=p["tags"],
        )
        db.add(place)
        print(f"✔ Added place: {p['name']}")

    db.commit()
    print("🎉 Places seeding complete.")


def run_seed():
    print("🚀 Starting database seeding...")
    db = SessionLocal()

    try:
        seed_hobbies(db)
        seed_places(db)
    finally:
        db.close()

    print("✅ All seed data inserted successfully.")


if __name__ == "__main__":
    run_seed()
