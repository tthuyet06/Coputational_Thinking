import React from "react";

const LoadingSpinner = ({ size = "md" }) => {
  const spinnerSize =
    size === "sm" ? "w-4 h-4" : size === "lg" ? "w-10 h-10" : "w-6 h-6";

  return (
    <div className="flex justify-center items-center">
      <div
        className={`${spinnerSize} border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin`}
      />
    </div>
  );
};

export default LoadingSpinner;