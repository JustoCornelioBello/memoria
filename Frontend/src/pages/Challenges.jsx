import React, { useEffect, useState } from "react";
import { useGame } from "../state/GameContext.jsx";
import { FaClock, FaCoins, FaTrophy, FaGift, FaCheck } from "react-icons/fa";

const fmt = (ms) => {
  if (ms <= 0) return "0:00:00";
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(r).padStart(2,"0")}`;
};

function TaskCard({ scope, t, onClaim }) {
  const pct = Math.round((t.progress / t.target) * 100);
  const canClaim = t.done && !t.claimed;

  const rewardText =
    t.reward?.label ||
    (t.reward?.type === "coins" ? `+${t.reward.amount} monedas` :
     t.reward?.type === "exp"   ? `+${t.reward.amount} XP` :
     t.reward?.type === "xpBoost" ? `XP x2 (${t.reward.minutes} min)` :
     t.reward?.type === "megaHint" ? `Mega pista x${t.reward.amount}` :
     t.reward?.type === "life" ? `+${t.reward.amount} vida` : "Recompensa");

  return (
    <div className={`card p-3 h-100 shadow-sm ${t.claimed ? "opacity-75" : ""}`}>
      <div className="d-flex justify-content-between align-items-center mb-1">
        <strong>{t.desc}</strong>
        <span className="badge bg-warning text-dark d-flex align-items-center gap-1">
          <FaGift /> {rewardText}
        </span>
      </div>

      <div className="progress" style={{height: 18}}>
        <div className="progress-bar" style={{width: `${Math.min(100,pct)}%`}}>
          {t.progress}/{t.target}
        </div>
      </div>

      <div className="mt-2 d-flex justify-content-between align-items-center">
        <small className="opacity-75">
          {t.done ? (t.claimed ? "Reclamado ✓" : "Completado ✓") : "En progreso"}
        </small>
        <button
          className="btn btn-sm btn-primary"
          disabled={!canClaim}
          onClick={() => onClaim(scope, t.id)}
        >
          {t.claimed ? <><FaCheck className="me-1" /> Listo</> : "Reclamar"}
        </button>
      </div>
    </div>
  );
}

export default function Challenges() {
  const { state, claimTask } = useGame();
  const [tick, setTick] = useState(0);

  // contador dinámico (1s)
  useEffect(() => {
    const id = setInterval(() => setTick((n)=>n+1), 1000);
    return () => clearInterval(id);
  }, []);

  const leftDaily = Math.max(0, (state.daily?.endsAt || 0) - Date.now());
  const leftWeekly = Math.max(0, (state.weekly?.endsAt || 0) - Date.now());

  return (
    <div className="container route-animate">
      {/* Header */}
      <div className="card p-3 shadow-sm mb-3">
        <div className="d-flex justify-content-between align-items-center">
          <h4 className="m-0"><FaTrophy className="me-2" /> Desafíos</h4>
          <div className="d-flex gap-2">
            <div className="badge bg-primary-subtle text-primary d-flex align-items-center gap-2">
              <FaClock /> Diario: {fmt(leftDaily)}
            </div>
            <div className="badge bg-primary-subtle text-primary d-flex align-items-center gap-2">
              <FaClock /> Semanal: {fmt(leftWeekly)}
            </div>
          </div>
        </div>
        <div className="opacity-75">Completa tareas, reclama recompensas y sube más rápido.</div>
      </div>

      {/* Diarios */}
      <div className="card p-3 shadow-sm mb-3">
        <h5 className="mb-2">Diarios</h5>
        <div className="row g-3">
          {(state.daily?.tasks || []).map(t => (
            <div key={t.id} className="col-12 col-md-6 col-lg-4">
              <TaskCard scope="daily" t={t} onClaim={claimTask} />
            </div>
          ))}
        </div>
      </div>

      {/* Semanales */}
      <div className="card p-3 shadow-sm mb-5">
        <h5 className="mb-2">Semanales</h5>
        <div className="row g-3">
          {(state.weekly?.tasks || []).map(t => (
            <div key={t.id} className="col-12 col-md-6">
              <TaskCard scope="weekly" t={t} onClaim={claimTask} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
