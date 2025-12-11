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

  // 🔹 3. Next -> Results
  const handleNext = () => {
    if (selectedPos) {
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
            We start from your current location. Tap on the map to pick
            another spot if you want ✨
          </p>
        </div>

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
