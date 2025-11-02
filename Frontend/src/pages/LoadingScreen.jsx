import React from "react";
import "../styles/Loading.css";

export default function LoadingScreen({
  message = "Looking for the destination, please wait...",
}) {
  return (
    <main className="loading-wrap">
      <div className="loading-inner">
        <div className="spinner" aria-hidden="true" />
        <p className="loading-text">{message}</p>
      </div>
    </main>
  );
}
