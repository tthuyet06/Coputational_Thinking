// src/components/common/BackButton.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/BackButton.css";

export default function BackButton({ to = null }) {
  const navigate = useNavigate();

  const goBack = () => {
    if (to) {
      navigate(to);      // 🟢 điều hướng tới trang cố định, không phụ thuộc history
    } else {
      navigate(-1);      // 🟢 lùi 1 bước trong lịch sử nếu không có "to"
    }
  };

  return (
    <button className="page-back-btn" onClick={goBack} aria-label="Go back">
      <svg width="18" height="18" viewBox="0 0 24 24">
        <path
          d="M15 18 9 12l6-6"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
