// src/pages/Results.jsx
import React, { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Navbar from "../components/layouts/Navbar";
import "../styles/Results.css";

// Import Services
import suggestionAPI from "../services/suggestionAPI";
// Đã xóa import favoriteAPI theo yêu cầu

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
   // const navigate = useNavigate(); // Nếu không dùng navigate trong useEffect thì có thể comment lại để tránh warning

   // --- 1. XỬ LÝ TỌA ĐỘ VÀ FLAGS ---
   
   // Sử dụng useRef để lưu trữ TẤT CẢ thông tin từ state ban đầu
   const locationDataRef = useRef({ 
      lat: location.state?.lat ?? DEFAULT_LATITUDE, 
      lng: location.state?.lng ?? DEFAULT_LONGITUDE,
      hasPicked: location.state?.lat != null && location.state?.lng != null,
      shouldShowLoading: !!location.state?.showLoading
   });
   
   const finalLat = locationDataRef.current.lat;
   const finalLng = locationDataRef.current.lng;
   const hasPickedLocation = locationDataRef.current.hasPicked;
   const showLoading = locationDataRef.current.shouldShowLoading;

   // 2. Weather Hook
   const { weatherData, fetchWeather } = useWeather();

   const [items, setItems] = useState([]);
   const [loading, setLoading] = useState(showLoading && hasPickedLocation); 
   const [error, setError] = useState("");

   // Khởi động Weather
   useEffect(() => {
      fetchWeather(finalLat, finalLng);
   }, [finalLat, finalLng, fetchWeather]);

   // 3. Logic Load Suggestions
   const loadRecommendations = useCallback(async () => {
      if (!hasPickedLocation) {
         console.log("⏳ [Results] Skipping recommendations: No location picked.");
         setLoading(false);
         return;
      }

      try {
         setLoading(true);
         setError("");

         // --- Lấy dữ liệu từ LocalStorage ---
         
         // 1. Duration Tag
         const storedDuration = localStorage.getItem("durationTag");
         const parsedDuration = storedDuration ? JSON.parse(storedDuration) : null;
         const duration_tag = parsedDuration?.tag_id;

         // 2. Activities
         const storedActs = localStorage.getItem("activities");
         const parsedActs = storedActs ? JSON.parse(storedActs) : [];
         const activities = Array.isArray(parsedActs) ? parsedActs : [];

         // 3. Hobbies (Mới thêm) - Lấy từ key "user_hobbies" đã lưu ở trang Preferences
         const storedHobbies = localStorage.getItem("user_hobbies");
         const parsedHobbies = storedHobbies ? JSON.parse(storedHobbies) : [];
         const hobbies = Array.isArray(parsedHobbies) ? parsedHobbies : [];

         if (!duration_tag) {
            console.warn("⚠️ [Results] Missing duration tag inside localStorage");
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
             activities,
             hobbies 
         });

         // Gọi API (Chỉ gọi 1 API suggestion, bỏ favoriteAPI)
         const rawPlaces = await suggestionAPI.getRecommendations({ 
             latitude, 
             longitude, 
             duration_tag, 
             activity: activities,
             hobby: hobbies // Truyền danh sách hobby vào đây
         });
         
         // --- Xử lý Places ---
         let placesArray = [];
         // Kiểm tra cấu trúc trả về (có thể là mảng trực tiếp, hoặc object chứa data)
         if (Array.isArray(rawPlaces)) {
            placesArray = rawPlaces;
         } else if (rawPlaces?.recommendations && Array.isArray(rawPlaces.recommendations)) {
            placesArray = rawPlaces.recommendations;
         } else if (rawPlaces?.data && Array.isArray(rawPlaces.data)) {
            placesArray = rawPlaces.data; 
         }

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
            
            // --- THAY ĐỔI Ở ĐÂY ---
            // Thay vì dùng favSet.has(id), ta lấy trực tiếp từ biến API cung cấp
            // Giả sử backend trả về field 'is_liked' hoặc 'fav' hoặc 'is_favorite'
            fav: !!(p.is_fav || p.Favorite || p.is_favorite), 
            
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
   }, [hasPickedLocation, finalLat, finalLng]); 


   // Effect kích hoạt Load Recommendations
   useEffect(() => {
      if (hasPickedLocation) {
         const delay = showLoading ? 800 : 0;
         const timer = setTimeout(loadRecommendations, delay);
         return () => clearTimeout(timer);
      }
   }, [hasPickedLocation, showLoading, loadRecommendations]); 
   
   // Hàm toggleFav (Update UI giả lập trước khi gọi API add/remove fav nếu cần)
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