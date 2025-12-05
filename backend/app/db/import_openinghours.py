from pathlib import Path
import csv

from backend.app.db.db_connection import SessionLocal
from backend.app.db import models

# Lấy đường dẫn ROOT PROJECT (thư mục chứa backend/)
ROOT_DIR = Path(__file__).resolve().parents[3]

# CSV nằm trong backend/data/opening_hours.csv
CSV_FILE = ROOT_DIR / "backend" / "data" / "opening_hours.csv"

def safe_int(value):
    try:
        return int(value)
    except:
        return None

def import_opening_hours():
    db = SessionLocal()

    print("📥 Importing from:", CSV_FILE)

    if not CSV_FILE.exists():
        print("❌ File CSV không tồn tại:", CSV_FILE)
        return

    # ⚠️ XÓA SẠCH BẢNG OPENING HOURS TRƯỚC KHI IMPORT
    # Lưu ý: Đảm bảo tên Model trong models.py là OpeningHour
    try:
        db.query(models.OpeningHour).delete()
        db.commit()
    except Exception as e:
        print(f"⚠️ Cảnh báo xóa dữ liệu cũ: {e}")
        db.rollback()

    with open(CSV_FILE, encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            # Tạo object model từ dòng CSV
            # row.get("tên_cột_trong_csv")
            opening_hour = models.OpeningHour(
                place_id=safe_int(row.get("place_id")),
                day_of_week=safe_int(row.get("day_of_week")), # 0-6 hoặc 1-7 tùy quy ước
                open_time=row.get("open_time"),               # Dạng string '08:00'
                close_time=row.get("close_time")              # Dạng string '22:00'
            )
            db.add(opening_hour)

    db.commit()
    db.close()

    print("✔ Import xong, không lỗi!")
if __name__ == "__main__":
    import_opening_hours()
    