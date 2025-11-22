// components/common/ActionButtons.jsx
import React from 'react';
// 💡 IMPORT FILE CSS MỚI
import '../../styles/ActionButtons.css'; 

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

/**
 * Component Nút yêu thích/Trái tim (Favorite Button)
 * @param {object} props
 * @param {boolean} props.isFav - Trạng thái yêu thích
 * @param {function} props.onToggle - Hàm xử lý khi click
 */
export function FavoriteButton({ isFav, onToggle }) {
  const handleClick = (e) => {
    e.stopPropagation(); // Ngăn chặn sự kiện click lan ra ResultCard
    onToggle();
  };
  
  return (
    <button
      className={`fav-btn ${isFav ? "is-fav" : ""}`}
      aria-label={isFav ? "Unfavorite" : "Favorite"}
      onClick={handleClick}
      title={isFav ? "Remove from favorites" : "Add to favorites"}
    >
      {/* SVG icon cho Heart */}
      <svg width="22" height="22" viewBox="0 0 24 24">
        {/* Fill không cần thiết ở đây vì đã có CSS .fav-btn svg path { fill: currentColor !important; } */}
        <path d="M12 21s-6.7-4.1-9.6-7.6A6.1 6.1 0 0 1 12 5.3a6.1 6.1 0 0 1 9.6 8.1C18.7 16.9 12 21 12 21z" />
      </svg>
    </button>
  );
}