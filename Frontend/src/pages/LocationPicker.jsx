import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/layouts/Navbar";
import { Map, Marker } from "pigeon-maps";
import BackButton from "../components/common/BackButton"; 

export default function LocationPicker() {
  const navigate = useNavigate();
  const [isLoaded, setIsLoaded] = useState(false); 
  
  const DEFAULT_CENTER = [10.7798, 106.699];
  const STORAGE_KEY = "user_picked_location"; // 1. Định nghĩa key lưu trữ

  // 2. KHỞI TẠO STATE TỪ SESSION STORAGE
  // Thay vì useState(null), ta đọc từ storage ra trước
  const [selectedPos, setSelectedPos] = useState(() => {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
  });

  // 3. KHỞI TẠO TÂM BẢN ĐỒ
  // Nếu đã có vị trí lưu, tâm bản đồ cũng phải ở đó luôn để đỡ bị "nhảy"
  const [mapCenter, setMapCenter] = useState(() => {
      if (selectedPos) return [selectedPos.lat, selectedPos.lng];
      return DEFAULT_CENTER;
  });

  const [mapZoom, setMapZoom] = useState(selectedPos ? 15 : 13); // Zoom gần hơn nếu đã có vị trí

  const [searchText, setSearchText] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [searchCache, setSearchCache] = useState({});

  // --- EFFECT MỚI: TỰ ĐỘNG LƯU VÀO STORAGE KHI VỊ TRÍ THAY ĐỔI ---
  useEffect(() => {
    if (selectedPos) {
        // Lưu object {lat, lng} vào storage
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(selectedPos));
        
        // Cập nhật tâm bản đồ (giữ nguyên logic cũ của bạn)
        setMapCenter([selectedPos.lat, selectedPos.lng]);
        setMapZoom(15);
    }
  }, [selectedPos]);

  // --- HIỆU ỨNG FADE-IN (Giữ nguyên) ---
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // --- HÀM SEARCH (Giữ nguyên logic) ---
  const handleSearch = async (e) => {
    e.preventDefault();
    const query = searchText.trim().toLowerCase();
    if (!query) return;

    if (searchCache[query]) {
      console.log("⚡ Loaded from Cache:", query);
      setSelectedPos(searchCache[query]); 
      setErrorMsg("");
      return; 
    }

    setIsSearching(true);
    setErrorMsg("");

    try {
      const email = "studyonly_user@example.com"; 
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchText)}&limit=1&email=${email}`
      );
      if (!response.ok) throw new Error("API Error");
      const data = await response.json();

      if (data && data.length > 0) {
        const result = data[0];
        const newPos = { lat: parseFloat(result.lat), lng: parseFloat(result.lon) };
        
        setSelectedPos(newPos);
        setSearchCache(prev => ({ ...prev, [query]: newPos })); 
        
      } else {
        setErrorMsg("Can't find this place. Try another keyword.");
      }
    } catch (err) {
      console.error("Search error:", err);
      setErrorMsg("Network error or API limit reached.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleNext = () => {
    if (selectedPos) {
      navigate("/results", { 
        state: { 
          lat: selectedPos.lat,
          lng: selectedPos.lng,
          showLoading: true 
        } 
      });
    }
  };

  return (
    <>
      <Navbar />
      <div 
        className={`location-picker-wrap fade-in ${isLoaded ? 'loaded' : ''}`} 
        style={{ padding: "20px 20px 40px", maxWidth: "800px", margin: "0 auto" }}
      >
        <div style={{ position: 'absolute', top: 20, left: 20, zIndex: 10 }}>
            <BackButton to="/home" />
        </div>
        
        <div style={{textAlign: 'center', marginBottom: '20px', position: 'relative'}}>
            <h1 style={{ fontSize: "1.8rem", marginBottom: "10px", fontWeight: "800" }}>Pin Your Location 📍</h1>
            <p style={{ color: "#666" }}>Select where you want to start your journey!</p>
        </div>

        {/* Search Box */}
        <form onSubmit={handleSearch} style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
          <input 
            type="text" 
            placeholder="Search address..." 
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ flex: 1, padding: "12px 20px", borderRadius: "50px", border: "1px solid #ddd", fontSize: "16px", outline: "none", boxShadow: "0 2px 5px rgba(0,0,0,0.05)" }}
          />
          <button 
            type="submit" 
            disabled={isSearching}
            style={{ padding: "0 25px", borderRadius: "50px", border: "none", backgroundColor: "#333", color: "#fff", cursor: "pointer", fontWeight: "bold", minWidth: "100px" }}
          >
            {isSearching ? "..." : "Search"}
          </button>
        </form>
        
        {errorMsg && <p style={{color: "red", textAlign: "center", marginBottom: "15px"}}>{errorMsg}</p>}

        {/* Map Container */}
        <div style={{ 
            height: "50vh", width: "100%", borderRadius: "20px", 
            overflow: "hidden", border: "2px solid #eee", position: "relative",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            zIndex: 0 
        }}>
          <Map
            center={mapCenter} 
            zoom={mapZoom} 
            defaultZoom={13}
            onClick={({ latLng }) => {
                // Khi click chọn tay, state thay đổi -> Effect chạy -> Lưu vào Storage
                setSelectedPos({ lat: latLng[0], lng: latLng[1] });
            }}
            onBoundsChanged={({ center, zoom }) => {
                setMapCenter(center);
                setMapZoom(zoom);
            }}
            style={{ height: "100%", width: "100%" }}
          >
            {selectedPos && (
                <Marker 
                    anchor={[selectedPos.lat, selectedPos.lng]}
                    color="#FF5A5F" 
                    width={40}
                />
            )}
          </Map>
        </div>

        {/* Footer Actions */}
        <div style={{ marginTop: "30px", textAlign: "center" }}>
            <p style={{marginBottom: "15px", fontSize: "1rem", color: "#555"}}>
                Selected Coordinates: <br/>
                <strong>{selectedPos 
                    ? `${selectedPos.lat.toFixed(5)}, ${selectedPos.lng.toFixed(5)}` 
                    : "Tap on map to select"}</strong>
            </p>
            
            <button 
                onClick={handleNext} 
                disabled={!selectedPos}
                style={{
                    padding: "15px 60px",
                    backgroundColor: selectedPos ? "#FF5A5F" : "#ccc",
                    color: "white",
                    border: "none",
                    borderRadius: "50px",
                    cursor: selectedPos ? "pointer" : "not-allowed",
                    fontSize: "18px",
                    fontWeight: "bold",
                    transition: "all 0.3s ease",
                    boxShadow: selectedPos ? "0 4px 15px rgba(255, 90, 95, 0.4)" : "none",
                    transform: selectedPos ? "translateY(0)" : "translateY(2px)"
                }}
            >
                LET'S GO!!
            </button>
        </div>
      </div>
    </>
  );
}