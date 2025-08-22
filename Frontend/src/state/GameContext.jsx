import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { generateLevel, getLevelTitle } from "../utils/levels.js";
import { Sound } from "../utils/sound.js";

export const GameContext = createContext();
export const useGame = () => useContext(GameContext);

// Storage keys
const STORAGE_KEY  = "memoria_progress_v6";
const SETTINGS_KEY = "memoria_settings_v4";

// Timers
const REGEN_MS = 20 * 60 * 1000;

// Caps
const LIVES_CAP_BASE = 5, LIVES_CAP_MAX = 7;
const HINTS_CAP_BASE = 3, HINTS_CAP_MAX = 5;

/* ----------------- Helpers fecha/periodos ----------------- */
const todayId = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,"0");
  const day = String(d.getDate()).padStart(2,"0");
  return `${y}-${m}-${day}`;
};
const nextMidnightMs = () => {
  const d = new Date();
  d.setHours(24,0,0,0);
  return d.getTime();
};

// Semana ISO (lunes inicio)
function getWeekId(d = new Date()) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = (date.getUTCDay() + 6) % 7 + 1; // 1..7
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((date - yearStart) / 86400000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}
function getWeekEndsAt(d = new Date()) {
  const day = d.getDay(); // 0..6
  const daysToMon = (8 - day) % 7;
  const end = new Date(d);
  end.setHours(0,0,0,0);
  end.setDate(end.getDate() + daysToMon);
  return end.getTime();
}

/* ----------------- Generadores de desafíos ----------------- */
// Recompensas variadas
function randomReward(pool="coins") {
  // pool puede influir; por ahora mezclamos un poco
  const choices = [
    { type: "coins", amount: 120, label: "+120 monedas" },
    { type: "coins", amount: 180, label: "+180 monedas" },
    { type: "exp", amount: 150, label: "+150 XP" },
    { type: "exp", amount: 250, label: "+250 XP" },
    { type: "xpBoost", minutes: 10, label: "XP x2 (10 min)" },
    { type: "megaHint", amount: 1, label: "Mega pista x1" },
    { type: "life", amount: 1, label: "+1 vida" },
  ];
  return choices[Math.floor(Math.random()*choices.length)];
}

function dailyTemplate() {
  // 6 tareas diarias variadas
  const id0 = todayId();
  const endsAt = nextMidnightMs();
  const kinds = [
    // kind: cómo se mide el progreso
    { id:"d1", kind:"matches",   desc:"Haz 12 parejas",       target:12 },
    { id:"d2", kind:"wins",      desc:"Gana 2 niveles",       target:2  },
    { id:"d3", kind:"purchases", desc:"Compra 1 artículo",    target:1  },
    { id:"d4", kind:"nohintwin", desc:"Gana 1 nivel sin pistas", target:1 },
    { id:"d5", kind:"streak",    desc:"Juega 2 niveles seguidos sin perder", target:2 },
    { id:"d6", kind:"levelplay", desc:"Juega 3 niveles",      target:3  },
  ];
  return {
    dayId: id0,
    endsAt,
    tasks: kinds.map(k => ({
      ...k,
      progress: 0,
      done: false,
      claimed: false,
      reward: randomReward("daily"),
    }))
  };
}

function weeklyTemplate() {
  const weekId = getWeekId();
  return {
    weekId,
    endsAt: getWeekEndsAt(),
    tasks: [
      { id:"w1", kind:"wins",      desc:"Gana 10 niveles",        target:10 },
      { id:"w2", kind:"matches",   desc:"Haz 80 parejas",         target:80 },
      { id:"w3", kind:"purchases", desc:"Compra 3 artículos",     target:3  },
      { id:"w4", kind:"nohintwin", desc:"Gana 3 niveles sin pistas", target:3 },
      { id:"w5", kind:"levelplay", desc:"Juega 20 niveles",       target:20 },
    ].map(t => ({
      ...t, progress: 0, done: false, claimed: false, reward: randomReward("weekly")
    }))
  };
}

/* ----------------- Estado inicial ----------------- */
const initialState = {
  // progreso
  level: 1,
  maxLevels: 50,

  // perfil / sesión
  displayName: "Jugador",
  isLoggedIn: false,

  // recursos
  lives: LIVES_CAP_BASE,
  livesCap: LIVES_CAP_BASE,
  livesRegenAt: 0,
  hints: HINTS_CAP_BASE,
  hintsCap: HINTS_CAP_BASE,
  hintsRegenAt: 0,

  // juego
  deck: [],
  flipped: [],
  matched: new Set(),
  mistakes: 0,

  // meta
  exp: 0,
  coins: 0,
  xpBoostUntil: 0,

  // cofres
  chestPending: false,
  lastReward: null,
  pendingReward: null,

  // inventario
  megaHints: 0,

  // preferencias
  soundOn: true,
  vibrationOn: true,
  musicOn: false,
  musicVol: 0.4,

  // espera
  waitingForLife: false,

  // progresión de tareas
  usedHintThisLevel: false,
  streakWithoutLose: 0,  // racha de niveles sin perder

  // contadores para desafíos
  counters: { wins: 0, matches: 0, purchases: 0, levelplay: 0 },

  // desafíos
  daily: null,   // {dayId, endsAt, tasks:[...]}
  weekly: null,  // {weekId, endsAt, tasks:[...]}
};

/* ----------------- Regen pura ----------------- */
const applyRegenPure = (s, tNow) => {
  let changed = false;
  let { lives, livesRegenAt, hints, hintsRegenAt } = s;
  if (lives < s.livesCap && livesRegenAt > 0) {
    while (lives < s.livesCap && tNow >= livesRegenAt) { lives++; livesRegenAt += REGEN_MS; changed = true; }
    if (lives >= s.livesCap && livesRegenAt !== 0) { livesRegenAt = 0; changed = true; }
  }
  if (hints < s.hintsCap && hintsRegenAt > 0) {
    while (hints < s.hintsCap && tNow >= hintsRegenAt) { hints++; hintsRegenAt += REGEN_MS; changed = true; }
    if (hints >= s.hintsCap && hintsRegenAt !== 0) { hintsRegenAt = 0; changed = true; }
  }
  return changed ? { ...s, lives, livesRegenAt, hints, hintsRegenAt } : s;
};

/* ----------------- Carga inicial ----------------- */
function lazyHydrate() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    const settings = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "null");
    let merged = { ...initialState, ...(saved || {}), ...(settings || {}) };
    merged.matched = new Set();
    merged = applyRegenPure(merged, Date.now());

    // Daily
    const id = todayId();
    if (!merged.daily || merged.daily.dayId !== id || Date.now() > (merged.daily?.endsAt || 0)) {
      merged.daily = dailyTemplate();
      // reset contadores diarios que no son acumulativos semanales
      merged.counters = { ...merged.counters, levelplay: 0 };
    }
    // Weekly
    const wk = getWeekId();
    if (!merged.weekly || merged.weekly.weekId !== wk || Date.now() > (merged.weekly?.endsAt || 0)) {
      merged.weekly = weeklyTemplate();
      merged.counters = { ...merged.counters, wins: 0, matches: 0, purchases: 0, levelplay: 0 };
    }

    return merged;
  } catch {
    const base = { ...initialState };
    base.daily = dailyTemplate();
    base.weekly = weeklyTemplate();
    return base;
  }
}

/* ----------------- Provider ----------------- */
export function GameProvider({ children }) {
  const [state, setState] = useState(lazyHydrate);
  const xpMultiplier = state.xpBoostUntil > Date.now() ? 2 : 1;

  // mazo por nivel
  useEffect(() => {
    const deck = generateLevel(state.level);
    setState((s) => ({
      ...s,
      deck,
      flipped: [],
      matched: new Set(),
      mistakes: 0,
      usedHintThisLevel: false
    }));
  }, [state.level]);

  // persistencia progreso + desafíos
  useEffect(() => {
    const toSave = {
      level: state.level, maxLevels: state.maxLevels,
      exp: state.exp, coins: state.coins, xpBoostUntil: state.xpBoostUntil,
      lives: state.lives, livesCap: state.livesCap, livesRegenAt: state.livesRegenAt,
      hints: state.hints, hintsCap: state.hintsCap, hintsRegenAt: state.hintsRegenAt,
      chestPending: state.chestPending, lastReward: state.lastReward, pendingReward: state.pendingReward,
      megaHints: state.megaHints, waitingForLife: state.waitingForLife,
      usedHintThisLevel: state.usedHintThisLevel,
      streakWithoutLose: state.streakWithoutLose,
      counters: state.counters,
      daily: state.daily,
      weekly: state.weekly,
      isLoggedIn: state.isLoggedIn, displayName: state.displayName,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  }, [state]);

  // persistencia settings
  useEffect(() => {
    const sets = {
      soundOn: state.soundOn, vibrationOn: state.vibrationOn,
      musicOn: state.musicOn, musicVol: state.musicVol,
      displayName: state.displayName, isLoggedIn: state.isLoggedIn,
    };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(sets));
  }, [state.soundOn, state.vibrationOn, state.musicOn, state.musicVol, state.displayName, state.isLoggedIn]);

  // tick regen + rotación de periodos
  useEffect(() => {
    const id = setInterval(() => {
      setState((s) => {
        // regen
        let updated = applyRegenPure(s, Date.now());

        // rotar diario
        if (Date.now() > (updated.daily?.endsAt || 0)) {
          updated = {
            ...updated,
            daily: dailyTemplate(),
            counters: { ...updated.counters, levelplay: 0 }
          };
        }
        // rotar semanal
        if (Date.now() > (updated.weekly?.endsAt || 0) || (updated.weekly?.weekId !== getWeekId())) {
          updated = {
            ...updated,
            weekly: weeklyTemplate(),
            counters: { ...updated.counters, wins: 0, matches: 0, purchases: 0, levelplay: 0 }
          };
        }

        // espera visible
        if (s.waitingForLife && updated.lives > s.lives) {
          updated = { ...updated, waitingForLife: false };
        }
        return updated;
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);

  /* ----------------- Juego ----------------- */
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
    const ca = state.deck[a], cb = state.deck[b];
    const isMatch = ca?.key === cb?.key;

    const t = setTimeout(() => {
      setState((s) => {
        if (isMatch) {
          Sound.match(s.soundOn);
          const m = new Set(s.matched); m.add(a); m.add(b);

          // +1 pareja a contadores y tareas
          let counters = { ...s.counters, matches: s.counters.matches + 1 };

          return { ...s, matched: m, flipped: [], counters };
        }
        const newLives = Math.max(0, s.lives - 1);
        let next = { ...s, flipped: [], lives: newLives, mistakes: s.mistakes + 1, streakWithoutLose: 0 };
        if (newLives < s.livesCap && next.livesRegenAt === 0) next.livesRegenAt = Date.now() + REGEN_MS;
        Sound.fail(s.soundOn);
        return next;
      });
    }, 600);
    return () => clearTimeout(t);
  }, [state.flipped, state.deck]);

  // fin de nivel
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

      // counters
      let counters = { ...s.counters, wins: s.counters.wins + 1, levelplay: s.counters.levelplay + 1 };
      let streakWithoutLose = (s.mistakes === 0) ? s.streakWithoutLose + 1 : s.streakWithoutLose;

      // actualizar progresos en daily/weekly (no se “reclama” aún)
      const updateTasks = (tasks) => tasks.map(t => {
        if (t.kind === "wins") {
          const p = Math.min(t.target, counters.wins);
          return { ...t, progress: p, done: p >= t.target || t.done };
        }
        if (t.kind === "matches") {
          const p = Math.min(t.target, s.counters.matches); // matches los acumulamos en flip
          return { ...t, progress: p, done: p >= t.target || t.done };
        }
        if (t.kind === "nohintwin" && !s.usedHintThisLevel) {
          const p = Math.min(t.target, (t.progress || 0) + 1);
          return { ...t, progress: p, done: p >= t.target || t.done };
        }
        if (t.kind === "levelplay") {
          const p = Math.min(t.target, counters.levelplay);
          return { ...t, progress: p, done: p >= t.target || t.done };
        }
        if (t.kind === "streak" && s.mistakes === 0) {
          const p = Math.min(t.target, (t.progress || 0) + 1);
          return { ...t, progress: p, done: p >= t.target || t.done };
        }
        return t;
      });

      const daily = s.daily ? { ...s.daily, tasks: updateTasks(s.daily.tasks || []) } : s.daily;
      const weekly = s.weekly ? { ...s.weekly, tasks: updateTasks(s.weekly.tasks || []) } : s.weekly;

      return {
        ...s,
        exp: s.exp + gainedXP,
        coins: s.coins + 30,
        level: nextLevel,
        chestPending: chest,
        usedHintThisLevel: false,
        counters,
        daily,
        weekly,
        streakWithoutLose
      };
    });
  }, [state.matched, state.lives, state.deck, xpMultiplier]);

  // pistas
  const useHint = () =>
    setState((s) => {
      if (s.hints <= 0) return s;
      const hints = s.hints - 1;
      let next = { ...s, hints, usedHintThisLevel: true };
      if (hints < s.hintsCap && next.hintsRegenAt === 0) next.hintsRegenAt = Date.now() + REGEN_MS;
      return next;
    });

  const useMegaHint = () =>
    setState((s) => (s.megaHints > 0 ? { ...s, megaHints: s.megaHints - 1, usedHintThisLevel: true } : s));

  // espera +1 vida
  const startWaitingForLife = () =>
    setState((s) => {
      if (s.lives >= s.livesCap) return s;
      let next = { ...s, waitingForLife: true };
      if (next.livesRegenAt === 0) next.livesRegenAt = Date.now() + REGEN_MS;
      return next;
    });
  const cancelWaitingForLife = () => setState((s) => ({ ...s, waitingForLife: false }));

  // costos tienda
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

  // helper: bump purchase counter
  const bumpPurchase = (s) => ({ ...s, counters: { ...s.counters, purchases: s.counters.purchases + 1 } });

  // tienda
  const purchaseHint = () =>
    setState((s) => {
      if (s.coins < COST_HINT) return s;
      const hints = Math.min(s.hints + 1, s.hintsCap);
      let next = { ...s, coins: s.coins - COST_HINT, hints, hintsRegenAt: hints >= s.hintsCap ? 0 : s.hintsRegenAt };
      return bumpPurchase(next);
    });

  const purchaseLife = () =>
    setState((s) => {
      if (s.coins < COST_LIFE || s.lives >= s.livesCap) return s;
      const lives = s.lives + 1;
      let next = { ...s, coins: s.coins - COST_LIFE, lives, livesRegenAt: lives >= s.livesCap ? 0 : s.livesRegenAt };
      return bumpPurchase(next);
    });

  const purchaseRefillLives = () =>
    setState((s) => {
      if (s.coins < COST_REFILL_LIVES || s.lives >= s.livesCap) return s;
      let next = { ...s, coins: s.coins - COST_REFILL_LIVES, lives: s.livesCap, livesRegenAt: 0 };
      return bumpPurchase(next);
    });

  const purchaseMegaHint = () =>
    setState((s) => (s.coins < COST_MEGA_HINT ? s : bumpPurchase({ ...s, coins: s.coins - COST_MEGA_HINT, megaHints: s.megaHints + 1 })));

  const purchaseXpBoost = () =>
    setState((s) => {
      if (s.coins < COST_XPBOOST) return s;
      const until = Math.max(Date.now(), s.xpBoostUntil) + 15 * 60 * 1000;
      let next = { ...s, coins: s.coins - COST_XPBOOST, xpBoostUntil: until };
      return bumpPurchase(next);
    });

  const upgradeLivesCap = () =>
    setState((s) => {
      const cost = nextLivesCapCost(); if (cost == null || s.coins < cost) return s;
      return { ...s, coins: s.coins - cost, livesCap: Math.min(LIVES_CAP_MAX, s.livesCap + 1) };
    });

  const upgradeHintsCap = () =>
    setState((s) => {
      const cost = nextHintsCapCost(); if (cost == null || s.coins < cost) return s;
      return { ...s, coins: s.coins - cost, hintsCap: Math.min(HINTS_CAP_MAX, s.hintsCap + 1) };
    });

  // cofres (igual)
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
      if (r.type === "xpBoost") next.xpBoostUntil = Math.max(Date.now(), s.xpBoostUntil) + 15 * 60 * 1000;
      if (r.type === "coins")   next.coins = s.coins + (r.amount || 0);
      if (r.type === "exp")     next.exp   = s.exp   + (r.amount || 0);
      return next;
    });
  const denyReward = () => setState((s) => ({ ...s, pendingReward: null, chestPending: false }));

  /* ----------------- Reclamar recompensas de tareas ----------------- */
  function applyTaskReward(next, reward) {
    if (!reward) return next;
    if (reward.type === "coins")   return { ...next, coins: next.coins + (reward.amount||0) };
    if (reward.type === "exp")     return { ...next, exp: next.exp + (reward.amount||0) };
    if (reward.type === "xpBoost") return { ...next, xpBoostUntil: Math.max(Date.now(), next.xpBoostUntil) + (reward.minutes||10) * 60 * 1000 };
    if (reward.type === "megaHint")return { ...next, megaHints: next.megaHints + (reward.amount||1) };
    if (reward.type === "life") {
      const inc = Math.min(next.livesCap - next.lives, reward.amount||1);
      return { ...next, lives: next.lives + Math.max(0, inc) };
    }
    return next;
  }

  const claimTask = (scope, taskId) =>
    setState((s) => {
      if (scope !== "daily" && scope !== "weekly") return s;
      const pack = s[scope];
      if (!pack) return s;
      const tasks = (pack.tasks || []).map(t => {
        if (t.id !== taskId) return t;
        if (!t.done || t.claimed) return t; // no dup
        return { ...t, claimed: true };
      });
      const claimed = (pack.tasks || []).find(t => t.id === taskId);
      if (!claimed || !claimed.done || claimed.claimed) return s;

      let next = { ...s, [scope]: { ...pack, tasks } };
      next = applyTaskReward(next, claimed.reward);
      Sound.match(s.soundOn);
      return next;
    });

  // ajustes / auth / música
  const toggleSound = () => setState((s) => ({ ...s, soundOn: !s.soundOn }));
  const toggleVibration = () => setState((s) => ({ ...s, vibrationOn: !s.vibrationOn }));
  const setDisplayName = (name) => setState((s) => ({ ...s, displayName: (name || "Jugador").slice(0, 24) }));
  const setMusicOn = (on) => setState((s) => ({ ...s, musicOn: !!on }));
  const setMusicVol = (v) => setState((s) => ({ ...s, musicVol: Math.max(0, Math.min(1, Number(v) || 0)) }));

  const login = (name) => setState((s) => ({ ...s, displayName: (name || "Jugador").slice(0, 24), isLoggedIn: true }));
  const logout = () => setState((s) => ({ ...s, isLoggedIn: false }));

  const resetProgress = () =>
    setState((s) => ({
      ...s,
      level: 1, exp: 0, coins: 0, xpBoostUntil: 0,
      lives: LIVES_CAP_BASE, livesCap: Math.max(s.livesCap, LIVES_CAP_BASE), livesRegenAt: 0,
      hints: HINTS_CAP_BASE, hintsCap: Math.max(s.hintsCap, HINTS_CAP_BASE), hintsRegenAt: 0,
      deck: [], flipped: [], matched: new Set(), mistakes: 0,
      chestPending: false, lastReward: null, pendingReward: null,
      megaHints: 0, waitingForLife: false,
      usedHintThisLevel: false,
      streakWithoutLose: 0,
      counters: { wins: 0, matches: 0, purchases: 0, levelplay: 0 },
      daily: dailyTemplate(),
      weekly: weeklyTemplate(),
    }));

  const getSnapshot = () => {
    try {
      const progress = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      const settings = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}");
      return { exportedAt: new Date().toISOString(), version: "v6+daily", progress, settings };
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
      purchaseHint, purchaseLife, purchaseRefillLives, purchaseMegaHint, purchaseXpBoost, upgradeLivesCap, upgradeHintsCap,
      COST_HINT, COST_XPBOOST, COST_LIFE, COST_REFILL_LIVES, COST_MEGA_HINT, nextLivesCapCost, nextHintsCapCost,
      // tareas
      claimTask,
      // ajustes / auth / música
      toggleSound, toggleVibration, setDisplayName, login, logout, setMusicOn, setMusicVol,
      // meta
      xpMultiplier, REGEN_MS, LIVES_CAP_BASE, LIVES_CAP_MAX, HINTS_CAP_BASE, HINTS_CAP_MAX,
      // backup
      resetProgress, getSnapshot,
      // level titles
      getLevelTitle,
    }),
    [state, xpMultiplier]
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}
