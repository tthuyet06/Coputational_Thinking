import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/layouts/Navbar";
import "../styles/Home.css";

export default function Home() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);

  const handleNext = () => {
    if (selected) {
      // gửi state để Results biết là đi từ Home → bật Loading
      navigate("/results", { state: { showLoading: true } });
    }
  };

  return (
    <>
      <Navbar />
      <main className="home-wrap">
        <h1 className="home-title">
          ⏰ How much free time
          <br />
          do you have?
        </h1>

        <div className="home-panel">
          <section className="home-options">
            {["Under 1 hour", "1 - 3 hours", "Over 3 hours"].map((opt) => (
              <button
                key={opt}
                className={`home-option ${selected === opt ? "active" : ""}`}
                onClick={() => setSelected(opt)}
              >
                {opt}
              </button>
            ))}
          </section>
        </div>

        <button
          className="home-next"
          onClick={handleNext}
          disabled={!selected}
        >
          Next
        </button>
      </main>
    </>
  );
}
