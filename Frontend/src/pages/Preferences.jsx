import React, { useState, useEffect } from "react";
import Navbar from "../components/layouts/Navbar";
import TagSelector from "../components/common/TagSelector";
import "../styles/Preferences.css";
import { useNavigate } from "react-router-dom";
import preferenceAPI from "../services/preferenceAPI";

export default function Preferences() {
  const navigate = useNavigate();

  const [allHobbies, setAllHobbies] = useState([]);
  const [selectedHobbies, setSelectedHobbies] = useState([]);

  const [tagsLoading, setTagsLoading] = useState(true);
  const [tagsError, setTagsError] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // 🔹 load list tag từ /tags/hobbies
  useEffect(() => {
    const loadTags = async () => {
      try {
        setTagsLoading(true);
        setTagsError("");
        const tags = await preferenceAPI.getHobbyTags();
        setAllHobbies(tags);
      } catch (err) {
        setTagsError(
          typeof err === "string" ? err : err?.message || "Failed to load hobbies"
        );
      } finally {
        setTagsLoading(false);
      }
    };
    loadTags();
  }, []);

  const handleNext = async () => {
    setError("");

    if (!selectedHobbies.length) {
      setError("Please select at least one hobby");
      return;
    }

    try {
      setSaving(true);
      // 🔹 lưu chọn lên /users/me/hobbies
      await preferenceAPI.updateMyHobbies(selectedHobbies);

      // (optional) lưu local để màn /results dùng tiếp
      localStorage.setItem("hobbies", JSON.stringify(selectedHobbies));

      // Chuyển qua màn chọn thời gian rảnh
      navigate("/home");
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
