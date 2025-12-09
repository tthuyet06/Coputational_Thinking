import React, { useState, useEffect, useRef } from "react";
import '../../styles/ActionButtons.css'; 
import favoriteAPI from "../../services/favoriteAPI"; 

// --- 1. FUNCTION BUILD URL (Giữ nguyên logic đã sửa ở bước trước) ---
function buildDirectionsUrl(destPlace, startCoords) {
    const baseUrl = "https://www.google.com/maps/dir/?api=1";
    
    // Fallback an toàn cho tọa độ đích
    const destLat = destPlace.lat ?? destPlace.latitude;
    const destLon = destPlace.lon ?? destPlace.longitude ?? destPlace.lng;
    
    // Xử lý điểm xuất phát
    let originParam = "Current+Location"; 
    if (startCoords && startCoords.lat != null && startCoords.lng != null) {
        originParam = `${startCoords.lat},${startCoords.lng}`;
    }

    // Xử lý điểm đích
    let destParam = "";
    if (destLat != null && destLon != null) {
        destParam = `${destLat},${destLon}`;
    } else {
        destParam = encodeURIComponent(destPlace.address || destPlace.title || "Destination");
    }
    
    return `${baseUrl}&origin=${originParam}&destination=${destParam}&travelmode=driving`;
}

// --- 2. DIRECTION BUTTON (Đã thêm điều kiện ẩn nút) ---
export function DirectionButton({ place, startCoords }) {
  // Nếu không có tọa độ xuất phát -> Không hiển thị nút chỉ đường
  if (!startCoords || startCoords.lat == null || startCoords.lng == null) {
    return null; 
  }

  const openDirections = (e) => {
    e.stopPropagation(); 
    const url = buildDirectionsUrl(place, startCoords);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <button
      className="icon-btn dir-btn"
      onClick={openDirections}
      aria-label={`Direction to ${place.title}`}
      title="Get Directions"
      onMouseDown={(e) => e.preventDefault()} 
    >
      <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="3" fill="#ffffff" transform="rotate(45 12 12)"/>
        <path d="M9 16V12a3 3 0 0 1 3-3h3" fill="none" stroke="#111111" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M14 7l4 4-4 4" fill="none" stroke="#111111" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </button>
  );
}

// --- 3. FAVORITE BUTTON (Đã dọn dẹp useEffect) ---
export function FavoriteButton({ placeId, isFav, onToggle }) {
  const [isFavorited, setIsFavorited] = useState(isFav);
  const debounceTimer = useRef(null);

  // ✅ 1. Chỉ dùng useEffect để đồng bộ props từ cha xuống (khi load lại danh sách)
  // Không gọi API trong này để tránh loop
  useEffect(() => {
    setIsFavorited(isFav);
  }, [isFav]);

  // ✅ 2. Cleanup: Hủy timer nếu component bị unmount (chuyển trang)
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  const executeApiCall = async (currentId, status) => {
    const validId = parseInt(currentId);
    if (!currentId || isNaN(validId)) return; 

    try {
      console.log(`📡 [Favorite API] Updating ${validId} to ${status}`);
      await favoriteAPI.updateFavoriteStatus(validId, status);
    } catch (error) {
      console.error("❌ Failed to update favorite:", error);
      // Có thể revert UI ở đây nếu cần thiết
      // setIsFavorited(!status); 
    }
  };

  const handleClick = (e) => {
    e.stopPropagation();
    e.preventDefault();

    // 1. Optimistic UI: Cập nhật giao diện ngay lập tức
    const newStatus = !isFavorited;
    setIsFavorited(newStatus);
    
    // Báo cho component cha biết (nếu cần đổi màu icon ở cha)
    if (onToggle) onToggle(newStatus);

    // 2. Debounce: Xóa timer cũ nếu người dùng bấm liên tục
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // 3. Set timer mới: Chỉ gọi API sau 500ms ngừng bấm
    debounceTimer.current = setTimeout(() => {
      executeApiCall(placeId, newStatus);
    }, 500);
  };

  return (
    <button 
        className={`fav-btn ${isFavorited ? "is-fav" : ""}`} 
        onClick={handleClick}
        onMouseDown={(e) => e.preventDefault()} // Ngăn sự kiện click lan ra ngoài
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill={isFavorited ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
      </svg>
    </button>
  );
}