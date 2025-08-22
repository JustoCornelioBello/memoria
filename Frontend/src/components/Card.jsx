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
function Card({ index, data, isFlipped, isMatched, wrong, onFlip }) {
  const handleClick = () => {
    if (isMatched) return;       // ya emparejada
    if (typeof onFlip === "function") onFlip(index);
  };

  return (
    <button
      type="button"
      className={cx(
        "memory-card",
        isFlipped && "flipped",
        isMatched && "ok",
        wrong && "wrong"
      )}
      onClick={handleClick}
      aria-label={isFlipped ? `Carta ${data?.symbol || ""}` : "Carta oculta"}
    >
      <div className="card-inner">
        {/* Cara visible inicial */}
        <div className="card-front">
          {/* Diseño del reverso para que “se vea” aunque no esté volteada */}
          <div className="card-backdrop">
            <div className="card-pattern" />
            <span className="card-mark">★</span>
          </div>
        </div>

        {/* Cara con el símbolo (se ve al voltear) */}
        <div className="card-back">
          <span className="card-emoji">{data?.symbol || "❓"}</span>
        </div>
      </div>
    </button>
  );
}

export default memo(Card);
