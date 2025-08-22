let audioCtx;
function ensureCtx() {
  if (!audioCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) audioCtx = new AC();
  }
}
function beep(freq = 440, duration = 120, type = "sine", volume = 0.1) {
  ensureCtx(); if (!audioCtx) return;
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = type; o.frequency.value = freq; g.gain.value = volume;
  o.connect(g); g.connect(audioCtx.destination);
  o.start(); setTimeout(() => { o.stop(); }, duration);
}
export const Sound = {
  flip(on) { if (!on) return; beep(520, 80, "sine", .07); },
  match(on) { if (!on) return; beep(660, 110, "triangle", .08); setTimeout(() => beep(880, 110, "triangle", .08), 90); },
  fail(on) { if (!on) return; beep(220, 160, "sawtooth", .08); },
  chest(on) { if (!on) return; beep(700, 100, "square", .07); setTimeout(() => beep(900, 120, "square", .07), 120); setTimeout(() => beep(1100, 140, "square", .07), 260); }
};
