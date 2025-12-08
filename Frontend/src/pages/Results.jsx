import React, { useEffect, useState, useCallback, useRef } from "react";
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
import useWeather from "../hooks/useWeather";
import toErrorMessage from "../utils/toErrorMessage";
import PlaceCard from "../components/common/PlaceCard"; 
import BackButton from "../components/common/BackButton";

const DEFAULT_LATITUDE = 10.776;
const DEFAULT_LONGITUDE = 106.7;

export default function Results() {
   const location = useLocation();
   const navigate = useNavigate();

   // --- 1. XỬ LÝ TỌA ĐỘ VÀ FLAGS (SỬA LẠI ĐOẠN NÀY) ---
   
   // Sử dụng useRef để lưu trữ TẤT CẢ thông tin từ state ban đầu
   // Giúp dữ liệu tồn tại ngay cả khi location.state bị set về null sau đóa
   const locationDataRef = useRef({ 
      lat: location.state?.lat ?? DEFAULT_LATITUDE, 
      lng: location.state?.lng ?? DEFAULT_LONGITUDE,
      // Lưu luôn trạng thái logic vào Ref để không bị mất khi dọn state
      hasPicked: location.state?.lat != null && location.state?.lng != null, // <--- SỬA: Lưu vào ref
      shouldShowLoading: !!location.state?.showLoading // <--- SỬA: Lưu vào ref
   });
   
   // Lấy giá trị ổn định từ Ref
   const finalLat = locationDataRef.current.lat;
   const finalLng = locationDataRef.current.lng;
   
   // Dùng biến từ Ref thay vì đọc trực tiếp location.state
   const hasPickedLocation = locationDataRef.current.hasPicked; // <--- SỬA: Đọc từ Ref
   const showLoading = locationDataRef.current.shouldShowLoading; // <--- SỬA: Đọc từ Ref

   // 2. Weather Hook
   const { weatherData, fetchWeather } = useWeather();

   const [items, setItems] = useState([]);
   // State loading khởi tạo dựa trên biến ổn định
   const [loading, setLoading] = useState(showLoading && hasPickedLocation); 
   const [error, setError] = useState("");


   // --- EFFECT 1: Dọn dẹp state ---
   /*useEffect(() => {
      // Logic này vẫn giữ nguyên, nhưng giờ nó không làm hỏng hasPickedLocation nữa
      if (location.state) {
         navigate(".", { replace: true, state: null });
      }
   }, [navigate]); */


   // Khởi động Weather
   useEffect(() => {
      fetchWeather(finalLat, finalLng);
   }, [finalLat, finalLng, fetchWeather]);


   // 3. Logic Load Suggestions
   const loadRecommendations = useCallback(async () => {
      // Logic kiểm tra này giờ sẽ hoạt động đúng vì hasPickedLocation lấy từ Ref
      if (!hasPickedLocation) {
         console.log("⏳ [Results] Skipping recommendations: No location picked.");
         setLoading(false);
         return;
      }

      try {
         setLoading(true);
         setError("");

         // Kiểm tra localStorage
         const storedDuration = localStorage.getItem("durationTag");
         const parsedDuration = storedDuration ? JSON.parse(storedDuration) : null;
         const duration_tag = parsedDuration?.tag_id;

         const storedActs = localStorage.getItem("activities");
         const parsedActs = storedActs ? JSON.parse(storedActs) : [];
         const activities = Array.isArray(parsedActs) ? parsedActs : [];

         if (!duration_tag) {
            console.warn("⚠️ [Results] Missing duration tag inside localStorage"); // <--- Thêm log để debug
            setItems([]);
            setError("Missing duration selection.");
            return;
         }

         const latitude = finalLat;
         const longitude = finalLng;

         console.log("🚀 [Results] Requesting recommendations with:", { 
             latitude, 
             longitude, 
             duration_tag, 
             activities 
         });

         // Gọi API
         const recPromise = suggestionAPI.getRecommendations({ 
             latitude, 
             longitude, 
             duration_tag, 
             activity: activities // Kiểm tra lại backend dùng "activity" hay "activities"
         });
         
         const favPromise = favoriteAPI.getMyFavorites().catch((err) => {
            console.warn("⚠️ [Results] Failed to load favorites:", err.message);
            return []; 
         });

         const [rawPlaces, myFavoritesResponse] = await Promise.all([recPromise, favPromise]);

         // --- Xử lý Favorites ---
         let validFavorites = [];
         if (Array.isArray(myFavoritesResponse)) {
            validFavorites = myFavoritesResponse;
         } else if (myFavoritesResponse?.data && Array.isArray(myFavoritesResponse.data)) {
            validFavorites = myFavoritesResponse.data;
         } 
         const favSet = new Set(validFavorites.map((f) => f.id));

         // --- Xử lý Places ---
         let placesArray = [];
         if (Array.isArray(rawPlaces)) {
            placesArray = rawPlaces;
         } else if (rawPlaces?.recommendations && Array.isArray(rawPlaces.recommendations)) {
            placesArray = rawPlaces.recommendations;
         } else if (rawPlaces?.data && Array.isArray(rawPlaces.data)) {
            placesArray = rawPlaces.data; 
         }

         //console.log("✅ [Results] Received Places:", placesArray.length); // <--- Log kiểm tra kết quả

         if (placesArray.length === 0) {
            setItems([]);
            return;
         }

         // Mapping dữ liệu
         const mapped = placesArray.map((p) => ({
            id: p.id,
            title: p.name,
            image: p.image || p.image_url || "",
            description: p.summarization || p.description || "Chưa có mô tả chi tiết.",
            overview: p.overview || "",
            address: p.address || "",
            tags: Array.isArray(p.tags) ? p.tags : [],
            rating: typeof p.rating === "number" ? p.rating : p.rating != null ? Number(p.rating) : 0,
            openingHours: p.open || p.opening_hours || "N/A",   
            fav: favSet.has(p.id),
            lat: p.latitude || p.lat,
            lon: p.longitude || p.lon,
         }));

         setItems(mapped.slice(0, 4));

      } catch (err) {
         console.error("❌ [Results] Error loading data:", err);
         if (err.response && err.response.status === 404) {
               setItems([]);
         } else {
               setItems([]);
               setError(toErrorMessage(err, "Failed to load recommendations"));
         }
      } finally {
         setLoading(false);
      }
   }, [hasPickedLocation, finalLat, finalLng]); // <--- Dependency đã ổn định nhờ Ref


   // Effect kích hoạt Load Recommendations
   useEffect(() => {
      // Do hasPickedLocation lấy từ Ref nên nó luôn true (nếu đã pick) dù state đã bị xóa
      if (hasPickedLocation) {
         const delay = showLoading ? 800 : 0;
         const timer = setTimeout(loadRecommendations, delay);
         return () => clearTimeout(timer);
      }
   }, [hasPickedLocation, showLoading, loadRecommendations]); 
   
   const toggleFav = (id, newStatus) =>
      setItems((prev) =>
         prev.map((it) => (it.id === id ? { ...it, fav: newStatus } : it))
      );   

   const finalLoading = loading; 

   if (finalLoading) {
      return (
         <>
            <Navbar />
            <LoadingScreen message={"Matching your vibe and filtering results..."} />
         </>
      );
   }
   
   if (!hasPickedLocation || error || !items.length) {
      let title = "We couldn't find any destination.";
      let subtitle = error || "Please try again next time or adjust your vibe.";
      let ctaText = "Select your location";
      let ctaTo = "/location-picker";

      if (error || (items.length === 0 && hasPickedLocation)) { 
         ctaText = "Edit your vibe";
         ctaTo = "/profile";
      } else if (!hasPickedLocation) {
         title = "Please select a location first.";
         subtitle = "You were redirected here without a location selected.";
      }

      return (
         <>
            <Navbar />
            <EmptyState
               title={title}
               subtitle={subtitle}
               ctaText={ctaText}
               ctaTo={ctaTo}
            />
         </>
      );
   }
   console.log("📤 [Results] Sending startCoords to PlaceCard:", { lat: finalLat, lng: finalLng });
   return (
      <>
         <Navbar />
         <BackButton to="/location-picker"/>
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
                        <span>📍 Based on ({finalLat.toFixed(2)}, {finalLng.toFixed(2)})</span>
                        <span>|</span>
                        <span>🌤 {weatherData.temperature ?? weatherData.temp}°C</span>
                        {weatherData.description && <span>- {weatherData.description}</span>}
                  </div>
               )}
               <section className="results-list">
                  {items.map((it) => (
                     <PlaceCard 
                        key={it.id} 
                        place={it} 
                        onToggleFav={toggleFav} 
                        startCoords={{ lat: finalLat, lng: finalLng }} 
                     />
                  ))}
               </section>
            </div>
         </main>
      </>
   );
}