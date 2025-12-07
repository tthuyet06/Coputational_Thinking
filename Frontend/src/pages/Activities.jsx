// src/pages/Activities.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/layouts/Navbar";
import TagSelector from "../components/common/TagSelector";
import "../styles/Preferences.css";
import activitiesAPI from "../services/activitiesAPI";
import BackButton from "../components/common/BackButton";

export default function Activities() {
  const navigate = useNavigate();

  const [allActivities, setAllActivities] = useState([]);
  const [selectedActivities, setSelectedActivities] = useState([]);

  const [tagsLoading, setTagsLoading] = useState(true);
  const [tagsError, setTagsError] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Load activities
  useEffect(() => {
    const load = async () => {
      try {
        setTagsLoading(true);
        setTagsError("");

        const options = await activitiesAPI.getActivityTags();
        setAllActivities(options);

        const stored = localStorage.getItem("activities");
        if (stored) {
          const arr = JSON.parse(stored);
          if (Array.isArray(arr)) setSelectedActivities(arr);
        }
      } catch (err) {
        setTagsError(err?.message || "Failed to load activities");
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

      localStorage.setItem("activities", JSON.stringify(selectedActivities || []));

      // tùy flow: nếu muốn sang results luôn thì "/results"
      navigate("/home");
    } catch (err) {
      setError(err?.message || "Failed to save activities");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Navbar />
      <BackButton to="/preferences"/>

      <main className="pref-wrap">
        <h1 className="pref-title">CHOOSE YOUR ACTIVITY</h1>
        <p className="pref-sub">Share with us your thoughts</p>

        {tagsLoading && <p>Loading activities...</p>}
        {tagsError && <p className="text-red-500 text-sm">{tagsError}</p>}

        {!tagsLoading && !tagsError && (
          <TagSelector
            tags={allActivities}
            defaultSelected={selectedActivities}
            onChange={setSelectedActivities}
          />
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
