import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Navbar from "../components/layouts/Navbar";
import "../styles/Results.css";
import suggestionAPI from "../services/suggestionAPI";
import LoadingScreen from "./LoadingScreen";
import EmptyState from "./EmptyState";
import useGeolocation from "../hooks/useGeolocation";
import toErrorMessage from "../utils/toErrorMessage";
import {
  DirectionButton,
  FavoriteButton,
} from "../components/common/ActionButtons";

// Tọa độ mặc định (Sài Gòn)
const DEFAULT_LATITUDE = 10.776;
const DEFAULT_LONGITUDE = 106.7;

// ---------------- ResultCard ----------------
function ResultCard({ item, onToggleFav }) {
  const navigate = useNavigate();

  const goToDetail = () => {
    navigate(`/details/${item.id}`, { state: { place: item } });
  };

  const DEFAULT_IMAGE =
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=80";

  const imageSrc = item.image || item.image_url || DEFAULT_IMAGE;

  return (
    <article className="result-card" onClick={goToDetail}>
      <img className="result-img" src={imageSrc} alt={item.title} />
      <div className="result-body">
        <header className="result-header">
          <h3 className="result-title">{item.title}</h3>
          <div className="result-actions">
            <DirectionButton place={item} />
            <FavoriteButton
              isFav={item.fav}
              onToggle={() => onToggleFav(item.id)}
            />
          </div>
        </header>

        <p className="result-desc">{item.description}</p>
        <p className="result-addr">
          <span className="pin">📍</span>
          {item.address}
        </p>
        <p className="result-tags">
          {(item.hashtags || []).map((t, idx) => (
            <span key={`${item.id}-${idx}`}>#{t} </span>
          ))}
        </p>
      </div>
    </article>
  );
}

// ---------------- Results Page ----------------
export default function Results() {
  const location = useLocation();
  const navigate = useNavigate();

  const {
    location: geoLoc,
    error: geoError,
    isLoading: geoLoading,
    getLocation,
  } = useGeolocation();

  const showLoading = !!location.state?.showLoading;

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(showLoading);
  const [error, setError] = useState("");

  // 1. Khởi động Geolocation và xóa state lịch sử
  useEffect(() => {
    if (location.state) {
      navigate(".", { replace: true, state: null });
    }
    getLocation();
  }, [location.state, navigate, getLocation]);

  // 2. Logic gọi API đề xuất
  const loadRecommendations = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      // duration_tag bắt buộc
      const storedDuration = localStorage.getItem("durationTag");
      const parsedDuration = storedDuration ? JSON.parse(storedDuration) : null;
      const duration_tag = parsedDuration?.tag_id;

      // activities: có thể rỗng
      const storedActs = localStorage.getItem("activities");
      const parsedActs = storedActs ? JSON.parse(storedActs) : [];
      const activities = Array.isArray(parsedActs) ? parsedActs : [];

      if (!duration_tag) {
        setItems([]);
        setError(
          "Missing duration selection. Please go back and choose your free time."
        );
        return;
      }

      const latitude = geoLoc?.lat ?? DEFAULT_LATITUDE;
      const longitude = geoLoc?.lng ?? DEFAULT_LONGITUDE;

      if (!geoLoc && geoError) {
        console.warn(
          `Using default location (${latitude}, ${longitude}) due to Geolocation error: ${geoError}`
        );
      }

      const places = await suggestionAPI.getRecommendations({
        latitude,
        longitude,
        duration_tag,
        activity: activities, // BE nhận List[str], có thể rỗng
      });

      console.log("places from API:", places);

      const mapped = places.map((p) => ({
        id: p.id,
        title: p.name,
        image: p.image || p.image_url || "",
        image_url: p.image_url || "",
        description: p.description || p.overview || "",
        address: p.address || "",
        tags: Array.isArray(p.tags) ? p.tags : [],
        hashtags: Array.isArray(p.tags) ? p.tags : [],
        fav: false,
        // Nếu DirectionButton cần lat/lon thì thêm:
        lat: p.latitude || p.lat,
        lon: p.longitude || p.lon,
      }));

      setItems(mapped.slice(0, 4));
    } catch (err) {
      setItems([]);
      setError(toErrorMessage(err, "Failed to load recommendations"));
    } finally {
      setLoading(false);
    }
  }, [geoLoc, geoError]);

  // 3. Effect gọi API khi Geolocation đã hoàn tất
  useEffect(() => {
    if (!geoLoading && (geoLoc || geoError)) {
      const delay = showLoading ? 800 : 0;
      const timer = setTimeout(loadRecommendations, delay);
      return () => clearTimeout(timer);
    }
  }, [geoLoc, geoError, geoLoading, showLoading, loadRecommendations]);

  const toggleFav = (id) =>
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, fav: !it.fav } : it))
    );

  // 4. Loading
  const finalLoading = loading || (geoLoading && !geoLoc && !geoError);

  if (finalLoading) {
    let msg = "Looking for the destination, please wait...";
    if (geoLoading) {
      msg = "Getting your current location...";
    } else if (loading) {
      msg = "Matching your vibe and filtering results...";
    }
    return (
      <>
        <Navbar />
        <LoadingScreen message={msg} />
      </>
    );
  }

  // 5. Nếu KHÔNG có item nào → mới xét error & EmptyState
  const finalError = error || geoError || "";

  if (!items.length) {
    const subtitle =
      finalError || "Please try again next time or adjust your vibe.";
    return (
      <>
        <Navbar />
        <EmptyState
          title="We couldn't find any destination."
          subtitle={subtitle}
          ctaText="Edit your vibe"
          ctaTo="/profile"
        />
      </>
    );
  }

  // 6. Có items rồi → LUÔN hiển thị kết quả, bỏ qua error cũ
  return (
    <>
      <Navbar />
      <main className="results-wrap">
        <div className="results-inner">
          <h1 className="results-title">
            Here’s What
            <br />
            Matches Your Vibe!
          </h1>

          <section className="results-list">
            {items.map((it) => (
              <ResultCard key={it.id} item={it} onToggleFav={toggleFav} />
            ))}
          </section>
        </div>
      </main>
    </>
  );
}
