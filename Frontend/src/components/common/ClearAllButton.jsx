import React from "react";
import "../../styles/ClearAllButton.css";

export default function ClearAllButton({ onClear, disabled }) {
  return (
    <button
      className="clear-btn"
      onClick={onClear}
      disabled={disabled}
    >
      Clear all
    </button>
  );
}
