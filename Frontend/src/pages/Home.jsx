import React, { useRef, useState } from "react";
import Card from "../components/Card.jsx";
import HUD from "../components/HUD.jsx";
import ChestModal from "../components/ChestModal.jsx";
import WaitOverlay from "../components/WaitOverlay.jsx";
import { useGame } from "../state/GameContext.jsx";
import { getLevelTitle } from "../utils/levels.js";

export default function Home() {
  const { state, flipCard, useHint, useMegaHint, grantChest, startWaitingForLife } = useGame();
  const [forcedReveal, setForcedReveal] = useState([]);
  const revealTimeoutRef = useRef(null);

  const doReveal = (ms) => {
    const all = state.deck.map((_, i) => i);
    setForcedReveal(all);
    clearTimeout(revealTimeoutRef.current);
    revealTimeoutRef.current = setTimeout(() => setForcedReveal([]), ms);
  };
  const handleHint = () => { if (state.hints > 0) { useHint(); doReveal(1000); } };
  const handleMegaHint = () => { if (state.megaHints > 0) { useMegaHint(); doReveal(2000); } };

  const totalCols = Math.min(6, Math.ceil(state.deck.length / 3));
  const gridStyle = { gridTemplateColumns: `repeat(${totalCols}, 1fr)` };
  const showGameOver = state.lives === 0;
  const subTitle = getLevelTitle(state.level);

  return (
    <div className="container-fluid position-relative route-animate">
      <HUD onHint={handleHint} onMegaHint={handleMegaHint} />

      {state.chestPending && <ChestModal show={true} onOpen={grantChest} />}

      {showGameOver ? (
        <div className="text-center p-5 card shadow-sm animate-fade-in">
          <h3 className="mb-2">¡Game Over!</h3>
          <div className="opacity-75 mb-3">Te quedaste sin corazones.</div>
          <div className="d-flex justify-content-center gap-2">
            <a href="/" className="btn btn-secondary">Reiniciar</a>
            <button className="btn btn-primary" onClick={startWaitingForLife} disabled={state.waitingForLife}>
              {state.waitingForLife ? "Esperando…" : "Esperar +1 vida"}
            </button>
          </div>
        </div>
      ) : (
        <div className="card p-3 shadow-sm animate-fade-in">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <div>
              <h5 className="m-0">Nivel {state.level}</h5>
              <small className="opacity-75">{subTitle}</small>
            </div>
            <small className="opacity-75">Empareja las cartas iguales</small>
          </div>

          <div className="memory-grid" style={gridStyle}>
            {/* ...dentro de tu <div className="memory-grid"> */}
            {state.deck.map((c, i) => {
              const isMatched = state.matched.has(i);
              // 👇 Las emparejadas SIEMPRE visibles (se quedan boca arriba)
              const isFlipped =
                isMatched ||
                state.flipped.includes(i) ||
                forcedReveal.includes(i);

              return (
                <Card
                  key={i}
                  index={i}
                  data={c}
                  isFlipped={isFlipped}
                  isMatched={isMatched}
                  wrong={false}
                  onFlip={flipCard}
                />
              );
            })}

          </div>
        </div>
      )}

      <WaitOverlay />
    </div>
  );
}
