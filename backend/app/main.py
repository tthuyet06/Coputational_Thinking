# backend/app/main.py
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.api.v1.routers import api_router

app = FastAPI(title="MoodyTrip API")

# =======================================================
# ✅ 2. THÊM ĐOẠN NÀY ĐỂ BẬT CORS
# =======================================================
# Đây là "cửa" cho phép React (ở port 5173) được gọi vào
origins = [
    "http://localhost:5173",  # Port mặc định của Vite/React
    "http://127.0.0.1:5173"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,       # Chỉ cho phép port 5173
    allow_credentials=True,
    allow_methods=["*"],         # Cho phép mọi phương thức (GET, POST, PATCH...)
    allow_headers=["*"],         # Cho phép mọi header (bao gồm 'Authorization')
)
# =======================================================

# ✅ 3. Dòng này của bạn đã đúng
app.include_router(api_router)  # Bao gồm tất cả API (/api/v1/...)

# (Nếu bạn chạy file này trực tiếp)
if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)