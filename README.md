# Tên Dự Án (MODDY TRIP)

*   **Backend:** Python 3.10+, FastAPI, SQLAlchemy.
*   **Frontend:** React 19, Vite, TailwindCSS, Pigeon Maps (Bản đồ).
*   **Deployment:** Uvicorn, Ngrok.

---

## Yêu cầu tiên quyết (Prerequisites)

Hãy đảm bảo máy tính của bạn đã cài đặt:

1.  **Python** (3.10 trở lên).
2.  **Node.js** (v18 hoặc v20 trở lên - do dùng React 19).
3.  **Tài khoản Ngrok** (Đăng ký miễn phí tại [ngrok.com](https://ngrok.com/)).

---

## Cài đặt (Installation)

### 1. Cài đặt Backend (Python)

Cài đặt các thư viện cần thiết:
```bash
pip install
fastapi==0.121.0
uvicorn==0.38.0

httpx==0.28.1
python-dotenv==1.2.1

python-jose==3.5.0
passlib==1.7.4
bcrypt==5.0.0
email-validator==2.3.0

python-multipart==0.0.20
pillow==12.0.0

SQLAlchemy==2.0.44
greenlet==3.2.4

```

### 2. Cài đặt Frontend (Node.js)

Di chuyển vào thư mục Frontend và cài đặt (các gói sẽ tự cài theo package.json):
```bash
cd Frontend
npm install
```

### 3. Cài đặt và Cấu hình Ngrok (Quan trọng)

Để backend có thể public ra internet, bạn cần thực hiện các bước sau:

**Bước A: Tải Ngrok**
*   **Windows:** Tải file .zip từ trang chủ Ngrok, giải nén và copy file `ngrok.exe` vào thư mục dự án (hoặc cài qua Chocolatey: `choco install ngrok`).
*   **macOS:** Cài qua Homebrew: `brew install ngrok/ngrok/ngrok`.
*   **Linux:** Cài qua Snap: `sudo snap install ngrok`.

**Bước B: Lấy Authtoken**
1.  Đăng nhập vào [Ngrok Dashboard](https://dashboard.ngrok.com/).
2.  Chọn mục **Your Authtoken** ở menu bên trái.
3.  Copy đoạn mã Token hiển thị trên màn hình.

**Bước C: Kết nối Token vào máy**
Mở Terminal và chạy lệnh sau (thay `<your_token>` bằng token bạn vừa copy):
```bash
ngrok config add-authtoken <your_token>
```

---

## Hướng dẫn chạy (Run Project)

Để chạy dự án, bạn cần mở **3 cửa sổ Terminal** riêng biệt:

### Terminal 1: Build Frontend
Biên dịch code React thành file tĩnh.
```bash
cd Frontend
npm run build
```

### Terminal 2: Chạy Backend Server
Khởi động server FastAPI trên cổng 8000.
```bash
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000
```

### Terminal 3: Public ra Internet (Ngrok)
Tạo đường hầm (tunnel) để truy cập từ xa.
```bash
ngrok http 8000
```

---

## Truy cập

Sau khi chạy lệnh ở **Terminal 3**, Ngrok sẽ cung cấp một đường dẫn công khai:
*   Tìm dòng: `Forwarding  https://xxxx-xxxx-xxxx.ngrok-free.app -> http://localhost:8000`
*   **Copy link HTTPS** đó và dán vào trình duyệt.

**Lưu ý:** Trong lần đầu truy cập, Ngrok sẽ hiển thị một trang cảnh báo "Visit Site", hãy nhấn nút **"Visit Site"** để vào ứng dụng.

---

## Troubleshooting (Gỡ lỗi)

*   **Lỗi "ngrok command not found":** Đảm bảo đã chạy lệnh bằng đường dẫn trực tiếp đến file `ngrok.exe`.
*   **Lỗi Authtoken:** Nếu báo lỗi `ERR_NGROK_4018`, hãy kiểm tra lại xem đã chạy lệnh `ngrok config add-authtoken` chính xác chưa.
*   **Lỗi CSS/JS không load:** Đảm bảo đã chạy `npm run build` ở Terminal 1 trước khi mở link Ngrok.
*   **Ngrok Session Expired:** Ngrok bản miễn phí thỉnh thoảng sẽ yêu cầu khởi động lại tunnel. Chỉ cần tắt Terminal 3 và chạy lại `ngrok http 8000`.

