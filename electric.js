// Electric Border Effect - STRONG VERSION (efek tebal dan terang)

(function () {
  const COLOR = '#ff6600';
  const COLOR_INNER = '#ffaa44';
  const SPEED = 1.5;
  const CHAOS = 0.2;
  const BORDER_RADIUS = 18;
  const BORDER_OFFSET = 3;
  const DISPLACEMENT = 8;

  function random(x) {
    return ((Math.sin(x * 12.9898) * 43758.5453) % 1 + 1) % 1;
  }

  function noise2D(x, y) {
    const i = Math.floor(x);
    const j = Math.floor(y);
    const fx = x - i;
    const fy = y - j;
    const a = random(i + j * 57);
    const b = random(i + 1 + j * 57);
    const c = random(i + (j + 1) * 57);
    const d = random(i + 1 + (j + 1) * 57);
    const ux = fx * fx * (3.0 - 2.0 * fx);
    const uy = fy * fy * (3.0 - 2.0 * fy);
    return a * (1 - ux) * (1 - uy) + b * ux * (1 - uy) + c * (1 - ux) * uy + d * ux * uy;
  }

  function octavedNoise(x, time, seed) {
    const octaves = 6, lacunarity = 1.8, gain = 0.65;
    const amplitude = CHAOS, frequency = 8;
    let y = 0, amp = amplitude, freq = frequency;
    for (let i = 0; i < octaves; i++) {
      y += amp * noise2D(freq * x + seed * 100, time * freq * 0.4);
      freq *= lacunarity;
      amp *= gain;
    }
    return y;
  }

  function getCornerPoint(cx, cy, r, startAngle, arcLength, progress) {
    const angle = startAngle + progress * arcLength;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  }

  function getRoundedRectPoint(t, left, top, width, height, radius) {
    const sw = width - 2 * radius;
    const sh = height - 2 * radius;
    const ca = (Math.PI * radius) / 2;
    const totalPerimeter = 2 * sw + 2 * sh + 4 * ca;
    const distance = t * totalPerimeter;
    let acc = 0;

    if (distance <= acc + sw) {
      return { x: left + radius + (distance - acc), y: top };
    }
    acc += sw;
    if (distance <= acc + ca) {
      return getCornerPoint(left + width - radius, top + radius, radius, -Math.PI / 2, Math.PI / 2, (distance - acc) / ca);
    }
    acc += ca;
    if (distance <= acc + sh) {
      return { x: left + width, y: top + radius + (distance - acc) };
    }
    acc += sh;
    if (distance <= acc + ca) {
      return getCornerPoint(left + width - radius, top + height - radius, radius, 0, Math.PI / 2, (distance - acc) / ca);
    }
    acc += ca;
    if (distance <= acc + sw) {
      return { x: left + width - radius - (distance - acc), y: top + height };
    }
    acc += sw;
    if (distance <= acc + ca) {
      return getCornerPoint(left + radius, top + height - radius, radius, Math.PI / 2, Math.PI / 2, (distance - acc) / ca);
    }
    acc += ca;
    if (distance <= acc + sh) {
      return { x: left, y: top + height - radius - (distance - acc) };
    }
    acc += sh;
    return getCornerPoint(left + radius, top + radius, radius, Math.PI, Math.PI / 2, (distance - acc) / ca);
  }

  function createElectricBorder(target) {
    const existingPos = window.getComputedStyle(target).position;
    if (existingPos === 'static') {
      target.style.position = 'relative';
    }
    target.style.overflow = 'visible';

    // Hapus canvas lama jika ada
    const oldCanvas = target.querySelector('.eb-canvas');
    if (oldCanvas) oldCanvas.remove();

    const canvas = document.createElement('canvas');
    canvas.className = 'eb-canvas';
    canvas.style.position = 'absolute';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '15';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    target.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    let timeRef = 0;
    let lastFrameTime = 0;
    let animId;
    let width, height;

    function updateSize() {
      width = target.clientWidth;
      height = target.clientHeight;
      canvas.width = width;
      canvas.height = height;
    }

    updateSize();
    animId = requestAnimationFrame(draw);

    function draw(currentTime) {
      if (!target.isConnected) {
        cancelAnimationFrame(animId);
        return;
      }
      
      const delta = (currentTime - lastFrameTime) / 1000;
      if (delta > 0 && delta < 0.1) timeRef += delta * SPEED;
      lastFrameTime = currentTime;

      if (width !== target.clientWidth || height !== target.clientHeight) {
        updateSize();
      }
      
      if (width <= 0 || height <= 0) {
        animId = requestAnimationFrame(draw);
        return;
      }

      ctx.clearRect(0, 0, width, height);

      const left = BORDER_OFFSET;
      const top = BORDER_OFFSET;
      const bw = width - 2 * BORDER_OFFSET;
      const bh = height - 2 * BORDER_OFFSET;
      
      if (bw <= 0 || bh <= 0) {
        animId = requestAnimationFrame(draw);
        return;
      }
      
      const maxR = Math.min(bw, bh) / 2;
      const radius = Math.min(BORDER_RADIUS, maxR);
      const approxPerimeter = 2 * (bw + bh) + 2 * Math.PI * radius;
      const sampleCount = Math.floor(approxPerimeter / 2);

      // LAYER 1: Outer glow tebal
      ctx.beginPath();
      for (let i = 0; i <= sampleCount; i++) {
        const progress = i / sampleCount;
        const point = getRoundedRectPoint(progress, left, top, bw, bh, radius);
        const xn = octavedNoise(progress * 5, timeRef, 0);
        const yn = octavedNoise(progress * 5, timeRef, 1);
        const dx = point.x + xn * DISPLACEMENT;
        const dy = point.y + yn * DISPLACEMENT;
        if (i === 0) ctx.moveTo(dx, dy);
        else ctx.lineTo(dx, dy);
      }
      ctx.closePath();
      ctx.strokeStyle = COLOR;
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.shadowBlur = 8;
      ctx.shadowColor = '#ff6600';
      ctx.stroke();

      // LAYER 2: Garis tengah
      ctx.beginPath();
      for (let i = 0; i <= sampleCount; i++) {
        const progress = i / sampleCount;
        const point = getRoundedRectPoint(progress, left, top, bw, bh, radius);
        const xn = octavedNoise(progress * 6 + 2, timeRef, 0);
        const yn = octavedNoise(progress * 6 + 2, timeRef, 1);
        const dx = point.x + xn * (DISPLACEMENT * 0.6);
        const dy = point.y + yn * (DISPLACEMENT * 0.6);
        if (i === 0) ctx.moveTo(dx, dy);
        else ctx.lineTo(dx, dy);
      }
      ctx.closePath();
      ctx.strokeStyle = COLOR_INNER;
      ctx.lineWidth = 2;
      ctx.shadowBlur = 4;
      ctx.stroke();

      // LAYER 3: Garis dalam tipis (efek listrik)
      ctx.beginPath();
      for (let i = 0; i <= sampleCount; i++) {
        const progress = i / sampleCount;
        const point = getRoundedRectPoint(progress, left, top, bw, bh, radius);
        const xn = octavedNoise(progress * 8 + 4, timeRef, 0);
        const yn = octavedNoise(progress * 8 + 4, timeRef, 1);
        const dx = point.x + xn * (DISPLACEMENT * 0.3);
        const dy = point.y + yn * (DISPLACEMENT * 0.3);
        if (i === 0) ctx.moveTo(dx, dy);
        else ctx.lineTo(dx, dy);
      }
      ctx.closePath();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 0.8;
      ctx.shadowBlur = 2;
      ctx.stroke();

      // Reset shadow
      ctx.shadowBlur = 0;
      
      // Tambahkan titik-titik berkedip di sudut (efek percikan)
      ctx.fillStyle = '#ffaa44';
      const pulse = 0.5 + Math.sin(timeRef * 20) * 0.3;
      ctx.globalAlpha = pulse;
      
      const corners = [
        [BORDER_OFFSET, BORDER_OFFSET],
        [width - BORDER_OFFSET, BORDER_OFFSET],
        [BORDER_OFFSET, height - BORDER_OFFSET],
        [width - BORDER_OFFSET, height - BORDER_OFFSET]
      ];
      
      corners.forEach(corner => {
        ctx.beginPath();
        ctx.arc(corner[0], corner[1], 3, 0, Math.PI * 2);
        ctx.fillStyle = '#ff6600';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(corner[0], corner[1], 1.5, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
      });
      
      ctx.globalAlpha = 1;

      animId = requestAnimationFrame(draw);
    }

    const ro = new ResizeObserver(() => updateSize());
    ro.observe(target);

    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
      if (canvas.parentNode) canvas.remove();
    };
  }

  // Jalankan saat DOM ready
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
        if (!el.querySelector('.eb-canvas')) {
          createElectricBorder(el);
        }
      });
    });
  }
})();