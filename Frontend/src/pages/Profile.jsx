import React, { useEffect, useState, useMemo } from "react";
import { FaBolt, FaCoins, FaHeart, FaLightbulb, FaGift } from "react-icons/fa";
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

export default function Profile() {
  const { state } = useGame();
  const now = useNow();

  const boostLeft = Math.max(0, state.xpBoostUntil - now);
  const lifeLeft  = state.lives < state.livesCap && state.livesRegenAt > 0 ? Math.max(0, state.livesRegenAt - now) : 0;
  const hintLeft  = state.hints < state.hintsCap && state.hintsRegenAt > 0 ? Math.max(0, state.hintsRegenAt - now) : 0;

  const initials = useMemo(() => {
    const n = (state.displayName || "Jugador").trim();
    const parts = n.split(/\s+/).slice(0,2);
    return parts.map(p => p[0]?.toUpperCase() || "").join("") || "J";
  }, [state.displayName]);

  const levelsToNextChest = (5 - ((state.level - 1) % 5) - 1) + 1; // cuántos faltan para múltiplo de 5
  const nextChestAt = Math.ceil(state.level / 5) * 5 + 1; // nivel en el que aparecería el próximo cofre tras superar el actual bloque

  return (
    <div className="container">
      {/* Encabezado */}
      <div className="card p-3 shadow-sm animate-fade-in mb-3">
        <div className="d-flex align-items-center gap-3">
          <div className="profile-avatar">
            <span>{initials}</span>
          </div>
          <div className="flex-grow-1">
            <h4 className="m-0">{state.displayName || "Jugador"}</h4>
            <div className="opacity-75">Nivel {state.level} • XP {state.exp} • <FaCoins /> {state.coins}</div>
          </div>
          {boostLeft > 0 && (
            <div className="badge bg-success-subtle text-success d-flex align-items-center gap-2">
              <FaBolt /> x2 XP ({fmt(boostLeft)})
            </div>
          )}
        </div>
      </div>

      {/* Estadísticas */}
      <div className="row g-3">
        <div className="col-12 col-md-4">
          <div className="card p-3 shadow-sm h-100">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <strong><FaHeart className="me-2 text-danger" />Vidas</strong>
              <span className="badge bg-dark-subtle text-light">{state.lives}/{state.livesCap}</span>
            </div>
            {state.lives < state.livesCap ? (
              <div>Próxima vida en <strong>{fmt(lifeLeft)}</strong></div>
            ) : (
              <div>Vidas al máximo</div>
            )}
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className="card p-3 shadow-sm h-100">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <strong><FaLightbulb className="me-2 text-warning" />Pistas</strong>
              <span className="badge bg-dark-subtle text-light">{state.hints}/{state.hintsCap}</span>
            </div>
            {state.hints < state.hintsCap ? (
              <div>Próxima pista en <strong>{fmt(hintLeft)}</strong></div>
            ) : (
              <div>Pistas al máximo</div>
            )}
            {state.megaHints > 0 && <div className="mt-2">Mega pistas: <strong>{state.megaHints}</strong></div>}
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className="card p-3 shadow-sm h-100">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <strong><FaGift className="me-2" />Cofres</strong>
              <span className="badge bg-primary-subtle text-primary">Cada 5 niveles</span>
            </div>
            <div>
              Siguiente cofre tras superar el nivel <strong>{Math.ceil(state.level/5)*5}</strong>.
            </div>
            <div className="opacity-90">Faltan <strong>{levelsToNextChest}</strong> nivel(es).</div>
          </div>
        </div>
      </div>
    </div>
  );
}
