import React from "react";

const Button = ({ label, onClick, selected = false, className = "" }) => {
  return (
    <button
      onClick={onClick}
      className={`py-3 px-6 rounded-xl font-medium transition-all duration-200 ${
        selected
          ? "bg-indigo-600 text-white shadow-md scale-105"
          : "bg-white text-indigo-700 border border-indigo-300 hover:bg-indigo-100"
      } ${className}`}
    >
      {label}
    </button>
  );
};

export default Button;