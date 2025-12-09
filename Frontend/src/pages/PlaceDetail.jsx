// src/pages/PlaceDetail.jsx
import React, { useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import Navbar from "../components/layouts/Navbar";
import "../styles/PlaceDetail.css";
import {
  DirectionButton,
  FavoriteButton,
} from "../components/common/ActionButtons";
import BackButton from "../components/common/BackButton";

export default function PlaceDetail() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // 🆕 1. Lấy startCoords từ state được gửi sang
  const data = location.state?.place;
  const startCoords = location.state?.startCoords; 

  console.log("📍 [Detail] Received startCoords:", startCoords);

  if (!data) {
    navigate("/results");
    return null;
  }

  const place = {
    ...data,
    id: data.id,
    lat: data.lat,
    lon: data.lon,
    name: data.name || data.title,
    title: data.title || data.name || "Tên địa điểm",
    image: data.image || data.hero || data.image_url,
    description:
      data.overview ||
      data.description ||
      data.summarization ||
      "Chưa có mô tả chi tiết.",
    hashtags: Array.isArray(data.hashtags)
      ? data.hashtags
      : Array.isArray(data.tags)
      ? data.tags
      : [],
    address: data.address || "",
    rating:
      typeof data.rating === "number"
        ? data.rating
        : data.rating != null
        ? Number(data.rating)
        : null,
    openingHours:
      data.openingHours || data.opening_hours || data.open || "N/A",
    fav: !!data.fav,
  };  

  const [fav, setFav] = useState(place.fav);

  const renderStars = (rating) => {
    const isValid = typeof rating === "number" && !Number.isNaN(rating);
    return (
      <span
        style={{
          display: "flex",
          alignItems: "center",
          gap: "5px",
          fontWeight: "bold",
          color: "#333",
        }}
      >
        <span style={{ color: "#fbbf24", fontSize: "1.2rem" }}>★</span>
        <span>{isValid ? rating.toFixed(1) : "N/A"}</span>
        <span style={{ fontSize: "0.85rem", color: "#888", fontWeight: "normal" }}>
          / 5.0
        </span>
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
              {/* 🆕 2. Truyền startCoords vào nút DirectionButton */}
              <DirectionButton place={place} startCoords={startCoords} />
              
              <FavoriteButton
                placeId={place.id}
                isFav={fav}
                onToggle={(newStatus) => setFav(newStatus)}
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
                {place.hashtags.map((t) => `${t}`).join(" ")}
              </dd>
            </div>

            <div className="meta-row">
              <dt>Address:</dt>
              <dd>
                <span className="pin">📍</span>
                {place.address}
              </dd>
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