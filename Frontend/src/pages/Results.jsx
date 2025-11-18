import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Navbar from "../components/layouts/Navbar";
import LoadingScreen from "./LoadingScreen";
import EmptyState from "./EmptyState";
import "../styles/Results.css";
import suggestionAPI from "../services/suggestionAPI";
import toErrorMessage from "../utils/toErrorMessage"; // THÊM DÒNG IMPORT NÀY

/* ----------------- Helper: tạo link chỉ đường ----------------- */
function buildDirectionsUrl(place) {
  // ... (giữ nguyên hàm)
  const base = "https://www.google.com/maps/dir/?api=1";
  const dest = place.coords
    ? `${place.coords.lat},${place.coords.lng}`
    : encodeURIComponent(place.address || place.title);
  return `${base}&origin=Current+Location&destination=${dest}`;
}

/* 🔹 Chuẩn hóa dữ liệu place từ BE về format UI đang dùng */
function normalizePlace(place, index) {
  // ... (giữ nguyên hàm)
  // place = 1 item trong recommendations từ backend
  return {
    id: place.id ?? place.place_id ?? index,
    title: place.title ?? place.name ?? "Unknown place",
    image: place.image ?? place.image_url ?? "/placeholder.jpg",
    description: place.description ?? "",
    address: place.address ?? "",
    // nếu BE có trường latitude / longitude
    coords: place.coords
      ? place.coords
      : place.latitude && place.longitude
      ? { lat: place.latitude, lng: place.longitude }
      : null,
    // tags có thể là array hoặc string "#cafe,#chill"
    hashtags: Array.isArray(place.tags)
      ? place.tags
      : typeof place.tags === "string"
      ? place.tags
          .split(",")
          .map((t) => t.replace("#", "").trim())
          .filter(Boolean)
      : [],
    fav: false, // mặc định chưa favorite
  };
}

/* ----------------- Card ----------------- */
function ResultCard({ item, onToggleFav }) {
  // ... (giữ nguyên component)
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
              aria-label={`Chỉ đường đến ${item.title}`}
              title="Chỉ đường"
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
              title={item.fav ? "Bỏ yêu thích" : "Thêm vào yêu thích"}
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

/* ----- Page ----- */
export default function Results() {
  const location = useLocation();
  const navigate = useNavigate();

  const showLoading = !!location.state?.showLoading;

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(showLoading);
  const [error, setError] = useState("");

  // STATE CHO GEOLOCATION
  const [gpsLocation, setGpsLocation] = useState(null); // { lat, lng }
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState('');

  // clear state location cho back/forward
  useEffect(() => {
    if (location.state) {
      navigate(".", { replace: true, state: null });
    }
  }, [location.state, navigate]);

  // EFFECT 1: Lấy Vị trí GPS khi component mount
  useEffect(() => {
    if (!navigator.geolocation) {
        setGpsError('Geolocation is not supported by your browser.');
        return;
    }

    setGpsLoading(true);

    const handleSuccess = (position) => {
        setGpsLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
        });
        setGpsLoading(false);
    };

    const handleError = (err) => {
        setGpsLoading(false);
        let msg = "Could not retrieve location.";
        
        switch (err.code) {
            case err.PERMISSION_DENIED:
                msg = "Lỗi: Bạn đã từ chối cấp quyền truy cập vị trí. Vui lòng cho phép để tiếp tục.";
                break;
            case err.POSITION_UNAVAILABLE:
                msg = "Lỗi: Vị trí không xác định được.";
                break;
            case err.TIMEOUT:
                msg = "Lỗi: Hết thời gian chờ lấy vị trí.";
                break;
            default:
                msg = "Lỗi: Lỗi không xác định khi lấy vị trí.";
                break;
        }
        
        console.error("Geolocation Error (Console):", err.message, err.code); // GHI LỖI GPS RA CONSOLE
        setGpsError(msg); 
    };

    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
    });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 


  // 🔥 EFFECT 2: Gọi API /recommend, CHỈ chạy khi GPS đã hoàn thành
  useEffect(() => {
    if (gpsLoading) {
        setLoading(true); 
        return;
    }

    if (gpsError) {
        setError(gpsError); 
        setLoading(false);
        setItems([]);
        return;
    }
    
    if (!gpsLocation) {
        setLoading(false);
        return;
    }

    const loadResults = async () => {
      const delay = showLoading ? 800 : 0;

      try {
        setLoading(true);
        setError(""); // Clear lỗi API cũ

        if (delay > 0) {
          await new Promise((r) => setTimeout(r, delay));
        }

        const stored = JSON.parse(
          localStorage.getItem("recommendParams") || "{}"
        );
        
        const latitude = gpsLocation.lat;
        const longitude = gpsLocation.lng;
        
        const durationTag =
          stored.durationTag || stored.duration_tag || "short";

        const res = await suggestionAPI.getRecommendations({
          latitude,
          longitude,
          duration_tag: durationTag,
        });

        const raw = res.recommendations || [];
        const mapped = raw.map(normalizePlace);
        setItems(mapped);
      } catch (err) {
        // 🔥 GHI LỖI RA CONSOLE
        console.error("Load recommend error (Console):", err); 
      
        // Nếu backend trả 404 => treat như "không có kết quả", không phải error kỹ thuật
        if (err?.response?.status === 404) {
          setItems([]);
          setError(""); 
        } else {
          // 🔥 SỬ DỤNG toErrorMessage ĐỂ CHUẨN HÓA LỖI CHO UI
          const msg = toErrorMessage(err);
          setError(msg);
          setItems([]);
        }
      } finally {
        setLoading(false);
      }
    };

    loadResults();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gpsLoading, gpsLocation, gpsError]); 

  // Hiển thị Loading
  if (loading || gpsLoading) {
    return (
      <>
        <Navbar />
        <LoadingScreen 
          message={gpsLoading ? "Đang yêu cầu vị trí GPS của bạn..." : "Looking for the destination, please wait..."} 
        />
      </>
    );
  }

  // Hiển thị Lỗi hoặc Empty State
  if (!loading && (error || items.length === 0)) {
    return (
      <>
        <Navbar />
        <EmptyState
          title={
            error
              ? "We had trouble finding a destination for you."
              : "We can’t find any destination that matches your vibes."
          }
          subtitle={error || "Please try again next time."}
          ctaText="Edit your vibe"
          ctaTo="/profile"
        />
      </>
    );
  }

  const toggleFav = (id) =>
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, fav: !it.fav } : it))
    );

  // Hiển thị Kết quả
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