// src/pages/Preferences.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/layouts/Navbar";
import TagSelector from "../components/common/TagSelector";
import "../styles/Preferences.css";
import preferenceAPI from "../services/preferenceAPI";

export default function Preferences() {
  const navigate = useNavigate();

  const [allHobbies, setAllHobbies] = useState([]);      // [{label,value}, ...]
  const [selectedHobbies, setSelectedHobbies] = useState([]); // ["#cafe", ...]

  const [tagsLoading, setTagsLoading] = useState(true);
  const [tagsError, setTagsError] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // 🔹 Load list hobbies + hobbies hiện tại của user
  useEffect(() => {
    const load = async () => {
      try {
        setTagsLoading(true);
        setTagsError("");

        // Lấy list tag (mock / DB)
        const [options, myHobbies] = await Promise.all([
          preferenceAPI.getHobbyTags(),
          preferenceAPI.getMyHobbies(),
        ]);

        setAllHobbies(options);           // [{label,value}, ...]
        setSelectedHobbies(myHobbies);    // ["#cafe", ...]
      } catch (err) {
        setTagsError(
          typeof err === "string" ? err : err?.message || "Failed to load hobbies"
        );
      } finally {
        setTagsLoading(false);
      }
    };
    load();
  }, []);

  const handleNext = async () => {
    setError("");

    if (!selectedHobbies.length) {
      setError("Please select at least one hobby");
      return;
    }

    try {
      setSaving(true);

      // lưu sở thích lên BE
      await preferenceAPI.updateMyHobbies(selectedHobbies);

      // lưu local để sau này cần dùng
      localStorage.setItem("hobbies", JSON.stringify(selectedHobbies));

      // sang trang chọn thời gian rảnh
      navigate("/activities");
    } catch (err) {
      setError(
        typeof err === "string" ? err : err?.message || "Failed to save hobbies"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="pref-wrap">
        <h1 className="pref-title">CHOOSE YOUR VIBE</h1>
        <p className="pref-sub">Share with us your thought</p>

        {tagsLoading && <p>Loading hobbies...</p>}
        {tagsError && <p className="text-red-500 text-sm">{tagsError}</p>}

        {!tagsLoading && !tagsError && (
          <TagSelector
            tags={allHobbies}
            defaultSelected={selectedHobbies}
            onChange={setSelectedHobbies}
          />
        )}

        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

        <button
          className="pref-next"
          onClick={handleNext}
          disabled={!selectedHobbies.length || saving || tagsLoading}
        >
          {saving ? "Saving..." : "Next"}
        </button>
      </main>
    </>
  );
}
