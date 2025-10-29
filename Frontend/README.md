```
frontend/
│
├── public/
│   └── vite.svg                # Logo mặc định của Vite (có thể thay bằng logo riêng)
│
├── src/
│   ├── assets/
│   │   ├── images/             # Ảnh nền, minh họa địa điểm, icon UI
│   │   └── fonts/              # Font chữ tuỳ chỉnh
│   │
│   ├── components/
│   │   ├── common/             # Các thành phần giao diện tái sử dụng
│   │   │   ├── Button.jsx          # Nút dùng chung (Submit / Save / Next / ...)
│   │   │   ├── InputField.jsx      # Ô nhập liệu (Username, Password,...)
│   │   │   ├── TagButton.jsx       # Nút chọn sở thích / hạng mục
│   │   │   ├── LoadingSpinner.jsx  # Hiệu ứng loading khi đang tải dữ liệu
│   │   │   └── SuggestionCard.jsx  # Thẻ hiển thị kết quả gợi ý địa điểm
│   │   │
│   │   └── layouts/            # Các phần bố cục chung giữa các trang
│   │       ├── Navbar.jsx          # Thanh điều hướng (hiển thị username, logout,...)
│   │       └── Footer.jsx          # Chân trang (copyright / liên kết)
│   │
│   ├── context/
│   │   └── AuthContext.jsx      # Quản lý trạng thái đăng nhập toàn cục (token, user info)
│   │
│   ├── hooks/
│   │   ├── useAuth.js           # Hook xác thực người dùng (login, logout, persist session)
│   │   ├── useLocation.js       # Lấy vị trí hiện tại (Geolocation API)
│   │   └── useWeather.js        # Lấy dữ liệu thời tiết (OpenWeatherMap API)
│   │
│   ├── pages/                   # Các trang chính của ứng dụng
│   │   ├── Register.jsx         # Trang đăng ký tài khoản
│   │   ├── Login.jsx            # Trang đăng nhập
│   │   ├── Preferences.jsx      # Trang chọn sở thích cá nhân
│   │   ├── Home.jsx             # Trang nhập thời gian rảnh, khởi tạo gợi ý
│   │   ├── Results.jsx          # Trang hiển thị danh sách kết quả gợi ý
│   │   ├── Profile.jsx          # Trang hồ sơ người dùng
│   │   └── PlaceDetail.jsx      # Trang chi tiết từng địa điểm được gợi ý
│   │
│   ├── services/                # Tầng gọi API tới backend (qua axios)
│   │   ├── apiClient.js         # Cấu hình axios mặc định (baseURL, headers, interceptors)
│   │   ├── authAPI.js           # Gọi các API liên quan đến đăng ký / đăng nhập
│   │   ├── preferenceAPI.js     # Gửi & lấy danh sách sở thích người dùng
│   │   ├── suggestionAPI.js     # Lấy gợi ý từ backend (recommend engine)
│   │   └── userAPI.js           # Lấy / cập nhật thông tin người dùng
│   │
│   ├── styles/
│   │   ├── global.css           # CSS chung toàn ứng dụng (reset, base layout)
│   │   └── themes/
│   │       └── light.css        # Giao diện chủ đề sáng (có thể thêm dark.css sau)
│   │
│   ├── utils/
│   │   ├── validation.js        # Hàm kiểm tra dữ liệu form (email, password,...)
│   │   ├── constants.js         # Các hằng số (API endpoint, màu chủ đạo, ...)
│   │   └── formatText.js        # Hàm xử lý, rút gọn, format văn bản hiển thị
│   │
│   ├── App.jsx                  # Cấu hình layout tổng thể và định tuyến
│   ├── router.jsx               # Định nghĩa route (Public, Private)
│   ├── config.js                # Cấu hình môi trường frontend (BASE_URL, API_KEY,...)
│   └── main.jsx                 # Entry point khởi chạy React app (render root)
│
├── .env                         # Biến môi trường (VITE_API_URL, VITE_WEATHER_KEY,...)
├── .gitignore                   # Bỏ qua các file không cần commit
├── index.html                   # Template HTML chính của ứng dụng
├── package.json                 # Thông tin dự án & dependencies (React, Axios, Tailwind,...)
└── vite.config.js               # Cấu hình Vite (plugin, alias, server port,...)
```
