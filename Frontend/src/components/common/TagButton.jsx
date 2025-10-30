import React from "react";

const TagButton = ({ label, selected, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-full border text-sm font-medium transition
        ${selected 
          ? "bg-blue-600 text-white border-blue-600" 
          : "bg-white text-gray-700 border-gray-300 hover:bg-blue-50"}
      `}
    >
      {label}
    </button>
  );
};

export default TagButton;