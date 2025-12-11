// src/pages/LocationPicker.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/layouts/Navbar";
import { Map, Marker } from "pigeon-maps";
import BackButton from "../components/common/BackButton";

export default function LocationPicker() {
  const navigate = useNavigate();
  const [isLoaded, setIsLoaded] = useState(false);

  const DEFAULT_CENTER = [10.7798, 106.699];

  // luôn ưu tiên: current location -> nếu fail -> DEFAULT_CENTER
  const [selectedPos, setSelectedPos] = useState(null);
  const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER);
  const [mapZoom, setMapZoom] = useState(13);

  const [searchText, setSearchText] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [searchCache, setSearchCache] = useState({});

  // 🔹 1. Lần nào vào cũng thử lấy vị trí hiện tại
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const cur = { lat, lng };

          setSelectedPos(cur);
          setMapCenter([lat, lng]);
          setMapZoom(15);
        },
        () => {
          // user deny hoặc lỗi -> dùng default SG
          setSelectedPos(null);
          setMapCenter(DEFAULT_CENTER);
          setMapZoom(13);
        }
      );
    } else {
      setSelectedPos(null);
      setMapCenter(DEFAULT_CENTER);
      setMapZoom(13);
    }
  }, []); // chỉ chạy 1 lần khi vào trang

  // 🔹 2. Fade-in animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // 🔹 3. Search địa chỉ
  const handleSearch = async (e) => {
    e.preventDefault();
    const query = searchText.trim().toLowerCase();
    if (!query) return;

    if (searchCache[query]) {
      const cached = searchCache[query];
      setSelectedPos(cached);
      setMapCenter([cached.lat, cached.lng]);
      setMapZoom(15);
      setErrorMsg("");
      return;
    }

    setIsSearching(true);
    setErrorMsg("");

    try {
      const email = "studyonly_user@example.com";
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchText
        )}&limit=1&email=${email}`
      );
      if (!response.ok) throw new Error("API Error");
      const data = await response.json();

      if (data && data.length > 0) {
        const result = data[0];
        const newPos = {
          lat: parseFloat(result.lat),
          lng: parseFloat(result.lon),
        };

        setSelectedPos(newPos);
        setMapCenter([newPos.lat, newPos.lng]);
        setMapZoom(15);
        setSearchCache((prev) => ({ ...prev, [query]: newPos }));
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

  // 🔹 4. Next -> Results
  const handleNext = () => {
    if (selectedPos) {
      // vẫn có thể clear search result cũ nếu bạn đang dùng ở Results
      sessionStorage.removeItem("last_search_results");
      navigate("/results", {
        state: {
          lat: selectedPos.lat,
          lng: selectedPos.lng,
          showLoading: true,
        },
      });
    }
  };

  return (
    <>
      <Navbar />
      <div
        className={`location-picker-wrap fade-in ${
          isLoaded ? "loaded" : ""
        }`}
        style={{
          padding: "20px 20px 40px",
          maxWidth: "800px",
          margin: "0 auto",
        }}
      >
        <div
          style={{ position: "absolute", top: 20, left: 20, zIndex: 10 }}
        >
          <BackButton to="/home" />
        </div>

        <div
          style={{
            textAlign: "center",
            marginBottom: "20px",
            position: "relative",
          }}
        >
          <h1
            style={{
              fontSize: "1.8rem",
              marginBottom: "10px",
              fontWeight: "800",
            }}
          >
            Pin Your Location 📍
          </h1>
          <p style={{ color: "#666" }}>
            We start from your current location. You can pick another spot
            if you want ✨
          </p>
        </div>

        {/* Search Box */}
        <form
          onSubmit={handleSearch}
          style={{
            display: "flex",
            gap: "10px",
            marginBottom: "20px",
          }}
        >
          <input
            type="text"
            placeholder="Search address..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{
              flex: 1,
              padding: "12px 20px",
              borderRadius: "50px",
              border: "1px solid #ddd",
              fontSize: "16px",
              outline: "none",
              boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
            }}
          />
          <button
            type="submit"
            disabled={isSearching}
            style={{
              padding: "0 25px",
              borderRadius: "50px",
              border: "none",
              backgroundColor: "#333",
              color: "#fff",
              cursor: "pointer",
              fontWeight: "bold",
              minWidth: "100px",
            }}
          >
            {isSearching ? "..." : "Search"}
          </button>
        </form>

        {errorMsg && (
          <p
            style={{
              color: "red",
              textAlign: "center",
              marginBottom: "15px",
            }}
          >
            {errorMsg}
          </p>
        )}

        {/* Map */}
        <div
          style={{
            height: "50vh",
            width: "100%",
            borderRadius: "20px",
            overflow: "hidden",
            border: "2px solid #eee",
            position: "relative",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            zIndex: 0,
          }}
        >
          <Map
            center={mapCenter}
            zoom={mapZoom}
            defaultZoom={13}
            onClick={({ latLng }) => {
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

        {/* Footer */}
        <div style={{ marginTop: "30px", textAlign: "center" }}>
          <p
            style={{
              marginBottom: "15px",
              fontSize: "1rem",
              color: "#555",
            }}
          >
            Selected Coordinates: <br />
            <strong>
              {selectedPos
                ? `${selectedPos.lat.toFixed(
                    5
                  )}, ${selectedPos.lng.toFixed(5)}`
                : "Waiting for your location..."}
            </strong>
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
              boxShadow: selectedPos
                ? "0 4px 15px rgba(255, 90, 95, 0.4)"
                : "none",
              transform: selectedPos
                ? "translateY(0)"
                : "translateY(2px)",
            }}
          >
            LET&apos;S GO!!
          </button>
        </div>
      </div>
    </>
  );
}
