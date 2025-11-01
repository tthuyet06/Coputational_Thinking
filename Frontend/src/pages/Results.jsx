import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Navbar from "../components/layouts/Navbar";
import LoadingScreen from "./LoadingScreen";
import EmptyState from "./EmptyState";
import "../styles/Results.css";

/* ----- Card ----- */
function ResultCard({ item, onToggleFav }) {
  const navigate = useNavigate();

  const goToDetail = () => {
    navigate(`/details/${item.id}`);
  };

  return (
    <article className="result-card" onClick={goToDetail}>
      <img className="result-img" src={item.image} alt={item.title} />
      <div className="result-body">
        <header className="result-header">
          <h3 className="result-title">{item.title}</h3>
          <button
            className={`fav-btn ${item.fav ? "is-fav" : ""}`}
            aria-label={item.fav ? "Unfavorite" : "Favorite"}
            onClick={(e) => {
              e.stopPropagation();
              onToggleFav(item.id);
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24">
              <path d="M12 21s-6.7-4.1-9.6-7.6A6.1 6.1 0 0 1 12 5.3a6.1 6.1 0 0 1 9.6 8.1C18.7 16.9 12 21 12 21z" />
            </svg>
          </button>
        </header>

        <p className="result-desc">{item.description}</p>

        <p className="result-addr">
          <span className="pin">📍</span>
          {item.address}
        </p>

        <p className="result-tags">
          {item.hashtags.map((t) => (
            <span key={t}>#{t} </span>
          ))}
        </p>
      </div>
    </article>
  );
}

/* ----- Page ----- */
export default function Results() {
  const location = useLocation();
  const navigate = useNavigate();

  // chỉ show loading nếu đi từ Home
  const showLoading = !!location.state?.showLoading;

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(showLoading);

  // xoá state sau khi đọc để Back/Forward không bật lại
  useEffect(() => {
    if (location.state) {
      navigate(".", { replace: true, state: null });
    }
  }, [location.state, navigate]);

  async function fetchResults(delayMs = 0) {
    if (delayMs > 0) {
      await new Promise((r) => setTimeout(r, delayMs));
    }
    return [
      {
        id: "timezone-arcade",
        title: "TimeZone – Indoor Arcade",
        image:
          "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1200&auto=format&fit=crop",
        description:
          "Arcade với bowling, mini basketball, racing simulators ngay tại Saigon Centre. Lý tưởng cho nhóm bạn muốn xả năng lượng.",
        address: "5th Floor, Saigon Centre, 65 Le Loi, District 1",
        hashtags: [
          "PlayAndLaugh",
          "EnergeticMood",
          "FunVibes",
          "TeamChallenge",
          "ArcadeTime",
        ],
        fav: true,
      },
      {
        id: "running-bean",
        title: "The Running Bean Coffee",
        image:
          "https://lh3.googleusercontent.com/p/AF1QipPILOdqXwo32DD2oYO_iG0Klqw9GOMeS9AcpaaV=s1360-w1360-h1020-rw",
        description:
          "Quán cà phê hiện đại, tone trắng – gỗ, không gian mở, hợp chill/creative, có bàn dài làm việc nhóm.",
        address: "33 Mac Thi Buoi Street, District 1",
        hashtags: [
          "CreativeVibe",
          "ChillMood",
          "CoffeeGoals",
          "CityCalm",
          "SaigonSpot",
        ],
        fav: false,
      },
    ];
  }

  useEffect(() => {
    const delay = showLoading ? 800 : 0; // chỉ delay khi đi từ Home
    fetchResults(delay).then((data) => {
      setItems(data);
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // mount 1 lần

  if (loading) {
    return (
      <>
        <Navbar />
        <LoadingScreen message="Looking for the destination, please wait..." />
      </>
    );
  }

  if (!loading && items.length === 0) {
    return (
      <>
        <Navbar />
        <EmptyState
          title="We can’t find any destination that matches your vibes."
          subtitle="Please try again next time."
          ctaText="Edit your vibe"
          ctaTo="/editvibe"
        />
      </>
    );
  }

  const toggleFav = (id) =>
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, fav: !it.fav } : it))
    );

  return (
    <>
      <Navbar />
      <main className="results-wrap">
        <div className="results-inner">
          <h1 className="results-title">
            Here’s What
            <br />
            Matches Your Vibe!
          </h1>

          <section className="results-list">
            {items.map((it) => (
              <ResultCard key={it.id} item={it} onToggleFav={toggleFav} />
            ))}
          </section>
        </div>
      </main>
    </>
  );
}
