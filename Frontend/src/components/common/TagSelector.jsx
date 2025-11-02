import React, { useState } from "react";
import "../../styles/TagSelector.css";

export default function TagSelector({ tags = [], onChange }) {
  const [selectedTags, setSelectedTags] = useState([]);

  const toggleTag = (tag) => {
    const updated = selectedTags.includes(tag)
      ? selectedTags.filter((t) => t !== tag)
      : [...selectedTags, tag];
    setSelectedTags(updated);
    if (onChange) onChange(updated);
  };

  return (
    <div className="vibe-panel">
      <div className="vibe-scroll">
        <div className="vibe-grid">
          {tags.map((tag, i) => (
            <div
              key={i}
              className={`tag-pill ${
                selectedTags.includes(tag) ? "is-active" : ""
              }`}
              onClick={() => toggleTag(tag)}
            >
              {tag}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
