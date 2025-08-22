// Confeti liviano sin dependencias
export function confettiBurst({
  particles = 120,
  spread = 60,      // en grados
  gravity = 0.15,
  decay = 0.008,
  scalar = 1,
  duration = 1600,  // ms
} = {}) {
  const colors = ["#ff4d4f", "#40a9ff", "#73d13d", "#faad14", "#9254de", "#13c2c2"];
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  let W = (canvas.width = window.innerWidth);
  let H = (canvas.height = window.innerHeight);
  canvas.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:9999;";
  document.body.appendChild(canvas);

  const px = W / 2, py = H / 3;
  const rad = (deg) => (deg * Math.PI) / 180;
  const rand = (min, max) => Math.random() * (max - min) + min;

  const parts = Array.from({ length: particles }, () => {
    const angle = rad(rand(-spread / 2, spread / 2) - 90);
    const speed = rand(6, 11) * scalar;
    return {
      x: px, y: py,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      r: rand(2, 4) * scalar,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: 1,
      tilt: rand(-0.5, 0.5),
      decay: decay + Math.random() * decay,
    };
  });

  let start = performance.now();
  function frame(t) {
    const elapsed = t - start;
    ctx.clearRect(0, 0, W, H);

    for (const p of parts) {
      p.vy += gravity;
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= p.decay;
      ctx.globalAlpha = Math.max(p.alpha, 0);
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.tilt);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.r, -p.r, p.r * 2, p.r * 2);
      ctx.restore();
    }

    if (elapsed < duration && parts.some((p) => p.alpha > 0)) {
      requestAnimationFrame(frame);
    } else {
      document.body.removeChild(canvas);
    }
  }
  requestAnimationFrame(frame);

  // Responsivo
  const onResize = () => {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  };
  window.addEventListener("resize", onResize, { passive: true });
  setTimeout(() => window.removeEventListener("resize", onResize), duration + 500);
}
