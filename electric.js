// Electric Border Effect - OPTIMIZED (Intersection Observer untuk product page)

(function () {
  const isMobile = window.innerWidth <= 768 || /Android|iPhone|iPad/i.test(navigator.userAgent);

  const COLOR = '#ff6600';
  const COLOR_INNER = '#ffaa44';
  const SPEED = isMobile ? 1.0 : 1.5;
  const CHAOS = isMobile ? 0.15 : 0.2;
  const BORDER_RADIUS = 18;
  const BORDER_OFFSET = 3;
  const DISPLACEMENT = isMobile ? 5 : 8;
  const OCTAVES = isMobile ? 4 : 6;
  const TARGET_FPS = isMobile ? 30 : 60;
  const FRAME_INTERVAL = 1000 / TARGET_FPS;

  function random(x) {
    return ((Math.sin(x * 12.9898) * 43758.5453) % 1 + 1) % 1;
  }

  function noise2D(x, y) {
    const i = Math.floor(x), j = Math.floor(y);
    const fx = x - i, fy = y - j;
    const a = random(i + j * 57), b = random(i + 1 + j * 57);
    const c = random(i + (j + 1) * 57), d = random(i + 1 + (j + 1) * 57);
    const ux = fx * fx * (3.0 - 2.0 * fx);
    const uy = fy * fy * (3.0 - 2.0 * fy);
    return a * (1 - ux) * (1 - uy) + b * ux * (1 - uy) + c * (1 - ux) * uy + d * ux * uy;
  }

  function octavedNoise(x, time, seed) {
    let y = 0, amp = CHAOS, freq = 8;
    for (let i = 0; i < OCTAVES; i++) {
      y += amp * noise2D(freq * x + seed * 100, time * freq * 0.4);
      freq *= 1.8; amp *= 0.65;
    }
    return y;
  }

  function getCornerPoint(cx, cy, r, startAngle, arcLength, progress) {
    const angle = startAngle + progress * arcLength;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  }

  function getRoundedRectPoint(t, left, top, width, height, radius) {
    const sw = width - 2 * radius, sh = height - 2 * radius;
    const ca = (Math.PI * radius) / 2;
    const totalPerimeter = 2 * sw + 2 * sh + 4 * ca;
    const distance = t * totalPerimeter;
    let acc = 0;

    if (distance <= acc + sw) return { x: left + radius + (distance - acc), y: top };
    acc += sw;
    if (distance <= acc + ca) return getCornerPoint(left + width - radius, top + radius, radius, -Math.PI / 2, Math.PI / 2, (distance - acc) / ca);
    acc += ca;
    if (distance <= acc + sh) return { x: left + width, y: top + radius + (distance - acc) };
    acc += sh;
    if (distance <= acc + ca) return getCornerPoint(left + width - radius, top + height - radius, radius, 0, Math.PI / 2, (distance - acc) / ca);
    acc += ca;
    if (distance <= acc + sw) return { x: left + width - radius - (distance - acc), y: top + height };
    acc += sw;
    if (distance <= acc + ca) return getCornerPoint(left + radius, top + height - radius, radius, Math.PI / 2, Math.PI / 2, (distance - acc) / ca);
    acc += ca;
    if (distance <= acc + sh) return { x: left, y: top + height - radius - (distance - acc) };
    acc += sh;
    return getCornerPoint(left + radius, top + radius, radius, Math.PI, Math.PI / 2, (distance - acc) / ca);
  }

  function createElectricBorder(target) {
    const existingPos = window.getComputedStyle(target).position;
    if (existingPos === 'static') target.style.position = 'relative';
    target.style.overflow = 'visible';

    const oldCanvas = target.querySelector('.eb-canvas');
    if (oldCanvas) oldCanvas.remove();

    const canvas = document.createElement('canvas');
    canvas.className = 'eb-canvas';
    canvas.style.cssText = 'position:absolute;pointer-events:none;z-index:15;top:0;left:0;width:100%;height:100%;';
    target.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    let timeRef = 0, lastFrameTime = 0, lastRender = 0;
    let animId = null;
    let width = 0, height = 0;
    let isVisible = false; // Intersection Observer control

    function updateSize() {
      width = target.clientWidth;
      height = target.clientHeight;
      canvas.width = width;
      canvas.height = height;
    }

    function draw(currentTime) {
      if (!target.isConnected) { cancelAnimationFrame(animId); animId = null; return; }
      if (!isVisible) { animId = requestAnimationFrame(draw); return; } // Skip render jika tidak terlihat

      if (currentTime - lastRender < FRAME_INTERVAL) { animId = requestAnimationFrame(draw); return; }
      lastRender = currentTime;

      const delta = (currentTime - lastFrameTime) / 1000;
      if (delta > 0 && delta < 0.1) timeRef += delta * SPEED;
      lastFrameTime = currentTime;

      if (width !== target.clientWidth || height !== target.clientHeight) updateSize();
      if (width <= 0 || height <= 0) { animId = requestAnimationFrame(draw); return; }

      ctx.clearRect(0, 0, width, height);

      const left = BORDER_OFFSET, top = BORDER_OFFSET;
      const bw = width - 2 * BORDER_OFFSET, bh = height - 2 * BORDER_OFFSET;
      if (bw <= 0 || bh <= 0) { animId = requestAnimationFrame(draw); return; }

      const maxR = Math.min(bw, bh) / 2;
      const radius = Math.min(BORDER_RADIUS, maxR);
      const approxPerimeter = 2 * (bw + bh) + 2 * Math.PI * radius;
      const sampleCount = isMobile
        ? Math.floor(approxPerimeter / 5)
        : Math.floor(approxPerimeter / 2);

      // Layer 1
      ctx.beginPath();
      for (let i = 0; i <= sampleCount; i++) {
        const p = i / sampleCount;
        const pt = getRoundedRectPoint(p, left, top, bw, bh, radius);
        const dx = pt.x + octavedNoise(p * 5, timeRef, 0) * DISPLACEMENT;
        const dy = pt.y + octavedNoise(p * 5, timeRef, 1) * DISPLACEMENT;
        i === 0 ? ctx.moveTo(dx, dy) : ctx.lineTo(dx, dy);
      }
      ctx.closePath();
      ctx.strokeStyle = COLOR;
      ctx.lineWidth = isMobile ? 3 : 4;
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.shadowBlur = isMobile ? 4 : 8;
      ctx.shadowColor = '#ff6600';
      ctx.stroke();

      // Layer 2
      ctx.beginPath();
      for (let i = 0; i <= sampleCount; i++) {
        const p = i / sampleCount;
        const pt = getRoundedRectPoint(p, left, top, bw, bh, radius);
        const dx = pt.x + octavedNoise(p * 6 + 2, timeRef, 0) * (DISPLACEMENT * 0.6);
        const dy = pt.y + octavedNoise(p * 6 + 2, timeRef, 1) * (DISPLACEMENT * 0.6);
        i === 0 ? ctx.moveTo(dx, dy) : ctx.lineTo(dx, dy);
      }
      ctx.closePath();
      ctx.strokeStyle = COLOR_INNER;
      ctx.lineWidth = 2;
      ctx.shadowBlur = isMobile ? 2 : 4;
      ctx.stroke();

      // Layer 3 - laptop only
      if (!isMobile) {
        ctx.beginPath();
        for (let i = 0; i <= sampleCount; i++) {
          const p = i / sampleCount;
          const pt = getRoundedRectPoint(p, left, top, bw, bh, radius);
          const dx = pt.x + octavedNoise(p * 8 + 4, timeRef, 0) * (DISPLACEMENT * 0.3);
          const dy = pt.y + octavedNoise(p * 8 + 4, timeRef, 1) * (DISPLACEMENT * 0.3);
          i === 0 ? ctx.moveTo(dx, dy) : ctx.lineTo(dx, dy);
        }
        ctx.closePath();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 0.8;
        ctx.shadowBlur = 2;
        ctx.stroke();

        // Titik sudut
        const pulse = 0.5 + Math.sin(timeRef * 20) * 0.3;
        ctx.globalAlpha = pulse;
        [[BORDER_OFFSET, BORDER_OFFSET], [width - BORDER_OFFSET, BORDER_OFFSET],
         [BORDER_OFFSET, height - BORDER_OFFSET], [width - BORDER_OFFSET, height - BORDER_OFFSET]
        ].forEach(([cx, cy]) => {
          ctx.beginPath(); ctx.arc(cx, cy, 3, 0, Math.PI * 2);
          ctx.fillStyle = '#ff6600'; ctx.fill();
          ctx.beginPath(); ctx.arc(cx, cy, 1.5, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff'; ctx.fill();
        });
        ctx.globalAlpha = 1;
      }

      ctx.shadowBlur = 0;
      animId = requestAnimationFrame(draw);
    }

    updateSize();

    // Intersection Observer: hanya render saat elemen terlihat
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        isVisible = entry.isIntersecting;
      });
    }, { threshold: 0.1 });
    observer.observe(target);

    animId = requestAnimationFrame(draw);

    const ro = new ResizeObserver(() => updateSize());
    ro.observe(target);

    return () => {
      if (animId) cancelAnimationFrame(animId);
      ro.disconnect();
      observer.disconnect();
      if (canvas.parentNode) canvas.remove();
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initElectricBorders);
  } else {
    initElectricBorders();
  }

  function initElectricBorders() {
    const selectors = [
      '.options .card',
      '.product-card',
      '.container',
      '.why-card',
      '.contact-card'
    ];
    selectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(el => {
        if (!el.querySelector('.eb-canvas')) createElectricBorder(el);
      });
    });
  }
})();