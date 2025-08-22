import React, { useEffect, useState } from "react";
import { useGame } from "../state/GameContext.jsx";

function fmtMMSS(ms) {
  if (ms <= 0) return "0:00";
  const s = Math.ceil(ms / 1000);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

export default function WaitOverlay() {
  const { state, cancelWaitingForLife, REGEN_MS } = useGame();
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!state.waitingForLife) return null;

  const remaining = state.livesRegenAt > 0 ? Math.max(0, state.livesRegenAt - now) : REGEN_MS;

  return (
    <div className="wait-overlay">
      <div className="wait-card animate-pop">
        <div className="wait-spinner" />
        <h4 className="mb-2">Recuperando una vida…</h4>
        <p className="text-muted mb-3">Se añadirá automáticamente cuando el contador llegue a cero.</p>
        <div className="wait-timer">{fmtMMSS(remaining)}</div>
        <button className="btn btn-outline-light mt-3" onClick={cancelWaitingForLife}>
          Cancelar espera
        </button>
      </div>
    </div>
  );
}
