// src/pages/Preferences.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/layouts/Navbar";
import TagSelector from "../components/common/TagSelector";
import ClearAllButton from "../components/common/ClearAllButton";
import "../styles/Preferences.css";
import preferenceAPI from "../services/preferenceAPI";

export default function Preferences() {
  const navigate = useNavigate();

  const [allHobbies, setAllHobbies] = useState([]);          // [{id,label,value,raw}, ...]
  const [selectedHobbies, setSelectedHobbies] = useState([]); // luôn cố gắng giữ dạng object cùng format với allHobbies

  const [tagsLoading, setTagsLoading] = useState(true);
  const [tagsError, setTagsError] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Load list hobbies + hobbies hiện tại
  useEffect(() => {
    const load = async () => {
      try {
        setTagsLoading(true);
        setTagsError("");

        const [options, myHobbies] = await Promise.all([
          preferenceAPI.getHobbyTags(), // [{id,label,value,raw}, ...]
          preferenceAPI.getMyHobbies(), // ["#cafe", "#yen_tinh", ...]
        ]);

        setAllHobbies(options);

        // Map từ list string myHobbies -> list object tương ứng trong options
        // để TagSelector nhận đúng format
        if (Array.isArray(myHobbies) && myHobbies.length > 0) {
          const mappedSelected = options.filter((opt) =>
            myHobbies.includes(opt.value)
          );
          setSelectedHobbies(mappedSelected);
        } else {
          setSelectedHobbies([]);
        }
      } catch (err) {
        setTagsError(
          typeof err === "string"
            ? err
            : err?.message || "Failed to load hobbies"
        );
      } finally {
        setTagsLoading(false);
      }
    };

    load();
  }, []);

  const handleNext = async () => {
    setError("");

    try {
      setSaving(true);

      // Chuẩn hóa selectedHobbies thành list string tag: ["#cafe", "#yen_tinh", ...]
      const hobbyTags = (selectedHobbies || [])
        .map((h) =>
          typeof h === "string"
            ? h            // nếu lỡ là string thì dùng luôn
            : h?.value     // nếu là object thì lấy .value
        )
        .filter(Boolean);   // loại null/undefined/"" nếu có

      await preferenceAPI.updateMyHobbies(hobbyTags);

      // Lưu local (giữ nguyên dạng object để UI dùng lại)
      localStorage.setItem("hobbies", JSON.stringify(selectedHobbies || []));

      navigate("/activities");
    } catch (err) {
      setError(
        typeof err === "string"
          ? err
          : err?.message || "Failed to save hobbies"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleClear = () => {
    setSelectedHobbies([]);
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
          <div className="tag-wrapper">
            <div className="tag-header">
              <ClearAllButton
                onClear={handleClear}
                disabled={!selectedHobbies.length}
              />
            </div>

            <TagSelector
              tags={allHobbies}
              defaultSelected={selectedHobbies}
              onChange={setSelectedHobbies}
            />
          </div>
        )}

        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

        <button
          className="pref-next"
          onClick={handleNext}
          disabled={saving || tagsLoading}
        >
          {saving ? "Saving..." : "Next"}
        </button>
      </main>
    </>
  );
}
