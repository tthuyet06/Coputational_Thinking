# backend/app/main.py
from pathlib import Path

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, Response

from backend.app.api.v1.routers import api_router

app = FastAPI(title="MoodyTrip API")

# === 1. THÊM CSP MIDDLEWARE ĐỂ XỬ LÝ LỖI NGÂN CHẶN TÀI NGUYÊN ===
@app.middleware("http")
async def add_csp_header(request: Request, call_next):
    response: Response = await call_next(request)
    
    csp_policy = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline'; "
        "style-src 'self' 'unsafe-inline'; "
        # NỚI RỘNG NHẤT CHO HÌNH ẢNH VÀ FONT
        "img-src 'self' data: *; "
        "font-src 'self' data: * 'unsafe-inline'; " # <--- Đã thêm 'unsafe-inline'
        "connect-src 'self';"
    )
    
    response.headers["Content-Security-Policy"] = csp_policy
    return response

# === CORS ===
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)   # /api/v1/...

# === 2. SERVE REACT BUILD (SPA) ===
PROJECT_ROOT = Path(__file__).resolve().parents[2]
FRONTEND_DIST = PROJECT_ROOT / "Frontend" / "dist"

print("=== FRONTEND DIST ===")
print(FRONTEND_DIST)

if FRONTEND_DIST.exists():
    # serve assets
    app.mount(
        "/assets",
        StaticFiles(directory=str(FRONTEND_DIST / "assets")),
        name="assets",
    )

    index_file = FRONTEND_DIST / "index.html"

    # root "/"
    @app.get("/", include_in_schema=False)
    async def serve_root():
        return FileResponse(index_file)

    # catch-all cho các route FE: /login, /preferences, /results,...
    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str):
        # Nếu là API hoặc assets thì KHÔNG trả index.html
        if (
            full_path.startswith("api/")
            or full_path.startswith("assets/")
            or full_path.startswith("docs")
            or full_path.startswith("openapi")
            or full_path.startswith("redoc")
        ):
            raise HTTPException(status_code=404, detail="Not Found")

        # còn lại: trả React index.html, để React Router handle
        return FileResponse(index_file)

else:
    print("❌ dist not found — please run `npm run build`")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)