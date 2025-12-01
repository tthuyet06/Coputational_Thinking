// src/pages/Home.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/layouts/Navbar";
import "../styles/Home.css";
import preferenceAPI from "../services/preferenceAPI";

export default function Home() {
  const navigate = useNavigate();

  const [durations, setDurations] = useState([]); // [{display_name, tag_id}]
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [selectedId, setSelectedId] = useState(null);
  const [selectedLabel, setSelectedLabel] = useState("");

  // 🔹 Load duration tags từ backend
  useEffect(() => {
    const fetchDurations = async () => {
      try {
        setLoading(true);
        setLoadError("");
        const data = await preferenceAPI.getDurationTags();
        setDurations(data);
      } catch (err) {
        setLoadError(
          typeof err === "string"
            ? err
            : err?.message || "Failed to load durations"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDurations();
  }, []);

  const handleNext = () => {
    if (!selectedId) return;

    // Lưu duration_tag để Results dùng gọi /recommend
    localStorage.setItem(
      "durationTag",
      JSON.stringify({
        tag_id: selectedId,
        label: selectedLabel,
      })
    );

    // gửi state cho Results để show loading screen
    navigate("/results", { state: { showLoading: true } });
  };

  return (
    <>
      <Navbar />
      <main className="home-wrap">
        <h1 className="home-title">
          ⏰ How much free time
          <br />
          do you have?
        </h1>

        <div className="home-panel">
          {loading && <p>Loading options...</p>}
          {loadError && (
            <p className="text-red-500 text-sm mt-2">{loadError}</p>
          )}

          {!loading && !loadError && (
            <section className="home-options">
              {durations.map((opt) => (
                <button
                  key={opt.tag_id}
                  className={`home-option ${
                    selectedId === opt.tag_id ? "active" : ""
                  }`}
                  onClick={() => {
                    setSelectedId(opt.tag_id);
                    setSelectedLabel(opt.display_name);
                  }}
                >
                  {opt.display_name}
                </button>
              ))}
            </section>
          )}
        </div>

        <button
          className="home-next"
          onClick={handleNext}
          disabled={!selectedId || loading || !!loadError}
        >
          Next
        </button>
      </main>
    </>
  );
}
