import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "../../styles/Navbar.css";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  // ref dùng để tham chiếu đến container chứa nút mở menu và menu dropdown
  const ref = useRef(null); 
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const isAuthPage = pathname === "/login" || pathname === "/signup";
  const isProfilePage = pathname === "/profile";

  useEffect(() => {
    const onClickOutside = (e) => {
      // Nếu ref.current tồn tại và click không nằm trong ref.current (cả nút mở và menu dropdown)
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    window.addEventListener("click", onClickOutside);
    return () => window.removeEventListener("click", onClickOutside);
  }, []);

  return (
    <header className="navbar">
      <div className="navbar-inner">
        {isAuthPage ? (
          <span className="navbar-logo disabled">MOODYTRIP</span>
        ) : (
          <Link to="/activities" className="navbar-logo">
            MOODYTRIP
          </Link>
        )}

        {!isAuthPage && (
          // ref gắn vào navbar-actions (bao gồm nút mở và menu)
          <div className="navbar-actions" ref={ref}>
            {isProfilePage ? (
              <Link to="/activities" className="home-pill" aria-label="Go Home">
              <svg width="30" height="30" viewBox="0 0 24 24">
                <path
                  d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z"
                  fill="#ff5a7a"
                />
              </svg>
              <span>Home</span>
              </Link>
            ) : (
              <>
                <button
                  className={`profile-pill ${open ? "is-open" : ""}`}
                  // Chỉ cần onClick để mở/đóng menu, vì ref đã handle đóng bên ngoài
                  onClick={() => setOpen((v) => !v)}
                  aria-haspopup="menu"
                  aria-expanded={open}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24">
                    <path
                      d="M3 6h18M3 12h18M3 18h18"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="avatar">
                    <svg width="20" height="20" viewBox="0 0 24 24">
                      <path
                        d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-5 0-9 2.5-9 5.5A1.5 1.5 0 0 0 4.5 21h15A1.5 1.5 0 0 0 21 19.5C21 16.5 17 14 12 14Z"
                        fill="currentColor"
                      />
                    </svg>
                  </div>
                </button>

                {open && (
                  // Bổ sung onMouseDown/onTouchStart để chặn sự kiện cấp thấp
                  <div 
                    className="profile-menu" 
                    role="menu"
                    onMouseDown={(e) => e.stopPropagation()} 
                    onTouchStart={(e) => e.stopPropagation()} // Chặn cảm ứng
                  >
                    <button
                      className="menu-item"
                      // Sửa lại logic: Dùng setTimeout để tránh race condition khi navigate
                      onClick={(e) => {
                        e.stopPropagation(); // Vẫn chặn click để đảm bảo an toàn
                        setOpen(false);
                        // Chuyển hướng sau 50ms để các sự kiện click đang chờ bị clear hết
                        setTimeout(() => {
                           navigate("/profile");
                        }, 50); 
                      }}
                    >
                      Profile
                    </button>
                    <button
                      className="menu-item"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpen(false);
                         setTimeout(() => {
                           navigate("/login");
                        }, 50);
                      }}
                    >
                      Logout
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
