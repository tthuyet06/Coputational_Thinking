import React from "react";
import { Link } from "react-router-dom";
import "../styles/Empty.css";

export default function EmptyState({
  title = "We can’t find any destination that matches your vibes.",
  subtitle = "Please try again next time.",
  ctaText = "Edit your vibe",
  ctaTo = "/preferences",          
}) {
  return (
    <main className="empty-wrap">
      <div className="empty-inner">
        <p className="empty-title">{title}</p>
        <p className="empty-subtitle">{subtitle}</p>

        <Link to={ctaTo} className="empty-cta">
          {ctaText}
          <span className="arrow" aria-hidden="true">›</span>
        </Link>
      </div>
    </main>
  );
}
