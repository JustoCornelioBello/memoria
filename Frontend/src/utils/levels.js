// src/utils/levels.js
// Generación de mazos (igual a tu lógica) + títulos
const EMOJIS = ["🍎","🍌","🍇","🍉","🥝","🍓","🍒","🍑","🍍","🥥","🐶","🐱","🐻","🦊","🦁","🐯","🐸","🐵","⚽","🏀","🏈","🎾","🎲","🎯","🚗","🚕","🚀","✈️","🛸","⛵","🎧","🎹","🥁","🎮","🧩","💡","🔑","🧸","🍩","🍪","🍰"];

export function getLevelTitle(level = 1) {
  const bands = [
    { max: 3,  title: "Fruta Fresca" },
    { max: 6,  title: "Bestiario Básico" },
    { max: 9,  title: "Juguetes y Trucos" },
    { max: 12, title: "Velocidad Media" },
    { max: 15, title: "Memoria Fina" },
    { max: 20, title: "Mano Experta" },
    { max: 30, title: "Cerebro Pro" },
    { max: 40, title: "Maestro del Puzzle" },
    { max: 50, title: "Leyenda de la Memoria" },
  ];
  return (bands.find(b => level <= b.max)?.title) || "Desafío";
}

function shuffle(a){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }

export function generateLevel(level=1){
  // Tu progresión: 4 cartas (niveles 1-3), 6 (4-6), 8 (7-9) ... hasta 18 máx
  const steps = Math.min(9, Math.ceil(level/3)); // 1..9
  const cardsCount = Math.min(18, 2 + steps * 2); // 4,6,8,...,18
  const pairs = Math.floor(cardsCount / 2);
  const picks = shuffle([...EMOJIS]).slice(0, pairs);
  const deck = shuffle(picks.flatMap((e, i) => ([
    { key: `k${i}`, face: e },
    { key: `k${i}`, face: e },
  ])));
  return deck;
}
