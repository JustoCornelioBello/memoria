import React, { memo } from "react";

function cx(...c) {
  return c.filter(Boolean).join(" ");
}

/**
 * Props:
 * - index (number)
 * - data: { key: string, symbol: string }
 * - isFlipped (bool)
 * - isMatched (bool)
 * - wrong (bool)
 * - onFlip(index)
 */
export default function Card({
  index,
  data,           // { key, face } => face es el emoji/objeto
  isFlipped,      // ¿está volteada?
  isMatched,      // ¿ya está emparejada?
  wrong,          // animación de error si quieres
  onFlip,         // callback al click
}) {
  const classes = [
    "memory-card",
    isFlipped ? "flipped" : "",
    isMatched ? "ok" : "",
    wrong ? "wrong" : "",
  ].join(" ").trim();

  const handleClick = () => {
    if (isMatched || isFlipped) return; // no permitir click en emparejadas o ya abiertas
    onFlip?.(index);
  };

  return (
    <button
      type="button"
      className={classes}
      onClick={handleClick}
      aria-label={isFlipped || isMatched ? `Carta ${data?.face}` : "Carta oculta"}
    >
      <div className="card-inner">
        {/* Frente (oculto): SIN “?” – ponemos un placeholder neutro */}
        <div className="card-front">
          <span className="placeholder" aria-hidden="true">🧩</span>
        </div>

        {/* Dorso (contenido real): el emoji/objeto */}
        <div className="card-back">
          <span className="emoji" role="img" aria-label="objeto">{data?.face}</span>
        </div>
      </div>
    </button>
  );
}