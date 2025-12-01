// src/pages/Activities.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/layouts/Navbar";
import TagSelector from "../components/common/TagSelector";
import "../styles/Preferences.css";

// Mock activities
const ACTIVITY_OPTIONS = [
  { label: "Eating Out", value: "#food" },
  { label: "Cafe / Milk Tea", value: "#cafe" },
  { label: "Movies", value: "#movies" },
  { label: "Mall Hangout", value: "#mall" },
  { label: "Night Walk", value: "#walk" },
  { label: "Photo Spots", value: "#photo" },
];

export default function Activities() {
  const navigate = useNavigate();
  const [selectedActivities, setSelectedActivities] = useState([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // ✅ Load lại activities nếu đã lưu trước đó (localStorage)
  useEffect(() => {
    const saved = localStorage.getItem("activities");
    if (!saved) return;

    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        setSelectedActivities(parsed); // restore selection
      }
    } catch {
      // ignore error
    }
  }, []);

  const handleNext = () => {
    setError("");

    if (!selectedActivities.length) {
      setError("Please select at least one activity");
      return;
    }

    try {
      setSaving(true);

      // ✅ Lưu lại lựa chọn vào localStorage
      localStorage.setItem(
        "activities",
        JSON.stringify(selectedActivities)
      );

      navigate("/home");
    } catch (err) {
      setError("Failed to save activities");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="pref-wrap">
        <h1 className="pref-title">CHOOSE ACTIVITIES</h1>
        <p className="pref-sub">Pick the activities you enjoy most.</p>

        <TagSelector
          tags={ACTIVITY_OPTIONS}
          defaultSelected={selectedActivities}
          onChange={setSelectedActivities}
        />

        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

        <button
          className="pref-next"
          onClick={handleNext}
          disabled={!selectedActivities.length || saving}
        >
          {saving ? "Saving..." : "Continue"}
        </button>
      </main>
    </>
  );
}
