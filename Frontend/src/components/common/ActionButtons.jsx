// components/common/ActionButtons.jsx
import React from 'react';
// 💡 IMPORT FILE CSS MỚI
import '../../styles/ActionButtons.css'; 
import { useState, useEffect, useRef } from "react";
import favoriteAPI from "../../services/favoriteAPI"; // Import API đã viết ở bước trước

/**
 * Hàm tiện ích để xây dựng URL Google Maps cho Chỉ đường.
 */
function buildDirectionsUrl(place) {
  const base = "https://www.google.com/maps/dir/?api=1";
  // Sử dụng address hoặc name làm điểm đến
  const dest = encodeURIComponent(place.address || place.name); 
  return `${base}&origin=Current+Location&destination=${dest}`;
}

/**
 * Component Nút chỉ đường (Direction Button)
 * @param {object} props
 * @param {object} props.place - Đối tượng chứa thông tin địa điểm (cần address/name và title)
 */
export function DirectionButton({ place }) {
  const openDirections = (e) => {
    e.stopPropagation(); // Ngăn chặn sự kiện click lan ra ResultCard
    window.open(buildDirectionsUrl(place), "_blank", "noopener,noreferrer");
  };

  return (
    <button
      className="icon-btn dir-btn"
      onClick={openDirections}
      aria-label={`Direction to ${place.title}`}
      title="Direction"
      // Ngăn chặn onMouseDown kích hoạt sự kiện click của thẻ cha trước khi onClick của button được xử lý
      onMouseDown={(e) => e.preventDefault()} 
    >
      {/* SVG icon cho Direction */}
      <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
        <rect
          x="3"
          y="3"
          width="18"
          height="18"
          rx="3"
          fill="#ffffff"
          transform="rotate(45 12 12)"
        />
        <path
          d="M9 16V12a3 3 0 0 1 3-3h3"
          fill="none"
          stroke="#111111"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M14 7l4 4-4 4"
          fill="none"
          stroke="#111111"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}



// ... DirectionButton giữ nguyên ...

export function FavoriteButton({ placeId, isFav, onToggle }) {
  const [isFavorited, setIsFavorited] = useState(isFav);
  const debounceTimer = useRef(null);

  useEffect(() => {
    setIsFavorited(isFav);
  }, [isFav]);

  const executeApiCall = async (currentId, status) => {
    // 🛡️ 1. Ép kiểu và kiểm tra kỹ càng
    const validId = parseInt(currentId);
    
    // Nếu ID không phải số hoặc bị NaN -> DỪNG NGAY
    if (!currentId || isNaN(validId)) {
        console.error("⛔ [FavoriteButton] Blocked invalid call. ID:", currentId);
        return; 
    }

    try {
      // 🛡️ 2. Gọi API thông qua hàm cập nhật
      await favoriteAPI.updateFavoriteStatus(validId, status);
    } catch (error) {
      console.error("Failed to update favorite:", error);
      // Nếu muốn chặt chẽ: Revert UI nếu lỗi
      // setIsFavorited(!status); 
    }
  };

  const handleClick = (e) => {
    e.stopPropagation();
    e.preventDefault();

    // Optimistic UI
    const newStatus = !isFavorited;
    setIsFavorited(newStatus);
    
    if (onToggle) onToggle(newStatus);

    // Debounce
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      // Truyền đúng placeId từ props vào đây
      executeApiCall(placeId, newStatus);
    }, 500);
  };

  return (
    <button
      className={`fav-btn ${isFavorited ? "is-fav" : ""}`}
      onClick={handleClick}
      // ... giữ nguyên phần svg
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill={isFavorited ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
      </svg>
    </button>
  );
}