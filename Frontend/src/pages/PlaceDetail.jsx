import React, { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/layouts/Navbar";
import "../styles/PlaceDetail.css";

const MOCK = {
  "running-bean": {
    id: "running-bean",
    title: "The Running Bean Coffee",
    hero:
      "https://lh3.googleusercontent.com/p/AF1QipPILOdqXwo32DD2oYO_iG0Klqw9GOMeS9AcpaaV=s1360-w1360-h1020-rw",
    description:
      "The Running Bean is a modern café & brunch spot located in the heart of Ho Chi Minh City...",
    detail:
      "The Running Bean is a modern café & brunch spot located in the heart of Ho Chi Minh City, offering a cozy yet captivating atmosphere perfect for individuals, friends, and families alike. Known for its blend of high-quality locally roasted coffee and a diverse brunch menu — from classics like egg sandwiches and avocado toasts to more creative options like smoothie bowls — The Running Bean delivers a delightful “from morning till afternoon” dining experience.",
    hashtags: ["CreativeVibe", "ChillMood", "CoffeeGoals", "CityCalm", "SaigonSpot"],
    openingHours: "8:30 AM – 9:30 PM",
    activities: "Dinning - Coffee",
    setting: "Indoor - Outdoor",
    priceRange: "Medium - High",
    address: "33 Mac Thi Buoi Street, District 1, Ho Chi Minh City",
  },
  "timezone-arcade": {
    id: "timezone-arcade",
    title: "TimeZone – Indoor Arcade",
    hero:
      "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1600&auto=format&fit=crop",
    description:
      "A vibrant arcade in Saigon Centre featuring bowling, mini basketball and racing simulators.",
    detail:
      "The Running Bean is a modern café & brunch spot located in the heart of Ho Chi Minh City, offering a cozy yet captivating atmosphere perfect for individuals, friends, and families alike. Known for its blend of high-quality locally roasted coffee and a diverse brunch menu — from classics like egg sandwiches and avocado toasts to more creative options like smoothie bowls — The Running Bean delivers a delightful “from morning till afternoon” dining experience.",
    hashtags: ["PlayAndLaugh", "EnergeticMood", "FunVibes", "TeamChallenge", "ArcadeTime"],
    openingHours: "10:00 AM – 10:00 PM",
    activities: "Arcade - Bowling - Mini games",
    setting: "Indoor",
    priceRange: "Medium",
    address: "5th Floor, Saigon Centre, 65 Le Loi, District 1",
  },
};

export default function PlaceDetail() {
  const { id = "running-bean" } = useParams();
  const data = useMemo(() => MOCK[id] ?? Object.values(MOCK)[0], [id]);
  const [fav, setFav] = useState(false);
  const navigate = useNavigate();

  return (
    <>
      <Navbar />
      <main className="detail-wrap">
        <div className="detail-hero">
          <button className="back-btn" onClick={() => navigate("/results")} aria-label="Back to results">
            <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M15 18 9 12l6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <img src={data.hero} alt={data.title} />
        </div>

        <article className="detail-card">
          <header className="detail-header">
            <h1 className="detail-title">
              {data.title.split(" ").slice(0, -1).join(" ")}
              <br />
              {data.title.split(" ").slice(-1)}
            </h1>
            <button
              className={`fav-btn ${fav ? "is-fav" : ""}`}
              onClick={() => setFav((v) => !v)}
              aria-label={fav ? "Unfavorite" : "Favorite"}
            >
              <svg width="24" height="24" viewBox="0 0 24 24"><path d="M12 21s-6.7-4.1-9.6-7.6A6.1 6.1 0 0 1 12 5.3a6.1 6.1 0 0 1 9.6 8.1C18.7 16.9 12 21 12 21z" fill="currentColor"/></svg>
            </button>
          </header>

          <p className="detail-desc">{data.detail}</p>

          <dl className="detail-meta">
            <div className="meta-row">
              <dt>Hashtags:</dt>
              <dd className="tags">{data.hashtags.map((t) => `#${t}`).join(" ")}</dd>
            </div>
            <div className="meta-row">
              <dt>Opening Hours:</dt>
              <dd>{data.openingHours}</dd>
            </div>
            <div className="meta-row">
              <dt>Activities:</dt>
              <dd>{data.activities}</dd>
            </div>
            <div className="meta-row">
              <dt>Setting:</dt>
              <dd>{data.setting}</dd>
            </div>
            <div className="meta-row">
              <dt>Price Range:</dt>
              <dd>{data.priceRange}</dd>
            </div>
            <div className="meta-row">
              <dt>Address:</dt>
              <dd><span className="pin">📍</span>{data.address}</dd>
            </div>
          </dl>
        </article>
      </main>
    </>
  );
}
