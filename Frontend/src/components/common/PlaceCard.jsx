// src/components/common/PlaceCard.jsx
//import React from "react";
import { useNavigate } from "react-router-dom";
import { DirectionButton, FavoriteButton } from "./ActionButtons";

const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=80";

export default function PlaceCard({ place, onToggleFav, startCoords }) {
  const navigate = useNavigate();
  console.log(`🔍 [PlaceCard] Card "${place.title}" received startCoords:`, startCoords);

  const goToDetail = () => {
    navigate(`/details/${place.id}`, { state: { place: place, startCoords: startCoords }  });
  };

  const imageSrc = place.image || place.image_url || DEFAULT_IMAGE;
  const title = place.title || place.name;
  const description =
    place.description || place.summarization || "Chưa có mô tả chi tiết.";
  const tags = place.hashtags || place.tags || [];

  return (
    <article className="result-card" onClick={goToDetail}>
      <img className="result-img" src={imageSrc} alt={title} />
      <div className="result-body">
        <header className="result-header">
          <h3 className="result-title">{title}</h3>

          <div className="result-actions">
            <DirectionButton place={place} startCoords={startCoords}/>
            <FavoriteButton
              placeId={place.id}
              isFav={!!place.fav}
              onToggle={(newStatus) => onToggleFav?.(place.id, newStatus)}
            />
          </div>
        </header>

        <p className="result-desc">{description}</p>

        <p className="result-addr">
          <span className="pin">📍</span>
          {place.address}
        </p>

        <p className="result-tags">
          {Array.isArray(tags) &&
            tags.map((t, idx) => (
              <span key={`${place.id}-${idx}`}>{t} </span>
            ))}
        </p>
      </div>
    </article>
  );
}
