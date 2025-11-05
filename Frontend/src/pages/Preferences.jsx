import React, { useState } from "react";
import Navbar from "../components/layouts/Navbar";
import TagSelector from "../components/common/TagSelector";
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

  const [selectedVibes, setSelectedVibes] = useState([]);

  const handleNext = () => {
    console.log("Selected vibes:", selectedVibes);
    window.location.href = "/home";
  };

  return (
    <>
      <Navbar />
      <main className="pref-wrap">
        <h1 className="pref-title">CHOOSE YOUR VIBE</h1>
        <p className="pref-sub">Share with us your thought</p>

        <TagSelector tags={vibes} onChange={setSelectedVibes} />

        <button
          className="pref-next"
          onClick={handleNext}
          disabled={selectedVibes.length === 0}
        >
          Next
        </button>
      </main>
    </>
  );
}
