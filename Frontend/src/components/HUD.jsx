import React, { useEffect, useState } from "react";
import { FaHeart, FaLightbulb, FaBolt, FaMagic } from "react-icons/fa";
import { useGame } from "../state/GameContext.jsx";

function useNow() {
  const [t, setT] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setT(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  return t;
}
const fmt = (ms) => {
  if (ms <= 0) return "0:00";
  const s = Math.ceil(ms / 1000);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
};

export default function HUD({ onHint, onMegaHint }) {
  const { state, xpMultiplier, REGEN_MS } = useGame();
  const totalCards = state.deck.length;
  const progress = Math.round((state.matched.size / totalCards) * 100) || 0;
  const now = useNow();

  const heartLeft = state.lives < state.livesCap && state.livesRegenAt > 0
    ? Math.max(0, state.livesRegenAt - now)
    : 0;
  const hintLeft = state.hints < state.hintsCap && state.hintsRegenAt > 0
    ? Math.max(0, state.hintsRegenAt - now)
    : 0;
  const boostLeft = Math.max(0, state.xpBoostUntil - now);

  return (
    <div className="hud card shadow-sm p-3 mb-3 animate-fade-in">
      <div className="d-flex align-items-center justify-content-between gap-3 flex-wrap">
        {/* Vidas */}
        <div className="d-flex align-items-center gap-2">
          {Array.from({ length: state.livesCap }).map((_, i) => (
            <FaHeart
              key={i}
              className={i < state.lives ? "text-danger heart" : "text-secondary heart dim"}
              size={20}
              title={i < state.lives ? "Vida" : "Recargando"}
            />
          ))}
          {state.lives < state.livesCap && (
            <span className="badge bg-dark text-light ms-2">
              +1 en {fmt(heartLeft)}
            </span>
          )}
        </div>

        {/* Progreso */}
        <div className="flex-grow-1">
          <div className="progress" role="progressbar" aria-label="Progreso" aria-valuenow={progress} aria-valuemin="0" aria-valuemax="100">
            <div className="progress-bar" style={{ width: `${progress}%` }}>{progress}%</div>
          </div>
        </div>

        {/* Pistas */}
        <div className="d-flex align-items-center gap-2">
          <button className="btn btn-warning" onClick={onHint} disabled={state.hints <= 0}>
            <FaLightbulb className="me-2" /> Pista ({state.hints}/{state.hintsCap})
          </button>
          {state.megaHints > 0 && (
            <button className="btn btn-info text-dark" onClick={onMegaHint}>
              <FaMagic className="me-2" /> Mega ({state.megaHints})
            </button>
          )}
          {state.hints < state.hintsCap && (
            <span className="badge bg-dark text-light">
              +1 en {fmt(hintLeft)}
            </span>
          )}
        </div>

        {/* XP / Coins / Boost */}
        <div className="d-flex align-items-center gap-2">
          <div className="badge bg-primary-subtle text-primary">XP: {state.exp}</div>
          <div className="badge bg-primary-subtle text-primary">Monedas: {state.coins}</div>
          {xpMultiplier > 1 && (
            <div className="badge bg-success-subtle text-success d-flex align-items-center gap-2">
              <FaBolt /> x{xpMultiplier} ({fmt(boostLeft)})
            </div>
          )}
        </div>
      </div>

      <div className="small opacity-75 mt-2">
        Recarga automática: una vida o pista cada {Math.floor(REGEN_MS/60000)} minutos.
      </div>
    </div>
  );
}
