// src/pages/Results.jsx
import React, { useEffect, useState, useCallback, useRef } from "react";
import { useLocation } from "react-router-dom"; // Bỏ useNavigate nếu không dùng
import Navbar from "../components/layouts/Navbar";
import "../styles/Results.css";

// Import Services
import suggestionAPI from "../services/suggestionAPI";
import preferenceAPI from "../services/preferenceAPI"; // <--- Import API user

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

   // --- 1. XỬ LÝ TỌA ĐỘ VÀ FLAGS ---
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

         // --- BƯỚC 1: Lấy dữ liệu cấu hình từ LocalStorage (Duration, Activity) ---
         const storedDuration = localStorage.getItem("durationTag");
         const parsedDuration = storedDuration ? JSON.parse(storedDuration) : null;
         const duration_tag = parsedDuration?.tag_id;

         const storedActs = localStorage.getItem("activities");
         const parsedActs = storedActs ? JSON.parse(storedActs) : [];
         const activities = Array.isArray(parsedActs) ? parsedActs : [];

         if (!duration_tag) {
            console.warn("⚠️ [Results] Missing duration tag inside localStorage");
            setItems([]);
            setError("Missing duration selection.");
            return;
         }

         // --- BƯỚC 2: Gọi API lấy Hobby của User (Thay vì lấy local) ---
         let userHobbies = [];
         try {
            // Gọi api getMyHobbies từ preferenceAPI
            userHobbies = await preferenceAPI.getMyHobbies();
         } catch (hobbyErr) {
            console.warn("⚠️ [Results] Failed to fetch user hobbies, continuing with empty list.", hobbyErr);
            // Vẫn tiếp tục chạy dù lỗi lấy hobby, coi như hobby rỗng
            userHobbies = [];
         }

         const latitude = finalLat;
         const longitude = finalLng;

         console.log("🚀 [Results] Requesting recommendations with:", { 
             latitude, 
             longitude, 
             duration_tag, 
             activities,
             hobbies: userHobbies 
         });

         // --- BƯỚC 3: Gọi API Recommendation ---
         // Truyền hobby vừa lấy được vào đây
         const rawPlaces = await suggestionAPI.getRecommendations({ 
             latitude, 
             longitude, 
             duration_tag, 
             activity: activities,
             hobby: userHobbies 
         });
         
         // --- BƯỚC 4: Xử lý dữ liệu trả về ---
         let placesArray = [];
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
            
            // --- XỬ LÝ FAV: Lấy trực tiếp từ response ---
            // Kiểm tra các trường có thể backend trả về (is_fav, is_liked, ...)
            fav: !!(p.is_fav || p.is_liked || p.Favorite || p.is_favorite), 
            
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
   
   // Hàm toggleFav: Chỉ update UI tạm thời
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