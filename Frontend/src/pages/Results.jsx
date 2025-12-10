// src/pages/Results.jsx
import React, { useEffect, useState, useCallback, useRef } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "../components/layouts/Navbar";
import "../styles/Results.css";

// Import Services
import suggestionAPI from "../services/suggestionAPI";
import preferenceAPI from "../services/preferenceAPI";
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
const STORAGE_KEY = "last_search_results"; 

export default function Results() {
   const location = useLocation();

   // --- 1. XỬ LÝ TỌA ĐỘ VÀ FLAGS ---
   const locationDataRef = useRef({ 
      lat: location.state?.lat ?? DEFAULT_LATITUDE, 
      lng: location.state?.lng ?? DEFAULT_LONGITUDE,
      hasPicked: location.state?.lat != null && location.state?.lng != null,
      showLoading: !!location.state?.showLoading
   });
   
   //Set final pick
   const finalLat = locationDataRef.current.lat;
   const finalLng = locationDataRef.current.lng;
   const hasPickedLocation = locationDataRef.current.hasPicked;

   // --- HÀM HELPER ĐỌC CACHE ĐỒNG BỘ ---
   const getCachedDataSync = () => {
       try {
           const cached = sessionStorage.getItem(STORAGE_KEY);
           if (!cached) return [];
           const parsed = JSON.parse(cached);
           if (parsed.lat === finalLat && parsed.lng === finalLng && Array.isArray(parsed.items)) {
               return parsed.items;
           }
           return [];
       } catch (e) {
           return [];
       }
   };

   // --- STATE KHỞI TẠO --- (để tránh false fallbacl)
   const [items, setItems] = useState(() => getCachedDataSync());
   
   const [loading, setLoading] = useState(() => {
       const cachedItems = getCachedDataSync();
       if (cachedItems.length > 0) return false; 
       return locationDataRef.current.showLoading && hasPickedLocation;
   });
   
   const [error, setError] = useState("");

   // 2. Weather Hook (Cập nhật thời tiết hiện tại)
   const { weatherData, fetchWeather } = useWeather();

   useEffect(() => {
      fetchWeather(finalLat, finalLng);
   }, [finalLat, finalLng, fetchWeather]);

   // 3. Logic Load Suggestions
   const loadRecommendations = useCallback(async () => {
      if (!hasPickedLocation) {
         setLoading(false);
         return;
      }

      if (items.length > 0) {
          console.log("⚡ [Results] Used cached data, skipping API.");
          setLoading(false);
          return;
      }

      try {
         setLoading(true);
         setError("");

         // --- BƯỚC 1: Chuẩn bị tham số cơ bản ---
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

         const latitude = finalLat;
         const longitude = finalLng;

         // --- BƯỚC 2: GỌI API ---
         console.log("🚀 [Results] Fetching Hobbies & Favorites first...");

         // 2.1: Lấy Hobbies và Favorites song song trước
         // Vì Recs cần Hobby, nhưng Favs thì độc lập, nên ta gọi gom 2 cái này
         const [userHobbies, myFavoritesRaw] = await Promise.all([
             preferenceAPI.getMyHobbies().catch((err) => {
                 console.warn("⚠️ Failed to load hobbies:", err);
                 return [];
             }),
             favoriteAPI.getMyFavorites().catch(() => [])
         ]);

         console.log("🎨 [Results] User Hobbies:", userHobbies);
         console.log("🚀 [Results] Requesting Recommendations...");

         // 2.2: Gọi API Recommendations với hobby vừa lấy được
         const rawPlaces = await suggestionAPI.getRecommendations({ 
             latitude, 
             longitude, 
             duration_tag, 
             activity: activities,
             hobby: userHobbies 
         });

         // --- BƯỚC 3: Xử lý danh sách Favorites để đối chiếu ---
         let validFavs = [];
         if (Array.isArray(myFavoritesRaw)) validFavs = myFavoritesRaw;
         else if (Array.isArray(myFavoritesRaw?.data)) validFavs = myFavoritesRaw.data;
         else if (Array.isArray(myFavoritesRaw?.favorites)) validFavs = myFavoritesRaw.favorites;

         const favSet = new Set(validFavs.map(f => f.id));

         // --- BƯỚC 4: Xử lý danh sách Recommendations ---
         let placesArray = [];
         if (Array.isArray(rawPlaces)) placesArray = rawPlaces;
         else if (Array.isArray(rawPlaces?.recommendations)) placesArray = rawPlaces.recommendations;
         else if (Array.isArray(rawPlaces?.data)) placesArray = rawPlaces.data;

         if (placesArray.length === 0) {
            setItems([]);
            sessionStorage.removeItem(STORAGE_KEY); 
            return;
         }

         // Mapping dữ liệu & GÁN FAV TỪ DANH SÁCH ĐỐI CHIẾU
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
            
            // Check ID có trong favSet không
            fav: favSet.has(p.id), 
            
            lat: p.latitude || p.lat,
            lon: p.longitude || p.lon,
         })).slice(0, 4);

         setItems(mapped);

         // --- BƯỚC 5: Lưu Cache ---
         const dataToCache = {
             lat: finalLat,
             lng: finalLng,
             items: mapped //lưu dữ liệu tránh call api
         };
         sessionStorage.setItem(STORAGE_KEY, JSON.stringify(dataToCache));

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
   }, [hasPickedLocation, finalLat, finalLng, items.length]); 


   // Effect kích hoạt load
   useEffect(() => {
      if (hasPickedLocation && items.length === 0) {
          const delay = locationDataRef.current.showLoading ? 800 : 0;
          const timer = setTimeout(loadRecommendations, delay);
          return () => clearTimeout(timer);
      }
   }, [hasPickedLocation, loadRecommendations, items.length]); 
   
   // Hàm toggleFav
   const toggleFav = (id, newStatus) => {
      setItems((prev) => {
         const updatedItems = prev.map((it) => (it.id === id ? { ...it, fav: newStatus } : it));
         
         const currentCache = sessionStorage.getItem(STORAGE_KEY);
         if (currentCache) {
             const parsedCache = JSON.parse(currentCache);
             if (parsedCache.lat === finalLat && parsedCache.lng === finalLng) {
                 parsedCache.items = updatedItems;
                 sessionStorage.setItem(STORAGE_KEY, JSON.stringify(parsedCache));
             }
         }
         return updatedItems;
      });
   };

   // UI Rendering logic (giữ nguyên)
   if (loading) {
      return (
         <>
            <Navbar />
            <LoadingScreen message={"Matching your vibe and filtering results..."} />
         </>
      );
   }
   
   const hasItems = items.length > 0;

   if (!hasPickedLocation || (!hasItems && error) || (!hasItems && !loading)) {
      let title = "We couldn't find any destination.";
      let subtitle = error || "Please try again next time or adjust your vibe.";
      let ctaText = "Select your location";
      let ctaTo = "/location-picker";

      if (error || (hasPickedLocation && !hasItems)) { 
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