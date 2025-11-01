<<<<<<< HEAD
import React, { useState } from "react";

const Navbar = () => {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 w-full bg-blue-700 shadow-md px-6 sm:px-12 py-3 flex justify-between items-center z-10">
      <h1 className="text-xl font-bold text-white">MOODITRIP</h1>

      <button
        onClick={() => setOpen(!open)}
        className="text-2xl font-bold text-white focus:outline-none"
      >
        ☰
      </button>

      {open && (
        <div className="absolute right-6 top-14 bg-blue-50 shadow-lg rounded-lg w-40 text-gray-800 border border-blue-200">
          <ul className="flex flex-col">
            <li className="px-4 py-2 hover:bg-blue-100 cursor-pointer">
              Hồ sơ
            </li>
            <li className="px-4 py-2 hover:bg-blue-100 cursor-pointer">
              Đăng xuất
            </li>
          </ul>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
=======
import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "../../styles/Navbar.css";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const isAuthPage = pathname === "/login" || pathname === "/signup";
  const isProfilePage = pathname === "/profile";

  useEffect(() => {
    const onClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    window.addEventListener("click", onClickOutside);
    return () => window.removeEventListener("click", onClickOutside);
  }, []);

  return (
    <header className="navbar">
      <div className="navbar-inner">
        {isAuthPage ? (
          // Khi ở login/signup: chỉ là chữ, không bấm được
          <span className="navbar-logo disabled">MOODITRIP</span>
        ) : (
          <Link to="/home" className="navbar-logo">
            MOODITRIP
          </Link>
        )}

        {!isAuthPage && (
          <div className="navbar-actions" ref={ref}>
            {isProfilePage ? (
              <Link to="/home" className="home-pill" aria-label="Go Home">
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
                  <div className="profile-menu" role="menu">
                    <button
                      className="menu-item"
                      onClick={() => {
                        setOpen(false);
                        navigate("/profile");
                      }}
                    >
                      Profile
                    </button>
                    <button
                      className="menu-item"
                      onClick={() => {
                        setOpen(false);
                        navigate("/login");
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
>>>>>>> Gman
