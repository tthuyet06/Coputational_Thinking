import React from "react"; // Bỏ useState
import { useNavigate, useLocation } from "react-router-dom";
import Navbar from "../components/layouts/Navbar";
import "../styles/PlaceDetail.css";
import { DirectionButton, FavoriteButton } from "../components/common/ActionButtons";
import BackButton from "../components/common/BackButton";

const STORAGE_KEY = "last_search_results";

export default function PlaceDetail() {
  const location = useLocation();
  const navigate = useNavigate();

  const data = location.state?.place;
  const startCoords = location.state?.startCoords; 

  if (!data) {
    navigate("/results");
    return null;
  }

  // Chuẩn hóa dữ liệu Place
  const place = {
    ...data,
    id: data.id,
    lat: data.lat || data.latitude,
    lon: data.lon || data.longitude,
    name: data.name || data.title,
    title: data.title || data.name || "Tên địa điểm",
    image: data.image || data.hero || data.image_url,
    description: data.overview || data.description || data.summarization || "Chưa có mô tả chi tiết.",
    hashtags: Array.isArray(data.hashtags) ? data.hashtags : Array.isArray(data.tags) ? data.tags : [],
    address: data.address || "",
    rating: typeof data.rating === "number" ? data.rating : data.rating != null ? Number(data.rating) : null,
    openingHours: data.openingHours || data.opening_hours || data.open || "N/A",
    fav: !!data.fav,
  };  

  // --- HÀM CHỈ LÀM NHIỆM VỤ SYNC CACHE (Không cần setState) ---
  const syncFavToCache = (newStatus) => {
    try {
      const cachedRaw = sessionStorage.getItem(STORAGE_KEY);
      if (!cachedRaw) return;

      const cachedData = JSON.parse(cachedRaw);
      
      if (cachedData.items && Array.isArray(cachedData.items)) {
        // Cập nhật item trong cache mà không cần reload trang
        const updatedItems = cachedData.items.map((item) => {
          if (String(item.id) === String(place.id)) {
            return { ...item, fav: newStatus };
          }
          return item;
        });

        cachedData.items = updatedItems;
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(cachedData));
        console.log(`💾 [Detail] Cache updated for ID ${place.id}: fav=${newStatus}`);
      }
    } catch (error) {
      console.error("Failed to update session storage:", error);
    }
  };

  const renderStars = (rating) => {
    const isValid = typeof rating === "number" && !Number.isNaN(rating);
    return (
      <span style={{ display: "flex", alignItems: "center", gap: "5px", fontWeight: "bold", color: "#333" }}>
        <span style={{ color: "#fbbf24", fontSize: "1.2rem" }}>★</span>
        <span>{isValid ? rating.toFixed(1) : "N/A"}</span>
        <span style={{ fontSize: "0.85rem", color: "#888", fontWeight: "normal" }}>/ 5.0</span>
      </span>
    );
  };

  return (
    <>
      <Navbar />
      <BackButton to={-1} />

      <main className="detail-wrap">
        <div className="detail-hero">
          <img src={place.image} alt={place.title} />
        </div>

        <article className="detail-card">
          <header className="detail-header">
            <h1 className="detail-title">{place.title}</h1>

            <div className="detail-actions">
              <DirectionButton place={place} startCoords={startCoords} />
              
              {/* Truyền place.fav ban đầu, syncFavToCache chạy khi toggle */}
              <FavoriteButton
                placeId={place.id}
                isFav={place.fav} 
                onToggle={syncFavToCache} 
              />
            </div>
          </header>

          <p className="detail-desc">{place.description}</p>

          <dl className="detail-meta">
            <div className="meta-row">
              <dt>Rating:</dt>
              <dd>{renderStars(place.rating)}</dd>
            </div>
            <div className="meta-row">
              <dt>Hashtags:</dt>
              <dd className="tags">
                {place.hashtags.map((t, i) => <span key={i}>{t} </span>)}
              </dd>
            </div>
            <div className="meta-row">
              <dt>Address:</dt>
              <dd><span className="pin">📍</span>{place.address}</dd>
            </div>
            <div className="meta-row">
              <dt>Opening Hours:</dt>
              <dd>{place.openingHours}</dd>
            </div>
          </dl>
        </article>
      </main>
    </>
  );
}