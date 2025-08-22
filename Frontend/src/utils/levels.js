// Escalado pedido:
// - Niveles 1–3  => 4 cartas (2 pares)
// - Niveles 4–6  => 6 cartas (3 pares)
// - Niveles 7–9  => 8 cartas (4 pares)
// - ... sube de 2 en 2 cada 3 niveles
// - Máximo: 18 cartas (9 pares)

const EMOJIS = {
  frutas: ["🍎","🍌","🍇","🍉","🍒","🍍","🍓","🥝","🍑","🥥","🍐","🍊","🍈","🍋","🥭"],
  animales: ["🐶","🐱","🐭","🐼","🦊","🦁","🐸","🐵","🦉","🐨","🐯","🐷","🐮","🐔","🦄"],
  objetos: ["⚽","🎲","🎧","📷","⌚","📱","💡","🎁","🔑","🧸","🧩","🎮","🕹️","📚","🖊️"]
};

function randomPairs(n, pool) {
  const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, n);
  const pairs = shuffled.flatMap((symbol) => [
    { key: symbol + "-a", symbol, type: "pair" },
    { key: symbol + "-b", symbol, type: "pair" }
  ]);
  return pairs.sort(() => Math.random() - 0.5);
}

export function generateLevel(level) {
  // cálculo de cartas según regla: +2 cartas cada 3 niveles, tope 18
  const CARDS_MIN = 4;
  const CARDS_STEP = 2;
  const LEVELS_PER_STEP = 3;
  const CARDS_MAX = 18;

  const cards = Math.min(
    CARDS_MIN + CARDS_STEP * Math.floor((level - 1) / LEVELS_PER_STEP),
    CARDS_MAX
  );
  const pairsCount = Math.floor(cards / 2);

  // alternar categorías para variedad
  const categories = ["frutas", "animales", "objetos"];
  const category = categories[(level - 1) % categories.length];
  const pool = EMOJIS[category];

  const pairs = randomPairs(pairsCount, pool);
  // clave por símbolo para que el match sea por símbolo
  const deck = pairs.map((p) => ({ key: p.symbol, symbol: p.symbol }));
  return deck.sort(() => Math.random() - 0.5);
}
