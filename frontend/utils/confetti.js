/**
 * Lightweight, high-performance canvas confetti generator
 * Zero external dependencies.
 */
export function fireConfetti(options = {}) {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const canvas = document.createElement('canvas');
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '999999';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  const colors = [
    '#38bdf8', // sky blue
    '#818cf8', // indigo
    '#c084fc', // purple
    '#fbbf24', // amber gold
    '#34d399', // emerald
    '#f43f5e', // rose
    '#22d3ee', // cyan
  ];

  const particleCount = options.particleCount || 100;
  const originX = options.originX !== undefined ? options.originX * width : width / 2;
  const originY = options.originY !== undefined ? options.originY * height : height * 0.25;

  const particles = [];
  for (let i = 0; i < particleCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 4 + Math.random() * 9;
    particles.push({
      x: originX,
      y: originY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 3.5, // initial burst upward
      size: 6 + Math.random() * 6,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 12,
      opacity: 1,
      drag: 0.96,
      gravity: 0.22,
      tilt: Math.random() * 10,
    });
  }

  let animationFrameId;
  const startTime = Date.now();
  const duration = options.duration || 2800; // 2.8 seconds

  function render() {
    const elapsed = Date.now() - startTime;
    if (elapsed > duration || particles.length === 0) {
      if (canvas.parentNode) {
        canvas.parentNode.removeChild(canvas);
      }
      return;
    }

    ctx.clearRect(0, 0, width, height);

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= p.drag;
      p.vy = p.vy * p.drag + p.gravity;
      p.rotation += p.rotationSpeed;
      p.opacity = Math.max(0, 1 - elapsed / duration);

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.globalAlpha = p.opacity;
      ctx.fillStyle = p.color;

      // Draw small rectangle / ribbon confetti
      ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      ctx.restore();
    }

    animationFrameId = requestAnimationFrame(render);
  }

  animationFrameId = requestAnimationFrame(render);

  return () => {
    cancelAnimationFrame(animationFrameId);
    if (canvas.parentNode) {
      canvas.parentNode.removeChild(canvas);
    }
  };
}
