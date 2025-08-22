// pages/Game.jsx
import { useState } from "react";
import { ProgressBar } from "react-bootstrap";
import { FaHeart, FaLightbulb } from "react-icons/fa";
import "./Game.css";

export default function Game() {
  const [lives, setLives] = useState(5);
  const [progress, setProgress] = useState(0);
  const [coins, setCoins] = useState(0);
  const [exp, setExp] = useState(0);
  const [hints, setHints] = useState(3);

  return (
    <div className="game-container">
      {/* Header de juego */}
      <div className="game-header d-flex justify-content-between align-items-center mb-3">
        <div className="lives">
          {[...Array(lives)].map((_, i) => (
            <FaHeart key={i} color="red" className="mx-1" />
          ))}
        </div>
        <div>
          <span className="me-3">💰 {coins}</span>
          <span className="me-3">⭐ {exp}</span>
          <button
            className="btn btn-warning btn-sm"
            disabled={hints <= 0}
          >
            <FaLightbulb /> Pista ({hints})
          </button>
        </div>
      </div>

      {/* Barra de progreso */}
      <ProgressBar now={progress} label={`${progress}%`} animated />

      {/* Área del tablero */}
      <div className="board mt-4">
        {/* Aquí van las cartas */}
        <div className="card-grid">
          <div className="game-card">?</div>
          <div className="game-card">?</div>
          <div className="game-card">?</div>
          <div className="game-card">?</div>
          {/* más cartas dinámicas por nivel */}
        </div>
      </div>
    </div>
  );
}
