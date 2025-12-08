from pathlib import Path
import csv

from backend.app.db.db_connection import SessionLocal
from backend.app.db import models

# Lấy đường dẫn ROOT PROJECT (thư mục chứa backend/)
ROOT_DIR = Path(__file__).resolve().parents[3]

# CSV nằm trong backend/data/place.csv
CSV_FILE = ROOT_DIR / "backend" / "data" / "hobbies.csv"

def safe_int(value):
    try:
        return int(value)
    except:
        return None


def safe_float(value):
    try:
        return float(value)
    except:
        return None


def import_hobbies():
    db = SessionLocal()

    print("📥 Importing from:", CSV_FILE)

    if not CSV_FILE.exists():
        print("❌ File CSV không tồn tại:", CSV_FILE)
        return

        # ⚠️ XÓA SẠCH BẢNG PLACES TRƯỚC KHI IMPORT
    db.query(models.Hobby).delete()
    db.commit()

    with open(CSV_FILE, encoding="utf-8") as f:
        reader = csv.DictReader(f)

        for row in reader:
            # BỎ QUA DÒNG CÓ id TRỐNG
            if not row["id"].strip():
                print("⚠️ Bỏ qua dòng vì id trống:", row)
                continue

            hobby_id = safe_int(row["id"])
            if hobby_id is None:
                print("⚠️ Bỏ qua dòng vì id không hợp lệ:", row["id"])
                continue

            hobby = models.Hobby(
                id=hobby_id,
                name=row["name"],
                code=row["tag_code"]
            )
            db.add(hobby)

    db.commit()
    db.close()
    print("✔ Import xong, không lỗi!")


if __name__ == "__main__":
    import_hobbies()
