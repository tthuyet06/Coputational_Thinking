import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Navbar from "../components/layouts/Navbar";
import "../styles/Results.css";

// Import Services
import suggestionAPI from "../services/suggestionAPI";
import favoriteAPI from "../services/favoriteAPI"; 

// Import Components
import LoadingScreen from "./LoadingScreen";
import EmptyState from "./EmptyState";

// Import Hooks & Utils
import useGeolocation from "../hooks/useGeolocation";
import useWeather from "../hooks/useWeather";
import toErrorMessage from "../utils/toErrorMessage";
import PlaceCard from "../components/common/PlaceCard";
import BackButton from "../components/common/BackButton";

const DEFAULT_LATITUDE = 10.776;
const DEFAULT_LONGITUDE = 106.7;

// ---------------- Results Page ----------------
export default function Results() {
  const location = useLocation();
  const navigate = useNavigate();

  // 1. Geolocation Hook
  const {
    location: geoLoc,
    error: geoError,
    isLoading: geoLoading,
    getLocation,
  } = useGeolocation();

  // 2. Weather Hook
  const { weatherData, fetchWeather } = useWeather();
  const showLoading = !!location.state?.showLoading;

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(showLoading);
  const [error, setError] = useState("");

  // Khởi động GPS
  useEffect(() => {
    if (location.state) {
      navigate(".", { replace: true, state: null });
    }
    getLocation();
  }, [location.state, navigate, getLocation]);

  // Khởi động Weather
  useEffect(() => {
    if (geoLoading) return;
    if (!geoLoc && !geoError) return; // Chỉ chạy khi đã có kết quả GPS (thành công hoặc lỗi)
    
    const lat = geoLoc?.lat ?? DEFAULT_LATITUDE;
    const lng = geoLoc?.lng ?? DEFAULT_LONGITUDE;
    fetchWeather(lat, lng);
  }, [geoLoading, geoLoc, geoError, fetchWeather]);


  // 3. Logic Load Suggestions (Đã sửa lỗi hiển thị 404 ảo)
  const loadRecommendations = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const storedDuration = localStorage.getItem("durationTag");
      const parsedDuration = storedDuration ? JSON.parse(storedDuration) : null;
      const duration_tag = parsedDuration?.tag_id;

      const storedActs = localStorage.getItem("activities");
      const parsedActs = storedActs ? JSON.parse(storedActs) : [];
      const activities = Array.isArray(parsedActs) ? parsedActs : [];

      if (!duration_tag) {
        setItems([]);
        setError("Missing duration selection.");
        return;
      }

      const latitude = geoLoc?.lat ?? DEFAULT_LATITUDE;
      const longitude = geoLoc?.lng ?? DEFAULT_LONGITUDE;

      console.log("🚀 [Results] Requesting recommendations...");

      // --- SỬA LỖI: Tách luồng để đảm bảo an toàn ---
      
      // A. Gọi API Gợi ý (Quan trọng nhất)
      const recPromise = suggestionAPI.getRecommendations({
        latitude,
        longitude,
        duration_tag,
        activity: activities,
      });

      // B. Gọi API Favorite (Phụ - nếu lỗi 401 do chưa login thì bỏ qua)
      const favPromise = favoriteAPI.getMyFavorites().catch((err) => {
        console.warn("⚠️ [Results] Failed to load favorites (User might be guest):", err.message);
        return []; // Trả về mảng rỗng để không làm crash Promise.all
      });

      // C. Chờ cả 2 xong
      const [rawPlaces, myFavoritesResponse] = await Promise.all([recPromise, favPromise]);

  // --- DEBUG: Xem nó trả về cái gì ---
  console.log("📦 [Results] Raw Places:", rawPlaces);
  console.log("❤️ [Results] Favorites Response:", myFavoritesResponse);

 
  let validFavorites = [];

  if (Array.isArray(myFavoritesResponse)) {
    // Trường hợp 1: API trả về mảng trực tiếp (nếu có interceptor xử lý trước)
    validFavorites = myFavoritesResponse;
  } else if (myFavoritesResponse?.data && Array.isArray(myFavoritesResponse.data)) {
    // Trường hợp 2: Axios trả về object bọc dữ liệu trong .data (Phổ biến nhất)
    validFavorites = myFavoritesResponse.data;
  } else {
    console.warn("⚠️ Favorites response is not an array. Defaulting to empty.");
    validFavorites = [];
  }

  let placesArray = [];

  if (Array.isArray(rawPlaces)) {
    placesArray = rawPlaces;
  } else if (rawPlaces?.recommendations && Array.isArray(rawPlaces.recommendations)) {
    placesArray = rawPlaces.recommendations;
  } else if (rawPlaces?.data && Array.isArray(rawPlaces.data)) {
    // Phòng hờ BE trả về array bọc trong .data
    placesArray = rawPlaces.data; 
  } else {
    placesArray = [];
  }

  if (placesArray.length === 0) {
    setItems([]);
    return;
  }

  // -----------------------------------------------------------
  // 👇 3. TIẾP TỤC LOGIC MAP (Dùng validFavorites đã chuẩn hóa)
  // -----------------------------------------------------------
  
  // Tạo Set chứa các ID đã thích để tra cứu cho nhanh O(1)
  const favSet = new Set(validFavorites.map((f) => f.id));

  const mapped = placesArray.map((p) => {
    return {
      id: p.id,
      title: p.name,
      image: p.image || p.image_url || "",
      image_url: p.image_url || "",
      
      description: p.summarization || p.description || "Chưa có mô tả chi tiết.",
      overview: p.overview || "",
      address: p.address || "",
      tags: Array.isArray(p.tags) ? p.tags : [],
      hashtags: Array.isArray(p.tags) ? p.tags : [],
      rating:
        typeof p.rating === "number"
          ? p.rating
          : p.rating != null
          ? Number(p.rating)
          : 0,
      openingHours: p.open || p.opening_hours || "N/A",  // ✅
      // ✅ So sánh ID của Place với Set ID trong Favorites
      fav: favSet.has(p.id),


      
      lat: p.latitude || p.lat,
      lon: p.longitude || p.lon,
    };
  });

  setItems(mapped.slice(0, 4));

    } catch (err) {
      console.error("❌ [Results] Error loading data:", err);
      // Nếu lỗi 404 thật sự từ BE (BE báo không tìm thấy) -> Hiển thị Empty
      if (err.response && err.response.status === 404) {
          setItems([]);
      } else {
          setItems([]);
          setError(toErrorMessage(err, "Failed to load recommendations"));
      }
    } finally {
      setLoading(false);
    }
  }, [geoLoc, geoError]); // Bỏ fetchWeather khỏi dependency để tránh loop

  // Effect kích hoạt
  useEffect(() => {
    if (!geoLoading && (geoLoc || geoError)) {
      const delay = showLoading ? 800 : 0;
      const timer = setTimeout(loadRecommendations, delay);
      return () => clearTimeout(timer);
    }
  }, [geoLoc, geoError, geoLoading, showLoading, loadRecommendations]);

  const toggleFav = (id, newStatus) =>
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, fav: newStatus } : it))
    );  

  // --- RENDER ---
  const finalLoading = loading || (geoLoading && !geoLoc && !geoError);

  if (finalLoading) {
    let msg = "Looking for the destination, please wait...";
    if (geoLoading) msg = "Getting your current location...";
    else if (loading) msg = "Matching your vibe and filtering results...";
    
    return (
      <>
        <Navbar />
        <LoadingScreen message={msg} />
      </>
    );
  }

  // Logic hiển thị Empty State
  // Nếu có lỗi API (error) HOẶC không có item nào
  if (error || !items.length) {
    const subtitle = error || "Please try again next time or adjust your vibe.";
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

  return (
    <>
      <Navbar />
      <BackButton to="/home"/>
      <main className="results-wrap">
        <div className="results-inner">
          <h1 className="results-title">
            Here’s What Matches Your Vibe!
          </h1>

          {weatherData && (
            <div className="weather-info" style={{ 
                marginBottom: '20px', 
                padding: '8px 16px', 
                backgroundColor: 'rgba(255, 255, 255, 0.8)', 
                borderRadius: '20px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.9rem',
                color: '#333'
            }}>
                <span>🌤 {weatherData.temperature ?? weatherData.temp}°C</span>
                {weatherData.description && <span>- {weatherData.description}</span>}
            </div>
          )}
          <section className="results-list">
            {items.map((it) => (
              <PlaceCard key={it.id} place={it} onToggleFav={toggleFav} />
            ))}
          </section>
        </div>
      </main>
    </>
  );
}
