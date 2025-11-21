import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Navbar from "../components/layouts/Navbar";
import "../styles/Results.css";
import suggestionAPI from "../services/suggestionAPI";
import LoadingScreen from "./LoadingScreen";
import EmptyState from "./EmptyState";

function buildDirectionsUrl(place) {
  const base = "https://www.google.com/maps/dir/?api=1";
  const dest = encodeURIComponent(place.address || place.name);
  return `${base}&origin=Current+Location&destination=${dest}`;
}

function ResultCard({ item, onToggleFav }) {
  const navigate = useNavigate();

  const goToDetail = () => navigate(`/details/${item.id}`);

  const openDirections = (e) => {
    e.stopPropagation();
    window.open(buildDirectionsUrl(item), "_blank", "noopener,noreferrer");
  };

  return (
    <article className="result-card" onClick={goToDetail}>
      <img className="result-img" src={item.image} alt={item.title} />
      <div className="result-body">
        <header className="result-header">
          <h3 className="result-title">{item.title}</h3>
          <div className="result-actions">
            <button
              className="icon-btn dir-btn"
              onClick={openDirections}
              aria-label={`Direction to ${item.title}`}
              title="Direction"
              onMouseDown={(e) => e.preventDefault()}
            >
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

            <button
              className={`fav-btn ${item.fav ? "is-fav" : ""}`}
              aria-label={item.fav ? "Unfavorite" : "Favorite"}
              onClick={(e) => {
                e.stopPropagation();
                onToggleFav(item.id);
              }}
              title={item.fav ? "Remove from favorites" : "Add to favorites"}
            >
              <svg width="22" height="22" viewBox="0 0 24 24">
                <path d="M12 21s-6.7-4.1-9.6-7.6A6.1 6.1 0 0 1 12 5.3a6.1 6.1 0 0 1 9.6 8.1C18.7 16.9 12 21 12 21z" />
              </svg>
            </button>
          </div>
        </header>

        <p className="result-desc">{item.description}</p>
        <p className="result-addr">
          <span className="pin">📍</span>
          {item.address}
        </p>
        <p className="result-tags">
          {item.hashtags.map((t) => (
            <span key={t}>#{t} </span>
          ))}
        </p>
      </div>
    </article>
  );
}

export default function Results() {
  const location = useLocation();
  const navigate = useNavigate();

  const showLoading = !!location.state?.showLoading;

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(showLoading);
  const [error, setError] = useState("");

  // Clear state.history để Back không lặp lại loading
  useEffect(() => {
    if (location.state) {
      navigate(".", { replace: true, state: null });
    }
  }, [location.state, navigate]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError("");

        // Lấy durationTag từ localStorage
        const stored = localStorage.getItem("durationTag");
        const parsed = stored ? JSON.parse(stored) : null;
        const duration_tag = parsed?.tag_id;

        if (!duration_tag) {
          setError("Missing duration selection. Please go back and choose your free time.");
          setItems([]);
          return;
        }

        // Lấy geolocation (nếu fail thì chọn toạ độ default Sài Gòn)
        let latitude = 10.776;
        let longitude = 106.700;
        try {
          const pos = await new Promise((resolve, reject) => {
            if (!("geolocation" in navigator)) return reject(new Error("No geolocation"));
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 8000,
              maximumAge: 60000,
            });
          });
          latitude = pos.coords.latitude;
          longitude = pos.coords.longitude;
        } catch {
          // dùng default, không crash
        }

        const places = await suggestionAPI.getRecommendations({
          latitude,
          longitude,
          duration_tag,
        });

        const mapped = places.map((p) => ({
          id: p.id,
          title: p.name,
          image:
            p.image_url ||
            "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=80",
          description: p.description || "",
          address: p.address || "",
          hashtags: Array.isArray(p.tags) ? p.tags : [],
          fav: false,
        }));

        // 🔹 CHỈ GIỮ LẠI 2 ĐỊA ĐIỂM ĐẦU TIÊN
        setItems(mapped.slice(0, 2));
      } catch (err) {
        setError(
          typeof err === "string"
            ? err
            : err?.message || "Failed to load recommendations"
        );
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    const delay = showLoading ? 800 : 0;
    setTimeout(load, delay);
  }, []); // only on mount

  const toggleFav = (id) =>
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, fav: !it.fav } : it))
    );

  if (loading) {
    return (
      <>
        <Navbar />
        <LoadingScreen message="Looking for the destination, please wait..." />
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <EmptyState
          title="We couldn't find any destination."
          subtitle={error}
          ctaText="Edit your vibe"
          ctaTo="/profile"
        />
      </>
    );
  }

  if (!items.length) {
    return (
      <>
        <Navbar />
        <EmptyState
          title="We can’t find any destination that matches your vibes."
          subtitle="Please try again next time."
          ctaText="Edit your vibe"
          ctaTo="/profile"
        />
      </>
    );
  }

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
