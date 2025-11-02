import React, { useState } from "react";
import Navbar from "../components/layouts/Navbar";
import "../styles/Preferences.css";

export default function Preferences() {
  const vibes = [
    "Sweet", "Peaceful", "Cozy", "Dreamy",
    "Lovely", "Serene", "Soft", "Bold",
    "Vibrant", "Energetic", "Fun", "Adventurous",
    "Motivated", "Excited", "Playful", "Chill",
    "Mysterious", "Romantic", "Lazy", "Classic",
    "Creative", "Relaxed", "Trendy", "Quiet",
    "Mellow", "Tranquil", "Wild", "Focused",
  ];

  const [selected, setSelected] = useState(new Set());

  const toggle = (v) => {
    const next = new Set(selected);
    next.has(v) ? next.delete(v) : next.add(v);
    setSelected(next);
  };

  const handleNext = () => {
    console.log("Selected vibes:", Array.from(selected));
    // tạm thời: chuyển sang trang results
    window.location.href = "/home";
  };

  return (
    <>
      <Navbar />
      <main className="pref-wrap">
        <h1 className="pref-title">CHOOSE YOUR VIBE</h1>
        <p className="pref-sub">Share with us your thought</p>

        <div className="vibe-panel">
          <div className="vibe-scroll">
            <div className="vibe-grid">
              {vibes.map((v) => (
                <button
                  key={v}
                  className={`tag-pill ${selected.has(v) ? "is-active" : ""}`}
                  onClick={() => toggle(v)}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          className="pref-next"
          onClick={handleNext}
          disabled={selected.size === 0}
        >
          Next
        </button>
      </main>
    </>
  );
}
