// src/pages/Results.jsx
import React, { useEffect, useState, useCallback, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../components/layouts/Navbar";
import "../styles/Results.css";

import suggestionAPI from "../services/suggestionAPI";
import preferenceAPI from "../services/preferenceAPI";
import favoriteAPI from "../services/favoriteAPI";

import LoadingScreen from "./LoadingScreen";
import EmptyState from "./EmptyState";
import useWeather from "../hooks/useWeather";
import toErrorMessage from "../utils/toErrorMessage";
import PlaceCard from "../components/common/PlaceCard"; 
import BackButton from "../components/common/BackButton";

const DEFAULT_LATITUDE = 10.776;
const DEFAULT_LONGITUDE = 106.7;
const STORAGE_KEY = "last_search_results"; 

export default function Results() {
   const location = useLocation();
   const navigate = useNavigate();

   // --- CONFIG ---
   const locationDataRef = useRef({ 
      lat: location.state?.lat ?? DEFAULT_LATITUDE, 
      lng: location.state?.lng ?? DEFAULT_LONGITUDE,
      hasPicked: location.state?.lat != null && location.state?.lng != null,
      showLoading: !!location.state?.showLoading
   });

   const finalLat = locationDataRef.current.lat;
   const finalLng = locationDataRef.current.lng;
   const hasPickedLocation = locationDataRef.current.hasPicked;

   // --- HELPER ĐỌC CACHE RAW ---
   // Hàm này chỉ lấy dữ liệu thô từ cache để hiển thị giao diện tạm thời (Skeleton/UI cũ)
   // trong lúc chờ gọi API Favorite để đối chiếu.
   const getRawCache = () => {
       try {
           const cached = sessionStorage.getItem(STORAGE_KEY);
           if (!cached) return null;
           const parsed = JSON.parse(cached);
           if (parsed.lat === finalLat && parsed.lng === finalLng && Array.isArray(parsed.items)) {
               return parsed.items;
           }
           return null;
       } catch (e) { return null; }
   };

   // --- STATE ---
   const [items, setItems] = useState(() => getRawCache() || []);
   const [loading, setLoading] = useState(() => {
       // Nếu có cache, không hiện loading screen toàn màn hình
       return items.length === 0 && locationDataRef.current.showLoading && hasPickedLocation;
   });
   const [error, setError] = useState("");

   // --- XỬ LÝ BACK ---
   const handleGoBack = (e) => {
       if (e && e.preventDefault) e.preventDefault();
       sessionStorage.removeItem(STORAGE_KEY);
       navigate("/location-picker");
   };

   // --- WEATHER ---
   const { weatherData, fetchWeather } = useWeather();
   useEffect(() => {
      fetchWeather(finalLat, finalLng);
   }, [finalLat, finalLng, fetchWeather]);


   // --- MAIN LOGIC: ONE FLOW TO RULE THEM ALL ---
   const initData = useCallback(async () => {
      if (!hasPickedLocation) {
         setLoading(false);
         return;
      }

      try {
         setError("");
         
         // Nếu chưa có items nào hiển thị, bật loading
         if (items.length === 0) setLoading(true);

         // BƯỚC 1: LUÔN LUÔN Gọi Favorites API trước (hoặc song song)
         // Để đảm bảo ta có danh sách tim mới nhất
         const favPromise = favoriteAPI.getMyFavorites().catch(() => []);
         
         let placesData = [];
         
         // Kiểm tra cache xem có dùng được không
         const cachedItems = getRawCache();

         if (cachedItems) {
             console.log("⚡ [Results] Found cache. Waiting for fresh Favorites to sync...");
             // TRƯỜNG HỢP 1: CÓ CACHE
             // Ta lấy list địa điểm từ cache, nhưng chưa dùng ngay field 'fav' của nó
             placesData = cachedItems;
         } else {
             console.log("🚀 [Results] No cache. Fetching Recommendations from API...");
             // TRƯỜNG HỢP 2: KHÔNG CÓ CACHE -> GỌI API REC
             
             // Lấy params
             const storedDuration = localStorage.getItem("durationTag");
             const parsedDuration = storedDuration ? JSON.parse(storedDuration) : null;
             const duration_tag = parsedDuration?.tag_id;
             const storedActs = localStorage.getItem("activities");
             const activities = storedActs ? JSON.parse(storedActs) : [];

             if (!duration_tag) {
                setItems([]);
                setError("Missing duration selection.");
                setLoading(false);
                return;
             }

             // Gọi Hobby & Recs
             // Lưu ý: Ta gọi song song Hobby & Favorites ở trên (nếu muốn tối ưu hơn), 
             // nhưng để code gọn theo luồng bạn yêu cầu, ta xử lý ở đây.
             const userHobbies = await preferenceAPI.getMyHobbies().catch(() => []);
             
             console.log("lat: ", finalLat, ",lon: ", finalLng, ",dur:", duration_tag, ",activity: ", activities, ",hobby: ", userHobbies)
             const rawPlaces = await suggestionAPI.getRecommendations({ 
                 latitude: finalLat, 
                 longitude: finalLng, 
                 duration_tag, 
                 activity: activities, 
                 hobby: userHobbies 
             });

             // Chuẩn hóa data từ API Recs
             let list = [];
             if (Array.isArray(rawPlaces)) list = rawPlaces;
             else if (Array.isArray(rawPlaces?.recommendations)) list = rawPlaces.recommendations;
             else if (Array.isArray(rawPlaces?.data)) list = rawPlaces.data;
             
             // Map sơ bộ (chưa có fav chính xác)
             placesData = list.map(p => ({
                id: p.id,
                title: p.name,
                image: p.image || p.image_url || "",
                description: p.summarization || p.description || "Chưa có mô tả chi tiết.",
                overview: p.overview || "",
                address: p.address || "",
                tags: Array.isArray(p.tags) ? p.tags : [],
                rating: typeof p.rating === "number" ? p.rating : p.rating != null ? Number(p.rating) : 0,
                openingHours: p.open || p.opening_hours || "N/A",
                lat: p.latitude || p.lat,
                lon: p.longitude || p.lon,
                // Fav tạm thời để false, lát nữa loop sẽ update
                fav: false 
             })).slice(0, 4);
         }

         // BƯỚC 2: ĐỢI FAV API & ĐỐI CHIẾU
         const myFavoritesRaw = await favPromise;
         
         let validFavs = [];
         if (Array.isArray(myFavoritesRaw)) validFavs = myFavoritesRaw;
         else if (Array.isArray(myFavoritesRaw?.data)) validFavs = myFavoritesRaw.data;
         else if (Array.isArray(myFavoritesRaw?.favorites)) validFavs = myFavoritesRaw.favorites;
         
         const favSet = new Set(validFavs.map(f => f.id));

         // BƯỚC 3: VÒNG LẶP GẮN TAG FAV (Merge)
         // Dù là Cache hay API Recs, đều phải chạy qua bước này
         const finalItems = placesData.map(item => ({
             ...item,
             fav: favSet.has(item.id) // Ghi đè trạng thái fav chuẩn từ server
         }));

         if (finalItems.length === 0 && !cachedItems) {
             setItems([]);
             sessionStorage.removeItem(STORAGE_KEY);
         } else {
             // Set State hiển thị
             setItems(finalItems);
             
             // Lưu Cache (Cập nhật lại cache với trạng thái Fav mới nhất)
             const dataToCache = { lat: finalLat, lng: finalLng, items: finalItems };
             sessionStorage.setItem(STORAGE_KEY, JSON.stringify(dataToCache));
         }

      } catch (err) {
         console.error("❌ Error loading data:", err);
         if (err.response && err.response.status === 404) setItems([]);
         else setError(toErrorMessage(err, "Failed to load data"));
      } finally {
         setLoading(false);
      }
   }, [hasPickedLocation, finalLat, finalLng, items.length]); // items.length để check cache lần đầu

   // Effect chạy 1 lần duy nhất logic trên
   useEffect(() => {
       // Dùng timeout nhỏ để tạo hiệu ứng mượt mà nếu cần, hoặc chạy ngay
       const delay = (locationDataRef.current.showLoading && items.length === 0) ? 800 : 0;
       const timer = setTimeout(() => {
           initData();
       }, delay);
       return () => clearTimeout(timer);
       // eslint-disable-next-line react-hooks/exhaustive-deps
   }, []); // Chỉ chạy mount, logic check cache nằm trong initData


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

   // --- RENDER ---
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
            <EmptyState title={title} subtitle={subtitle} ctaText={ctaText} ctaTo={ctaTo} />
         </>
      );
   }

   return (
      <>
         <Navbar />
         <div onClick={handleGoBack} style={{ display: 'inline-block' }}>
            <BackButton to="#" /> 
         </div>
         <main className="results-wrap">
            <div className="results-inner">
               <h1 className="results-title">Here’s What Matches Your Vibe!</h1>
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