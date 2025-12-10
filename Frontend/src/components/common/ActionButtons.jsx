import React, { useState, useEffect, useRef } from "react";
import '../../styles/ActionButtons.css'; 
import favoriteAPI from "../../services/favoriteAPI"; 

// --- 1. FUNCTION BUILD URL (Giữ nguyên) ---
function buildDirectionsUrl(destPlace, startCoords) {
    const baseUrl = "https://www.google.com/maps/dir/?api=1";
    const destLat = destPlace.lat ?? destPlace.latitude;
    const destLon = destPlace.lon ?? destPlace.longitude ?? destPlace.lng;
    
    let originParam = "Current+Location"; 
    if (startCoords && startCoords.lat != null && startCoords.lng != null) {
        originParam = `${startCoords.lat},${startCoords.lng}`;
    }

    let destParam = "";
    if (destLat != null && destLon != null) {
        destParam = `${destLat},${destLon}`;
    } else {
        destParam = encodeURIComponent(destPlace.address || destPlace.title || "Destination");
    }
    
    return `${baseUrl}&origin=${originParam}&destination=${destParam}&travelmode=driving`;
}

// --- 2. DIRECTION BUTTON (Giữ nguyên) ---
export function DirectionButton({ place, startCoords }) {
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

// --- 3. FAVORITE BUTTON (SỬA LỖI TIMEOUT) ---
export function FavoriteButton({ placeId, isFav, onToggle }) {
  const [isFavorited, setIsFavorited] = useState(!!isFav);
  
  // Ref để lưu timer, giúp kiểm soát việc clear/không clear
  const debounceTimer = useRef(null);
  
  // Ref để biết component còn sống hay đã chết
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    setIsFavorited(!!isFav);
    
    // Cleanup function khi component unmount
    return () => {
      isMounted.current = false;
      // QUAN TRỌNG: KHÔNG clear timeout ở đây!
      // Để API call vẫn được thực hiện dù component đã biến mất khỏi màn hình Profile.
    };
  }, [isFav]);

  const executeApiCall = async (currentId, status) => {
    // Check ID an toàn (như đã bàn ở bước trước)
    if (currentId === null || currentId === undefined) {
        console.warn("⚠️ [FavoriteButton] Missing ID!");
        return; 
    }

    // Xử lý ID lưỡng tính (Int/String)
    let idToSend = currentId;
    const strId = String(currentId);
    if (/^\d+$/.test(strId)) {
        idToSend = parseInt(strId, 10);
    }

    try {
      console.log(`📡 [Favorite API] EXECUTE -> ID: ${idToSend} | Status: ${status}`);
      await favoriteAPI.updateFavoriteStatus(idToSend, status);
    } catch (error) {
      console.error("❌ Failed to update favorite:", error);
      
      // CHỈ Revert UI nếu component CÒN SỐNG
      // Nếu ở trang Profile và component đã bị xóa, ta không cần revert UI nữa
      if (isMounted.current) {
         setIsFavorited(!status); 
      }
    }
  };

  const handleClick = (e) => {
    e.stopPropagation();
    e.preventDefault();

    const newStatus = !isFavorited;
    
    // 1. Optimistic UI: Đổi màu ngay
    setIsFavorited(newStatus);
    
    // 2. Báo cho cha (Profile/Results) ngay lập tức
    if (onToggle) onToggle(newStatus);

    // 3. Clear timer CŨ (nếu user bấm liên tục)
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // 4. Set timer MỚI.
    // Timer này sẽ sống sót qua khỏi sự kiện Unmount nhờ việc ta bỏ clearTimeout ở useEffect.
    debounceTimer.current = setTimeout(() => {
      executeApiCall(placeId, newStatus);
    }, 500);
  };

  return (
    <button 
        className={`fav-btn ${isFavorited ? "is-fav" : ""}`} 
        onClick={handleClick}
        onMouseDown={(e) => e.preventDefault()}
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill={isFavorited ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
      </svg>
    </button>
  );
}