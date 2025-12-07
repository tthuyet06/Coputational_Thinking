import React, { useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import Navbar from "../components/layouts/Navbar";
import "../styles/PlaceDetail.css";
import { DirectionButton, FavoriteButton } from "../components/common/ActionButtons"; 

export default function PlaceDetail() {
  const { id } = useParams(); 
  const location = useLocation();
  const navigate = useNavigate();
  
  const data = location.state?.place;

  if (!data) {
    navigate("/results");
    return null;
  }
  
  // -------------------------------------------------------------
  // 1️⃣ BƯỚC 1: CẬP NHẬT OBJECT PLACE
  // -------------------------------------------------------------
  const place = {
      id: data.id, 
      lat: data.lat, 
      lon: data.lon,
      name: data.title,
      title: data.title || "Tên địa điểm",
      image: data.image || data.hero, 
      description: data.overview || "Chưa có mô tả chi tiết.", 
      hashtags: Array.isArray(data.hashtags) ? data.hashtags : [],
      address: data.address,
      
      // 👇 THÊM DÒNG NÀY: Lấy rating từ data, mặc định là 0 nếu không có
      rating: data.rating ? Number(data.rating) : 0,

      openingHours: "", 
      setting: "",
      priceRange: "",
      detail: data.description, 
      fav: data.fav || false
  }

  const [fav, setFav] = useState(place.fav);
  
  // Hàm render số sao (Vẽ ngôi sao vàng)
  const renderStars = (score) => {
    return (
      <span style={{ display: "flex", alignItems: "center", gap: "5px", fontWeight: "bold", color: "#333" }}>
        <span style={{ color: "#fbbf24", fontSize: "1.2rem" }}>★</span>
        <span>{score > 0 ? score.toFixed(1) : "N/A"}</span>
        <span style={{ fontSize: "0.85rem", color: "#888", fontWeight: "normal" }}>/ 5.0</span>
      </span>
    );
  };

  return (
    <>
      <Navbar />
      <main className="detail-wrap">
        <div className="detail-hero">
          <button className="back-btn" onClick={() => navigate(-1)} aria-label="Back to results">
            <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M15 18 9 12l6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <img src={place.image} alt={place.title} />
        </div>

        <article className="detail-card">
          <header className="detail-header">
            <h1 className="detail-title">{place.title}</h1>

            <div className="detail-actions">
              <DirectionButton place={place} /> 
              <FavoriteButton 
                placeId={place.id}
                isFav={fav}
                onToggle={(newStatus) => setFav(newStatus)}
              />
            </div>
          </header>

          <p className="detail-desc">{place.description}</p>

          <dl className="detail-meta">
            
            {/* 2️⃣ BƯỚC 2: THÊM DÒNG HIỂN THỊ RATING TẠI ĐÂY */}
            <div className="meta-row">
              <dt>Rating:</dt>
              <dd>{renderStars(place.rating)}</dd>
            </div>

            <div className="meta-row">
              <dt>Hashtags:</dt>
              <dd className="tags">{place.hashtags.map((t) => `${t}`).join(" ")}</dd>
            </div>
            
            <div className="meta-row">
              <dt>Address:</dt>
              <dd><span className="pin">📍</span>{place.address}</dd>
            </div>

            <div className="meta-row">
              <dt>Opening Hours:</dt>
              <dd>{place.openingHours || "N/A"}</dd>
            </div>
          </dl>
          
        </article>
      </main>
    </>
  );
}