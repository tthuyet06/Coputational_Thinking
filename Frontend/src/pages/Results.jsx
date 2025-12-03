import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Navbar from "../components/layouts/Navbar";
import "../styles/Results.css";
import suggestionAPI from "../services/suggestionAPI";
import LoadingScreen from "./LoadingScreen";
import EmptyState from "./EmptyState";
import useGeolocation from "../hooks/useGeolocation";
import toErrorMessage from "../utils/toErrorMessage";
// 💡 IMPORT COMPONENTS MỚI Ở ĐÂY
import { DirectionButton, FavoriteButton } from "../components/common/ActionButtons"; 


// Tọa độ mặc định (Sài Gòn)
const DEFAULT_LATITUDE = 10.776;
const DEFAULT_LONGITUDE = 106.700;

// 💡 Loại bỏ function buildDirectionsUrl() vì nó đã được chuyển vào ActionButtons.jsx

function ResultCard({ item, onToggleFav }) {
  const navigate = useNavigate();
  
  const goToDetail = () => {
    // Truyền item object vào state của navigation
    navigate(`/details/${item.id}`, { state: { place: item } }); 
  };

  // 💡 openDirections đã không còn cần thiết vì logic đã nằm trong DirectionButton
  // const openDirections = (e) => {
  //   e.stopPropagation();
  //   window.open(buildDirectionsUrl(item), "_blank", "noopener,noreferrer");
  // };

  return (
    <article className="result-card" onClick={goToDetail}>
      {/* Giả định item.image là image_url */}
      <img className="result-img" src={item.image} alt={item.title} /> 
      <div className="result-body">
        <header className="result-header">
          <h3 className="result-title">{item.title}</h3>
          <div className="result-actions">
            
            {/* 💡 SỬ DỤNG DIRECTION BUTTON ĐÃ TÁCH */}
            <DirectionButton place={item} />

            {/* 💡 SỬ DỤNG FAVORITE BUTTON ĐÃ TÁCH */}
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
  
  // Lấy dữ liệu từ custom hook
  const { 
    location: geoLoc, 
    error: geoError, 
    isLoading: geoLoading, 
    getLocation 
  } = useGeolocation();

  const showLoading = !!location.state?.showLoading;

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(showLoading);
  const [error, setError] = useState("");

  // 1. Khởi động Geolocation và xóa state lịch sử
  useEffect(() => {
    // Xóa state.history
    if (location.state) {
      navigate(".", { replace: true, state: null });
    }
    // Bắt đầu lấy vị trí
    getLocation();
  }, [location.state, navigate, getLocation]); 
  
  // 2. Logic gọi API đề xuất
  const loadRecommendations = useCallback(async () => {
    try {
      setLoading(true); 
      setError("");

      // Lấy durationTag từ localStorage
      const stored = localStorage.getItem("durationTag");
      const parsed = stored ? JSON.parse(stored) : null;
      const duration_tag = parsed?.tag_id;

      const storedActs = localStorage.getItem("activities");
      const parsedActs = storedActs ? JSON.parse(storedActs) : [];
      const activity = parsedActs[0];

      if (!duration_tag) {
        setError("Missing duration selection. Please go back and choose your free time.");
        setItems([]);
        return;
      }
      if (!activity) {
        setError("Please select an activity before searching.");
        setItems([]);
        return;
      }
      // Chọn tọa độ: ưu tiên geoLoc, nếu không có thì dùng default
      const latitude = geoLoc?.lat ?? DEFAULT_LATITUDE;
      const longitude = geoLoc?.lng ?? DEFAULT_LONGITUDE;

      // Cảnh báo nếu dùng tọa độ default do lỗi Geolocation
      if (!geoLoc && geoError) {
          console.warn(`Using default location (${latitude}, ${longitude}) due to Geolocation error: ${geoError}`);
      }

      // Gọi API
      const places = await suggestionAPI.getRecommendations({
        latitude,
        longitude,
        duration_tag,
        activity,
      });

      // Map dữ liệu API về cấu trúc hiển thị
      const mapped = places.map((p) => ({
        id: p.id,
        title: p.name,
        image:
          p.image_url ||
          "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=80",
        description: p.description || "",
        address: p.address || "",
        tags: Array.isArray(p.tags) ? p.tags : [], // Đổi tên tags thành hashtags cho phù hợp với ResultCard
        hashtags: Array.isArray(p.tags) ? p.tags : [],
        fav: false,
      }));

      // 🔹 CHỈ GIỮ LẠI 2 ĐỊA ĐIỂM ĐẦU TIÊN (test chức năng tạm thời -> 4s)
      setItems(mapped.slice(0, 4));
    } catch (err) {
      // Chuẩn hóa lỗi API bằng toErrorMessage
      setError(toErrorMessage(err, "Failed to load recommendations"));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [geoLoc, geoError]); // Phụ thuộc vào tọa độ và lỗi geo

  // 3. Effect gọi API khi Geolocation đã hoàn tất
  useEffect(() => {
    // Chạy khi Geolocation hoàn thành (geoLoading = false) VÀ đã có kết quả/lỗi
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

  // 4. Logic Loading hiển thị cho người dùng
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

  // 5. Logic Error hiển thị
  const finalError = error || (geoError && !items.length ? geoError : "");
  
  if (finalError) {
    return (
      <>
        <Navbar />
        <EmptyState
          title="We couldn't find any destination."
          subtitle={finalError}
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

  // 6. Hiển thị kết quả
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