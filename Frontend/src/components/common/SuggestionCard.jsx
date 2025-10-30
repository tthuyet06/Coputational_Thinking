import React from "react";

const SuggestionCard = ({ image, title, description, distance, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="cursor-pointer bg-white shadow-md rounded-2xl overflow-hidden hover:shadow-lg transition"
    >
      <img
        src={image}
        alt={title}
        className="w-full h-40 object-cover"
      />
      <div className="p-4 space-y-1">
        <h3 className="font-semibold text-lg">{title}</h3>
        <p className="text-gray-600 text-sm line-clamp-2">{description}</p>
        {distance && (
          <p className="text-blue-500 text-sm font-medium">
            📍 {distance} km away
          </p>
        )}
      </div>
    </div>
  );
};

export default SuggestionCard;