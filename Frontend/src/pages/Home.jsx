import React, { useState } from "react";
import Navbar from "../components/layouts/Navbar";

const Home = () => {
  const [selectedDuration, setSelectedDuration] = useState("");

  const durations = [
    { label: "Under 1 hour", value: "<1h" },
    { label: "1 - 3 hours", value: "1-3h" },
    { label: "Over 3 hours", value: ">3h" },
  ];

  const handleContinue = () => {
    if (!selectedDuration) {
      alert("Please select your free time before continuing!");
      return;
    }
    console.log("Selected:", selectedDuration);
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-white relative">
      <Navbar />

      {/* Main content */}
      <div className="flex flex-col items-center justify-start mt-24 w-full max-w-6xl px-6">
        {/* Title */}
        <h1 className="mt-4 text-5xl md:text-6xl font-extrabold text-blue-700 text-center leading-snug mb-14">
          <span role="img" aria-label="clock">🕒</span>{" "}
          HOW MUCH FREE TIME
          <br />
          DO YOU HAVE ?
        </h1>

        {/* Selection box */}
        <div className="bg-gray-100 rounded-3xl shadow-xl p-12 flex flex-col gap-8 items-center w-full max-w-3xl border border-gray-200">
          {durations.map((item) => (
            <button
              key={item.value}
              onClick={() => setSelectedDuration(item.value)}
              className={`w-full py-5 text-2xl font-semibold rounded-2xl transition-all shadow-sm border-2
                ${
                  selectedDuration === item.value
                    ? "bg-blue-700 text-white border-blue-300 shadow-md scale-105"
                    : "bg-gradient-to-b from-blue-400 to-blue-500 text-white hover:from-blue-500 hover:to-blue-600 hover:scale-105 border-transparent"
                }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* NEXT button */}
        <button
          onClick={handleContinue}
          className="mt-14 bg-blue-600 hover:bg-blue-700 text-white text-2xl font-bold py-5 px-24 rounded-2xl shadow-md transition-all"
        >
          NEXT
        </button>
      </div>
    </div>
  );
};

export default Home;