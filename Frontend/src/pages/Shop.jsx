import React, { useEffect, useMemo, useState } from "react";
import {
  FaCoins, FaBolt, FaLightbulb, FaHeart, FaBatteryFull,
  FaMagic, FaArrowUp, FaShieldAlt
} from "react-icons/fa";
import { useGame } from "../state/GameContext.jsx";

export default function Shop() {
  const {
    state,
    // consumibles
    purchaseHint,
    purchaseLife,
    purchaseRefillLives,
    purchaseMegaHint,
    purchaseXpBoost,
    // upgrades
    upgradeLivesCap,
    upgradeHintsCap,
    // costos
    COST_HINT, COST_LIFE, COST_REFILL_LIVES, COST_MEGA_HINT, COST_XPBOOST,
    nextLivesCapCost, nextHintsCapCost,
    LIVES_CAP_MAX, HINTS_CAP_MAX,
  } = useGame();

  // Solo animar al montar (evita flicker en actualizaciones)
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const canAfford = (price) => typeof price === "number" && state.coins >= price;
  const Tag = ({ children }) => <span className="badge rounded-pill bg-secondary">{children}</span>;

  // Memo para evitar recrear arrays en cada render (reduce reflow/flicker)
  const livesCost = nextLivesCapCost();
  const hintsCost = nextHintsCapCost();

  const consumibles = useMemo(() => ([
    {
      id: "hint",
      icon: <FaLightbulb />,
      title: "Pista +1",
      desc: "Une una pareja o revela 1s.",
      price: COST_HINT,
      action: purchaseHint,
      disabled: !canAfford(COST_HINT) || state.hints >= state.hintsCap,
      foot: `Pistas: ${state.hints}/${state.hintsCap}`,
      tag: "Consumible",
      cta: canAfford(COST_HINT) ? "Comprar" : "Sin monedas",
    },
    {
      id: "life",
      icon: <FaHeart />,
      title: "Vida +1",
      desc: "Agrega una vida inmediata.",
      price: COST_LIFE,
      action: purchaseLife,
      disabled: !canAfford(COST_LIFE) || state.lives >= state.livesCap,
      foot: `Vidas: ${state.lives}/${state.livesCap}`,
      tag: "Consumible",
      cta: canAfford(COST_LIFE) ? "Comprar" : "Sin monedas",
    },
    {
      id: "refill",
      icon: <FaBatteryFull />,
      title: "Recargar Vidas",
      desc: "Rellena todas tus vidas al máximo.",
      price: COST_REFILL_LIVES,
      action: purchaseRefillLives,
      disabled: !canAfford(COST_REFILL_LIVES) || state.lives >= state.livesCap,
      foot: `Vidas: ${state.lives}/${state.livesCap}`,
      tag: "Consumible",
      cta: canAfford(COST_REFILL_LIVES) ? "Recargar" : "Sin monedas",
    },
    {
      id: "megahint",
      icon: <FaMagic />,
      title: "Mega Pista",
      desc: "Revela todas las cartas por 2s.",
      price: COST_MEGA_HINT,
      action: purchaseMegaHint,
      disabled: !canAfford(COST_MEGA_HINT),
      foot: `Mega Pistas: ${state.megaHints}`,
      tag: "Consumible",
      cta: canAfford(COST_MEGA_HINT) ? "Comprar" : "Sin monedas",
    },
    {
      id: "xpboost",
      icon: <FaBolt />,
      title: "Multiplicador de XP",
      desc: "Duplica tu XP por 15 min.",
      price: COST_XPBOOST,
      action: purchaseXpBoost,
      disabled: !canAfford(COST_XPBOOST),
      foot: state.xpBoostUntil > Date.now() ? "Activo ✓" : "Inactivo",
      tag: "Boost",
      cta: canAfford(COST_XPBOOST) ? "Activar" : "Sin monedas",
    },
  ]), [
    state.hints, state.hintsCap, state.lives, state.livesCap, state.megaHints, state.xpBoostUntil,
    COST_HINT, COST_LIFE, COST_REFILL_LIVES, COST_MEGA_HINT, COST_XPBOOST
  ]);

  const upgrades = useMemo(() => ([
    {
      id: "livescap",
      icon: <FaShieldAlt />,
      title: "Límite de Vidas +1",
      desc: `Aumenta el tope (máx ${LIVES_CAP_MAX}).`,
      price: livesCost ?? "Máximo",
      action: upgradeLivesCap,
      disabled: livesCost == null || !canAfford(livesCost),
      foot: `Tope actual: ${state.livesCap}`,
      tag: "Mejora",
      cta: livesCost == null ? "Máximo" : canAfford(livesCost) ? "Mejorar" : "Sin monedas",
    },
    {
      id: "hintscap",
      icon: <FaArrowUp />,
      title: "Límite de Pistas +1",
      desc: `Aumenta el tope (máx ${HINTS_CAP_MAX}).`,
      price: hintsCost ?? "Máximo",
      action: upgradeHintsCap,
      disabled: hintsCost == null || !canAfford(hintsCost),
      foot: `Tope actual: ${state.hintsCap}`,
      tag: "Mejora",
      cta: hintsCost == null ? "Máximo" : canAfford(hintsCost) ? "Mejorar" : "Sin monedas",
    },
  ]), [state.livesCap, state.hintsCap, livesCost, hintsCost, LIVES_CAP_MAX, HINTS_CAP_MAX]);

  const Section = ({ title, items }) => (
    <div className={"card p-3 shadow-sm mb-3 " + (mounted ? "animate-fade-in" : "")}>
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h5 className="m-0">{title}</h5>
        <div className="d-flex align-items-center gap-2">
          <span className="badge bg-warning text-dark"><FaCoins className="me-1" /> {state.coins}</span>
          <span className="badge bg-info text-dark">XP {state.exp}</span>
        </div>
      </div>
      <div className="row g-3">
        {items.map((it) => (
          <div className="col-12 col-sm-6 col-lg-4" key={it.id}>
            <div className="shop-card h-100 d-flex flex-column">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <div className="d-flex align-items-center gap-2">
                  <div className="item-icon">{it.icon}</div>
                  <strong>{it.title}</strong>
                </div>
                <Tag>{it.tag}</Tag>
              </div>

              <div className="shop-desc">{it.desc}</div>

              <div className="mt-auto">
                <div className="d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-2">
                    <FaCoins /> <strong>{it.price}</strong>
                  </div>
                  <button
                    className="btn btn-primary"
                    onClick={it.action}
                    disabled={!!it.disabled}
                  >
                    {it.cta}
                  </button>
                </div>
                <div className="shop-foot">{it.foot}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="container">
      <div style={{marginBottom: "8px"}}>
        <h4 className="mb-1">Tienda</h4>
        <div className="opacity-75">Compra consumibles, boosts y mejoras permanentes.</div>
      </div>

      <Section title="Consumibles y Boosts" items={consumibles} />
      <Section title="Mejoras Permanentes" items={upgrades} />
    </div>
  );
}
