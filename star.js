(function () {
  const canvas = document.getElementById('star-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let stars = [];
  const N = 140;

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function initStars() {
    stars = Array.from({ length: N }, () => ({
      x:            Math.random() * canvas.width,
      y:            Math.random() * canvas.height,
      r:            Math.random() * 1.2 + 0.2,
      alpha:        Math.random() * 0.6 + 0.15,
      speed:        Math.random() * 0.2 + 0.04,
      twinkleSpeed: Math.random() * 0.007 + 0.002,
      twinkleDir:   Math.random() > 0.5 ? 1 : -1,
      isCyan:       Math.random() > 0.85,
    }));
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const s of stars) {
      s.alpha += s.twinkleSpeed * s.twinkleDir;
      if (s.alpha > 0.85 || s.alpha < 0.08) s.twinkleDir *= -1;
      s.y -= s.speed;
      if (s.y < -2) {
        s.y = canvas.height + 2;
        s.x = Math.random() * canvas.width;
      }
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = s.isCyan
        ? `rgba(0,229,255,${s.alpha})`
        : `rgba(200,235,255,${s.alpha})`;
      ctx.fill();
    }
    requestAnimationFrame(draw);
  }

  resize();
  initStars();
  draw();
  window.addEventListener('resize', () => { resize(); initStars(); });
})();
