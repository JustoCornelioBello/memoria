// src/state/GameContext.jsx
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { generateLevel } from "../utils/levels.js";
import { Sound } from "../utils/sound.js";

export const GameContext = createContext();
export const useGame = () => useContext(GameContext);

// Storage keys (mantén estos nombres estables para no perder datos)
const STORAGE_KEY  = "memoria_progress_v5"; // progreso, inventario, timers
const SETTINGS_KEY = "memoria_settings_v3"; // nombre, login, prefs

// Timers
const REGEN_MS = 20 * 60 * 1000; // 20 min por vida/pista

// Caps base y máximos (para upgrades)
const LIVES_CAP_BASE = 5;
const LIVES_CAP_MAX  = 7;
const HINTS_CAP_BASE = 3;
const HINTS_CAP_MAX  = 5;

const initialState = {
  // Progresión
  level: 1,
  maxLevels: 50,

  // Perfil / sesión
  displayName: "Jugador",
  isLoggedIn: false,

  // Recursos y recarga
  lives: LIVES_CAP_BASE,
  livesCap: LIVES_CAP_BASE,
  livesRegenAt: 0,
  hints: HINTS_CAP_BASE,
  hintsCap: HINTS_CAP_BASE,
  hintsRegenAt: 0,

  // Juego
  deck: [],
  flipped: [],
  matched: new Set(),
  mistakes: 0,

  // Moneda/XP/boost
  exp: 0,
  coins: 0,
  xpBoostUntil: 0,

  // Cofres
  chestPending: false,
  lastReward: null,
  pendingReward: null,

  // Inventario
  megaHints: 0,

  // UX / Ajustes
  soundOn: true,
  vibrationOn: true,

  // Espera activa (overlay) hasta +1 vida
  waitingForLife: false,
};

// -------- helpers de hidratar/regen --------
const applyRegenPure = (s, tNow) => {
  let changed = false;

  let lives        = s.lives;
  let livesRegenAt = s.livesRegenAt;
  let hints        = s.hints;
  let hintsRegenAt = s.hintsRegenAt;

  // vidas
  if (lives < s.livesCap && livesRegenAt > 0) {
    while (lives < s.livesCap && tNow >= livesRegenAt) {
      lives += 1;
      livesRegenAt += REGEN_MS;
      changed = true;
    }
    if (lives >= s.livesCap && livesRegenAt !== 0) {
      livesRegenAt = 0;
      changed = true;
    }
  }

  // pistas
  if (hints < s.hintsCap && hintsRegenAt > 0) {
    while (hints < s.hintsCap && tNow >= hintsRegenAt) {
      hints += 1;
      hintsRegenAt += REGEN_MS;
      changed = true;
    }
    if (hints >= s.hintsCap && hintsRegenAt !== 0) {
      hintsRegenAt = 0;
      changed = true;
    }
  }

  return changed ? { ...s, lives, livesRegenAt, hints, hintsRegenAt } : s;
};

// carga inicial sin parpadeo (se ejecuta una sola vez dentro de useState)
function lazyHydrate() {
  try {
    const saved         = JSON.parse(localStorage.getItem(STORAGE_KEY)  || "null");
    const savedSettings = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "null");

    let merged = {
      ...initialState,
      ...(saved || {}),
      ...(savedSettings || {}),
    };

    // normalizar estructuras no serializables
    merged.matched = new Set(); // nunca persistimos pares en curso

    // aplicar regen con hora actual
    merged = applyRegenPure(merged, Date.now());
    return merged;
  } catch {
    return initialState;
  }
}

export function GameProvider({ children }) {
  // 1) estado + bandera de hidratación
  const [state, setState] = useState(lazyHydrate);
  const [hydrated, setHydrated] = useState(true); // ya que hicimos lazyHydrate, estamos hidratados desde el primer render

  const now = () => Date.now();
  const xpMultiplier = state.xpBoostUntil > now() ? 2 : 1;

  // 2) reconstruir mazo al cambiar de nivel
  useEffect(() => {
    const deck = generateLevel(state.level);
    setState((s) => ({ ...s, deck, flipped: [], matched: new Set(), mistakes: 0 }));
  }, [state.level]);

  // 3) persistir progreso — solo si hydrated
  useEffect(() => {
    if (!hydrated) return;
    const toSave = {
      level: state.level,
      exp: state.exp,
      coins: state.coins,
      xpBoostUntil: state.xpBoostUntil,

      lives: state.lives,
      livesCap: state.livesCap,
      livesRegenAt: state.livesRegenAt,

      hints: state.hints,
      hintsCap: state.hintsCap,
      hintsRegenAt: state.hintsRegenAt,

      chestPending: state.chestPending,
      lastReward: state.lastReward,
      pendingReward: state.pendingReward,

      megaHints: state.megaHints,

      waitingForLife: state.waitingForLife,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  }, [
    hydrated,
    state.level, state.exp, state.coins, state.xpBoostUntil,
    state.lives, state.livesCap, state.livesRegenAt,
    state.hints, state.hintsCap, state.hintsRegenAt,
    state.chestPending, state.lastReward, state.pendingReward,
    state.megaHints, state.waitingForLife,
  ]);

  // 4) persistir ajustes/usuario — solo si hydrated
  useEffect(() => {
    if (!hydrated) return;
    const toSave = {
      soundOn: state.soundOn,
      vibrationOn: state.vibrationOn,
      displayName: state.displayName,
      isLoggedIn: state.isLoggedIn,
    };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(toSave));
  }, [hydrated, state.soundOn, state.vibrationOn, state.displayName, state.isLoggedIn]);

  // 5) tick de regeneración anti-flicker
  useEffect(() => {
    const id = setInterval(() => {
      setState((s) => {
        const tNow = now();
        const beforeLives = s.lives;
        const updated = applyRegenPure(s, tNow);
        if (updated === s) return s; // sin cambios -> no re-render
        if (s.waitingForLife && updated.lives > beforeLives) {
          return { ...updated, waitingForLife: false };
        }
        return updated;
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);

  // ---------- cartas ----------
  const flipCard = (idx) => {
    setState((s) => {
      if (s.matched.has(idx) || s.flipped.includes(idx)) return s;
      if (s.flipped.length === 2) return s;
      Sound.flip(s.soundOn);
      return { ...s, flipped: [...s.flipped, idx] };
    });
  };

  useEffect(() => {
    if (state.flipped.length !== 2) return;
    const [a, b] = state.flipped;
    const ca = state.deck[a];
    const cb = state.deck[b];
    const isMatch = ca?.key === cb?.key;

    const t = setTimeout(() => {
      setState((s) => {
        if (isMatch) {
          Sound.match(s.soundOn);
          const m = new Set(s.matched);
          m.add(a); m.add(b);
          return { ...s, matched: m, flipped: [] };
        }
        const newLives = Math.max(0, s.lives - 1);
        let next = { ...s, flipped: [], lives: newLives, mistakes: s.mistakes + 1 };
        if (newLives < s.livesCap && next.livesRegenAt === 0) next.livesRegenAt = now() + REGEN_MS;
        Sound.fail(s.soundOn);
        return next;
      });
    }, 600);
    return () => clearTimeout(t);
  }, [state.flipped, state.deck]);

  // ---------- fin de nivel ----------
  const levelClearedRef = useRef(false);
  useEffect(() => { levelClearedRef.current = false; }, [state.deck]);
  useEffect(() => {
    const total = state.deck.length;
    if (!total) return;
    const finished = state.matched.size > 0 && state.matched.size === total;
    if (!finished || state.lives === 0 || levelClearedRef.current) return;
    levelClearedRef.current = true;

    const gainedXP = 100 * xpMultiplier;
    setState((s) => {
      const nextLevel = Math.min(s.level + 1, s.maxLevels);
      const chest = s.level % 5 === 0;
      return { ...s, exp: s.exp + gainedXP, coins: s.coins + 30, level: nextLevel, chestPending: chest };
    });
  }, [state.matched, state.lives, state.deck, xpMultiplier]);

  // ---------- pistas ----------
  const useHint = () =>
    setState((s) => {
      if (s.hints <= 0) return s;
      const hints = s.hints - 1;
      let next = { ...s, hints };
      if (hints < s.hintsCap && next.hintsRegenAt === 0) next.hintsRegenAt = now() + REGEN_MS;
      return next;
    });

  const useMegaHint = () =>
    setState((s) => (s.megaHints > 0 ? { ...s, megaHints: s.megaHints - 1 } : s));

  // ---------- espera +1 vida ----------
  const startWaitingForLife = () =>
    setState((s) => {
      if (s.lives >= s.livesCap) return s;
      let next = { ...s, waitingForLife: true };
      if (next.livesRegenAt === 0) next.livesRegenAt = now() + REGEN_MS;
      return next;
    });
  const cancelWaitingForLife = () => setState((s) => ({ ...s, waitingForLife: false }));

  // ---------- tienda ----------
  const COST_HINT = 50, COST_XPBOOST = 200, COST_LIFE = 80, COST_REFILL_LIVES = 200, COST_MEGA_HINT = 120;

  const nextLivesCapCost = () => {
    if (state.livesCap >= LIVES_CAP_MAX) return null;
    const steps = state.livesCap - LIVES_CAP_BASE;
    return 500 + steps * 300;
  };
  const nextHintsCapCost = () => {
    if (state.hintsCap >= HINTS_CAP_MAX) return null;
    const steps = state.hintsCap - HINTS_CAP_BASE;
    return 350 + steps * 250;
  };

  const purchaseHint = () =>
    setState((s) => {
      if (s.coins < COST_HINT) return s;
      const hints = Math.min(s.hints + 1, s.hintsCap);
      return { ...s, coins: s.coins - COST_HINT, hints, hintsRegenAt: hints >= s.hintsCap ? 0 : s.hintsRegenAt };
    });

  const purchaseLife = () =>
    setState((s) => {
      if (s.coins < COST_LIFE || s.lives >= s.livesCap) return s;
      const lives = s.lives + 1;
      return { ...s, coins: s.coins - COST_LIFE, lives, livesRegenAt: lives >= s.livesCap ? 0 : s.livesRegenAt };
    });

  const purchaseRefillLives = () =>
    setState((s) => {
      if (s.coins < COST_REFILL_LIVES || s.lives >= s.livesCap) return s;
      return { ...s, coins: s.coins - COST_REFILL_LIVES, lives: s.livesCap, livesRegenAt: 0 };
    });

  const purchaseMegaHint = () =>
    setState((s) => (s.coins < COST_MEGA_HINT ? s : { ...s, coins: s.coins - COST_MEGA_HINT, megaHints: s.megaHints + 1 }));

  const purchaseXpBoost = () =>
    setState((s) => {
      if (s.coins < COST_XPBOOST) return s;
      const until = Math.max(now(), s.xpBoostUntil) + 15 * 60 * 1000;
      return { ...s, coins: s.coins - COST_XPBOOST, xpBoostUntil: until };
    });

  const upgradeLivesCap = () =>
    setState((s) => {
      const cost = nextLivesCapCost(); if (cost == null || s.coins < cost) return s;
      const newCap = Math.min(LIVES_CAP_MAX, s.livesCap + 1);
      return { ...s, coins: s.coins - cost, livesCap: newCap };
    });

  const upgradeHintsCap = () =>
    setState((s) => {
      const cost = nextHintsCapCost(); if (cost == null || s.coins < cost) return s;
      const newCap = Math.min(HINTS_CAP_MAX, s.hintsCap + 1);
      return { ...s, coins: s.coins - cost, hintsCap: newCap };
    });

  // ---------- cofres ----------
  const grantChest = () => {
    const rewards = [
      { type: "xpBoost", label: "Multiplicador de XP (15 min)" },
      { type: "coins", amount: 150, label: "+150 monedas" },
      { type: "exp", amount: 200, label: "+200 XP" },
    ];
    const reward = rewards[Math.floor(Math.random() * rewards.length)];
    setState((s) => ({ ...s, pendingReward: reward }));
    Sound.chest(state.soundOn);
  };
  const acceptReward = () =>
    setState((s) => {
      const r = s.pendingReward; if (!r) return { ...s, chestPending: false };
      let next = { ...s, pendingReward: null, chestPending: false, lastReward: r };
      if (r.type === "xpBoost") next.xpBoostUntil = Math.max(now(), s.xpBoostUntil) + 15 * 60 * 1000;
      if (r.type === "coins")   next.coins = s.coins + (r.amount || 0);
      if (r.type === "exp")     next.exp   = s.exp   + (r.amount || 0);
      return next;
    });
  const denyReward = () => setState((s) => ({ ...s, pendingReward: null, chestPending: false }));

  // ---------- ajustes / auth ----------
  const toggleSound = () => setState((s) => ({ ...s, soundOn: !s.soundOn }));
  const toggleVibration = () => setState((s) => ({ ...s, vibrationOn: !s.vibrationOn }));
  const setDisplayName = (name) => setState((s) => ({ ...s, displayName: (name || "Jugador").slice(0, 24) }));

  const login = (name) =>
    setState((s) => ({
      ...s,
      displayName: (name || "Jugador").slice(0, 24),
      isLoggedIn: true,
    }));

  const logout = () =>
    setState((s) => ({
      ...s,
      isLoggedIn: false,
    }));

  const resetProgress = () =>
    setState((s) => ({
      ...s,
      level: 1,
      exp: 0,
      coins: 0,
      xpBoostUntil: 0,
      lives: LIVES_CAP_BASE,
      livesCap: Math.max(s.livesCap, LIVES_CAP_BASE),
      livesRegenAt: 0,
      hints: HINTS_CAP_BASE,
      hintsCap: Math.max(s.hintsCap, HINTS_CAP_BASE),
      hintsRegenAt: 0,
      deck: [],
      flipped: [],
      matched: new Set(),
      mistakes: 0,
      chestPending: false,
      lastReward: null,
      pendingReward: null,
      megaHints: 0,
      waitingForLife: false,
    }));

  const getSnapshot = () => {
    try {
      const progress = JSON.parse(localStorage.getItem(STORAGE_KEY)  || "{}");
      const settings = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}");
      return { exportedAt: new Date().toISOString(), progress, settings, version: "v5" };
    } catch {
      return { exportedAt: new Date().toISOString(), error: "No se pudo leer localStorage" };
    }
  };

  const value = useMemo(
    () => ({
      state,

      // juego
      flipCard,

      // pistas
      useHint, useMegaHint,

      // espera
      startWaitingForLife, cancelWaitingForLife,

      // cofres
      grantChest, acceptReward, denyReward,

      // tienda
      purchaseHint, purchaseLife, purchaseRefillLives, purchaseMegaHint, purchaseXpBoost,
      upgradeLivesCap, upgradeHintsCap,
      COST_HINT: 50, COST_XPBOOST: 200, COST_LIFE: 80, COST_REFILL_LIVES: 200, COST_MEGA_HINT: 120,
      nextLivesCapCost, nextHintsCapCost,

      // ajustes / auth
      toggleSound, toggleVibration, setDisplayName, login, logout, resetProgress, getSnapshot,

      // consts útiles
      xpMultiplier, REGEN_MS, LIVES_CAP_BASE, LIVES_CAP_MAX, HINTS_CAP_BASE, HINTS_CAP_MAX,
    }),
    [state, xpMultiplier]
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}
