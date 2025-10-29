```
backend
├── app/
│   ├── __init__.py
│   ├── main.py              # Khởi tạo ứng dụng FastAPI và bao gồm các router
│   ├── core/
│   │   ├── config.py        # Cài đặt cấu hình (DB path, API keys như OpenWeatherMap)
│   │   └── security.py      # Logic liên quan đến mã hóa/xác thực (passlib/hashing)
│   ├── db/
│   │   ├── database.py      # Khởi tạo kết nối DB (databases/SQLite)
│   │   └── crud.py          # Các hàm thao tác DB cơ bản (Create, Read, Update, Delete)
│   ├── schemas/             # Các mô hình Pydantic (Định nghĩa hình dạng dữ liệu)
│   │   ├── user.py          # User (Request/Response cho Đăng ký, Đăng nhập)
│   │   ├── hobby.py         # Hobby/Preference (Sở thích)
│   │   └── location.py      # Location/Recommendation (Địa điểm/Gợi ý kết quả)
│   ├── services/            # Logic nghiệp vụ phức tạp (Tuần 3 & 4)
│   │   ├── auth_service.py  # Logic Đăng ký/Đăng nhập (sử dụng core/security và db/crud)
│   │   └── recommend_engine.py # Lõi AI/Logic Gợi ý (V1: Lọc cơ bản, V2: Tích hợp thời tiết/GPS)
│   └── api/
│       └── v1/
│           ├── __init__.py
│           ├── endpoints/
│           │   ├── users.py       # API cho luồng User (/register, /login)
│           │   ├── hobbies.py     # API để lấy danh sách sở thích (/hobbies)
│           │   └── recommend.py   # API chính (/recommend V1, V2)
│           └── routers.py         # Gom các endpoints lại và thêm vào app.main
├── data/
│   └── project.db           # File SQLite Database (Tuần 2)
├── tests/                   # Các bài kiểm tra đơn vị và tích hợp
├── .env                     # Các biến môi trường
├── requirements.txt         # Danh sách thư viện Python cần thiết (FastAPI, uvicorn, pydantic, databases, aiosqlite, passlib)
└── README.md
```