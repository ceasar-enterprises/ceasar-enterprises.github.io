(function () {
  'use strict';

  var canvas = document.getElementById('heroScene');
  if (!canvas) return;
  var hero = canvas.parentElement;
  var ctx = canvas.getContext('2d');

  var T = 9.6;
  var W = 0, H = 0, dpr = 1;
  var loopTime = 0, lastNow = 0;
  var particles = [];
  var sprites = {};

  function mulberry32(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  var rng = mulberry32(20260827);
  function rr(a, b) { return a + rng() * (b - a); }

  function rad(deg) { return deg * Math.PI / 180; }

  var GOLD = '232,184,75';
  var AMBER = '247,214,148';
  var BRONZE = '138,90,31';

  function spriteParticle() {
    var s = document.createElement('canvas');
    s.width = 32; s.height = 32;
    var c = s.getContext('2d');
    var g = c.createRadialGradient(16, 16, 0, 16, 16, 16);
    g.addColorStop(0, 'rgba(247,214,148,1)');
    g.addColorStop(0.25, 'rgba(232,184,75,0.55)');
    g.addColorStop(1, 'rgba(232,184,75,0)');
    c.fillStyle = g;
    c.fillRect(0, 0, 32, 32);
    return s;
  }

  function spriteCloud(base, layers) {
    var s = document.createElement('canvas');
    s.width = 260; s.height = 120;
    var c = s.getContext('2d');
    for (var i = 0; i < layers.length; i++) {
      var l = layers[i];
      var g = c.createRadialGradient(l.x, l.y, 0, l.x, l.y, l.r);
      g.addColorStop(0, 'rgba(' + base + ',' + l.a + ')');
      g.addColorStop(1, 'rgba(' + base + ',0)');
      c.fillStyle = g;
      c.fillRect(0, 0, 260, 120);
    }
    return s;
  }

  function spriteFigure(scale) {
    var w = 200 * scale, h = 430 * scale;
    var s = document.createElement('canvas');
    s.width = w; s.height = h;
    var c = s.getContext('2d');
    var k = w / 200;
    c.translate(w / 2, h);
    c.scale(k, k);

    c.beginPath();
    c.moveTo(-40, -318);
    c.bezierCurveTo(-40, -398, 40, -398, 40, -318);
    c.bezierCurveTo(40, -296, 24, -286, 18, -274);
    c.lineTo(46, -254);
    c.bezierCurveTo(58, -244, 52, -230, 40, -226);
    c.lineTo(34, -200);
    c.bezierCurveTo(56, -144, 54, -104, 50, -60);
    c.bezierCurveTo(48, -22, 54, 26, 58, 140);
    c.bezierCurveTo(58, 150, 54, 160, 44, 162);
    c.lineTo(30, -20);
    c.lineTo(26, 150);
    c.bezierCurveTo(26, 160, 22, 166, 14, 166);
    c.lineTo(4, -60);
    c.lineTo(-4, -60);
    c.lineTo(-14, 166);
    c.bezierCurveTo(-22, 166, -26, 160, -26, 150);
    c.lineTo(-30, -20);
    c.lineTo(-44, 162);
    c.bezierCurveTo(-54, 160, -58, 150, -58, 140);
    c.bezierCurveTo(-54, 26, -48, -22, -50, -60);
    c.bezierCurveTo(-54, -104, -56, -144, -34, -200);
    c.lineTo(-40, -226);
    c.bezierCurveTo(-52, -230, -58, -244, -46, -254);
    c.lineTo(-18, -274);
    c.bezierCurveTo(-24, -286, -40, -296, -40, -318);
    c.closePath();
    c.fillStyle = '#07060a';
    c.fill();

    c.beginPath();
    c.ellipse(0, -340, 26, 34, 0, 0, Math.PI * 2);
    c.fillStyle = '#07060a';
    c.fill();

    c.strokeStyle = 'rgba(' + AMBER + ',0.30)';
    c.lineWidth = 4 * k;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(-40, -318);
    c.bezierCurveTo(-40, -360, -12, -372, -8, -336);
    c.stroke();

    return s;
  }

  function buildSprites() {
    sprites.particle = spriteParticle();
    sprites.clouds = [
      spriteCloud('172,140,104', [{ x: 130, y: 60, r: 80, a: 0.30 }, { x: 90, y: 66, r: 55, a: 0.24 }, { x: 170, y: 64, r: 62, a: 0.22 }]),
      spriteCloud('150,118,86', [{ x: 130, y: 62, r: 74, a: 0.26 }, { x: 70, y: 58, r: 48, a: 0.20 }, { x: 190, y: 66, r: 44, a: 0.18 }])
    ];
    sprites.figure = spriteFigure(1);
  }

  function initParticles() {
    particles = [];
    var n = 120;
    for (var i = 0; i < n; i++) {
      particles.push({
        x: rr(0, 1),
        phase: rng(),
        trav: 2 + Math.floor(rng() * 5),
        swayAmp: rr(0.008, 0.05),
        swayPh: rr(0, 1),
        swayTrav: 1 + Math.floor(rng() * 4),
        size: rr(1.2, 3.4),
        bright: rng() > 0.7
      });
    }
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = hero.clientWidth;
    H = hero.clientHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function cycle(t, k) { return Math.sin(Math.PI * 2 * (t / T) * k); }

  function drawSky() {
    var g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#080708');
    g.addColorStop(0.35, '#0d0a0a');
    g.addColorStop(0.55, '#191009');
    g.addColorStop(0.67, '#2a1809');
    g.addColorStop(H > 640 ? 0.60 : 0.72, '#3e2410');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  function horizon() { return H * 0.60; }

  function drawHorizonGlow(t) {
    var y = horizon();
    var g = ctx.createLinearGradient(0, y - H * 0.18, 0, y + H * 0.06);
    g.addColorStop(0, 'rgba(' + AMBER + ',0)');
    g.addColorStop(1, 'rgba(' + AMBER + ',0.10)');
    ctx.fillStyle = g;
    ctx.fillRect(0, y - H * 0.18, W, H * 0.24);
  }

  function drawClouds(t, front) {
    var y = horizon();
    var pads = W + 400;
    var cloudDefs = [
      { s: 0, trav: 1, y: H * 0.14, sc: 1.5, a: 0.16, v: 0, front: false },
      { s: 1, trav: 1, y: H * 0.24, sc: 1.05, a: 0.14, v: 0.06, front: false },
      { s: 0, trav: 1, y: H * 0.34, sc: 0.8, a: 0.11, v: 0.12, front: false },
      { s: 1, trav: 1, y: H * 0.19, sc: 1.25, a: 0.13, v: 0.02, front: true },
      { s: 0, trav: 2, y: H * 0.44, sc: 0.62, a: 0.09, v: 0.10, front: true }
    ];
    for (var i = 0; i < cloudDefs.length; i++) {
      var cd = cloudDefs[i];
      if (!!cd.front !== front) continue;
      var wf = (t * cd.trav / T) % 1;
      var x = -300 + wf * pads - cd.v * pads;
      ctx.save();
      ctx.translate(x, cd.y);
      ctx.scale(cd.sc, cd.sc);
      ctx.globalAlpha = cd.a * (0.9 + 0.1 * cycle(t, 1));
      ctx.drawImage(sprites.clouds[cd.s], -130, -60);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }

  function drawWater(t) {
    var y = horizon();
    var g = ctx.createLinearGradient(0, y, 0, H);
    g.addColorStop(0, '#241208');
    g.addColorStop(0.25, '#150b06');
    g.addColorStop(1, '#050406');
    ctx.fillStyle = g;
    ctx.fillRect(0, y, W, H - y);
  }

  function drawRipples(t) {
    var y = horizon();
    ctx.save();
    ctx.globalAlpha = 0.5;
    for (var row = 1; row < 9; row++) {
      var yy = y + ((H - y) / 9) * row;
      var a = 0.16 * (1 - row / 10);
      ctx.strokeStyle = 'rgba(' + AMBER + ',' + a + ')';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (var x = 0; x < W; x += 6) {
        var amp = 2.2 * (1 - row / 10);
        var off = Math.sin(x * 0.012 + row * 1.3 + t * (1.6 + row * 0.4)) * amp;
        var yy2 = yy + off;
        if (x === 0) ctx.moveTo(x, yy2); else ctx.lineTo(x, yy2);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawMonoliths() {
    var y = horizon();
    var defs = [
      { x: 0.03, w: 0.016, h: 0.15 }, { x: 0.075, w: 0.024, h: 0.21 },
      { x: 0.135, w: 0.018, h: 0.12 }, { x: 0.88, w: 0.02, h: 0.17 }
    ];
    for (var i = 0; i < defs.length; i++) {
      var d = defs[i];
      var bx = d.x * W, bw = d.w * W, bh = d.h * H;
      ctx.fillStyle = 'rgba(7,6,10,0.85)';
      ctx.fillRect(bx, y - bh, bw, bh);
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(' + AMBER + ',0.16)';
      ctx.lineWidth = 1;
      ctx.moveTo(bx, y - bh);
      ctx.lineTo(bx, y);
      ctx.stroke();
    }
  }

  function archMetrics() {
    var y = horizon();
    return {
      cx: W * 0.66,
      top: H * 0.20,
      gapHalf: H * 0.26,
      pillarW: H * 0.045,
      bottom: y
    };
  }

  function drawArchBack(t) {
    var m = archMetrics();
    var pulse = 0.8 + 0.2 * cycle(t, 1);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    var g = ctx.createRadialGradient(m.cx, H * 0.34, 0, m.cx, H * 0.34, H * 0.55);
    g.addColorStop(0, 'rgba(' + AMBER + ',' + (0.10 * pulse) + ')');
    g.addColorStop(1, 'rgba(' + BRONZE + ',0)');
    ctx.fillStyle = g;
    ctx.fillRect(m.cx - H * 0.55, H * 0.34 - H * 0.55, H * 1.1, H * 1.1);
    ctx.restore();
  }

  function drawArchFrame(t) {
    var m = archMetrics();
    var x1 = m.cx - m.gapHalf, x2 = m.cx + m.gapHalf;
    var lw = m.pillarW;
    var grad = ctx.createLinearGradient(x1, 0, x2, 0);
    grad.addColorStop(0, 'rgba(' + BRONZE + ',1)');
    grad.addColorStop(0.5, 'rgba(' + AMBER + ',1)');
    grad.addColorStop(1, 'rgba(' + BRONZE + ',1)');
    ctx.fillStyle = grad;
    ctx.fillRect(x1 - lw, m.top, lw, m.bottom - m.top);
    ctx.fillRect(x2, m.top, lw, m.bottom - m.top);
    ctx.fillRect(x1 - lw, m.top - H * 0.016, (x2 + lw) - (x1 - lw), H * 0.016);

    var g2 = ctx.createLinearGradient(x1, 0, x2, 0);
    g2.addColorStop(0, 'rgba(255,225,160,0.0)');
    g2.addColorStop(0.5, 'rgba(' + AMBER + ',1)');
    g2.addColorStop(1, 'rgba(255,225,160,0.0)');
    ctx.fillStyle = g2;
    ctx.fillRect(x1 + m.pillarW * 0.14, m.top, m.pillarW * 0.2, m.bottom - m.top);
    ctx.fillRect(x2 + m.pillarW * 0.66, m.top, m.pillarW * 0.2, m.bottom - m.top);

    ctx.fillStyle = 'rgba(' + BRONZE + ',0.9)';
    ctx.fillRect(m.cx - H * 0.012, m.top - H * 0.05, H * 0.024, H * 0.05);
    ctx.fillRect(m.cx - H * 0.036, m.top - H * 0.024, H * 0.072, H * 0.024);
  }

  function drawBeam(t) {
    var m = archMetrics();
    var pulse = 0.55 + 0.45 * (0.5 + 0.5 * cycle(t, 2));
    var x1 = m.cx - m.gapHalf, x2 = m.cx + m.gapHalf;
    var bw = (x2 - x1) * 0.5;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    var g = ctx.createLinearGradient(0, m.top, 0, m.bottom + H * 0.05);
    g.addColorStop(0, 'rgba(' + AMBER + ',' + (0.0 + 0.06 * pulse) + ')');
    g.addColorStop(0.45, 'rgba(' + AMBER + ',' + (0.14 * pulse) + ')');
    g.addColorStop(1, 'rgba(' + GOLD + ',' + (0.34 * pulse) + ')');
    ctx.fillStyle = g;
    ctx.fillRect(m.cx - bw / 2, m.top, bw, m.bottom - m.top + H * 0.05);

    var core = ctx.createLinearGradient(0, m.top, 0, m.bottom);
    core.addColorStop(0, 'rgba(255,235,190,' + (0.0 + 0.05 * pulse) + ')');
    core.addColorStop(1, 'rgba(' + AMBER + ',' + (0.2 * pulse) + ')');
    ctx.fillStyle = core;
    ctx.fillRect(m.cx - bw * 0.16, m.top, bw * 0.32, m.bottom - m.top);

    var g2 = ctx.createRadialGradient(m.cx, m.bottom, 0, m.cx, m.bottom, bw * 0.9);
    g2.addColorStop(0, 'rgba(' + AMBER + ',' + (0.4 * pulse) + ')');
    g2.addColorStop(1, 'rgba(' + GOLD + ',0)');
    ctx.fillStyle = g2;
    ctx.fillRect(m.cx - bw * 0.9, m.bottom - bw * 0.9, bw * 1.8, bw * 1.8);
    ctx.restore();
  }

  function drawPlanet(t) {
    var y = horizon();
    var R = H * 0.17;
    var px = W * 0.66, py = H * 0.42;

    ctx.save();
    ctx.beginPath();
    ctx.arc(px, py, R, 0, Math.PI * 2);
    ctx.clip();

    var g = ctx.createRadialGradient(px - R * 0.4, py - R * 0.45, R * 0.1, px, py, R);
    g.addColorStop(0, '#f2c569');
    g.addColorStop(0.45, '#cf9a3e');
    g.addColorStop(0.75, '#9a6424');
    g.addColorStop(1, '#4a2c10');
    ctx.fillStyle = g;
    ctx.fillRect(px - R, py - R, R * 2, R * 2);

    var drift = (t * 4 / T) % 1;
    var span = R * 1.6;
    ctx.save();
    ctx.translate(px, 0);
    var bands = [0.18, 0.34, 0.5, 0.66, 0.82];
    for (var i = 0; i < bands.length; i++) {
      var by = py - R + bands[i] * R * 2;
      var bx = px - R - span + drift * span;
      var w = R * 2 + span * 2;
      ctx.fillStyle = i % 2 === 0 ? 'rgba(70,42,16,0.28)' : 'rgba(255,214,138,0.10)';
      ctx.fillRect(bx, by, w, R * (0.08 + (i % 3) * 0.02));
    }
    ctx.restore();

    var term = ctx.createRadialGradient(px + R * 0.5, py, R * 0.4, px + R * 0.1, py, R * 1.15);
    term.addColorStop(0, 'rgba(24,13,6,0)');
    term.addColorStop(1, 'rgba(10,6,4,0.85)');
    ctx.fillStyle = term;
    ctx.fillRect(px - R, py - R, R * 2, R * 2);

    ctx.restore();

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    var halo = ctx.createRadialGradient(px, py, R * 0.9, px, py, R * 1.7);
    halo.addColorStop(0, 'rgba(' + AMBER + ',' + (0.10 + 0.04 * Math.sin(Math.PI * 2 * t / T)) + ')');
    halo.addColorStop(1, 'rgba(' + GOLD + ',0)');
    ctx.fillStyle = halo;
    ctx.fillRect(px - R * 1.7, py - R * 1.7, R * 3.4, R * 3.4);
    ctx.restore();
  }

  function drawRing(t, front) {
    var R = H * 0.17;
    var px = W * 0.66, py = H * 0.42;
    var rx = R * 1.35, ry = R * 0.40;
    var rot = -0.13;

    if (front) {
      ctx.save();
      ctx.strokeStyle = 'rgba(' + BRONZE + ',0.9)';
      ctx.lineWidth = R * 0.05;
      ctx.strokeStyle = 'rgba(98,62,24,0.9)';
      ctx.beginPath();
      ctx.ellipse(px, py, rx, ry, rot, 0, Math.PI);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(' + AMBER + ',0.85)';
      ctx.lineWidth = R * 0.03;
      ctx.beginPath();
      ctx.ellipse(px, py, rx, ry, rot, 0, Math.PI);
      ctx.stroke();
    } else {
      ctx.save();
      ctx.strokeStyle = 'rgba(120,76,30,0.85)';
      ctx.lineWidth = R * 0.045;
      ctx.beginPath();
      ctx.ellipse(px, py, rx, ry, rot, Math.PI, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(' + AMBER + ',0.30)';
      ctx.lineWidth = R * 0.02;
      ctx.beginPath();
      ctx.ellipse(px, py, rx, ry, rot, Math.PI, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }

  function ringPoint(t, offset) {
    var R = H * 0.17;
    var px = W * 0.66, py = H * 0.42;
    var rx = R * 1.35, ry = R * 0.40, rot = -0.13;
    var th = Math.PI * 2 * ((t / T) + offset) % (Math.PI * 2);
    var c = Math.cos(th), s = Math.sin(th);
    var x = px + rx * c * Math.cos(rot) - ry * s * Math.sin(rot);
    var y2 = py + rx * c * Math.sin(rot) + ry * s * Math.cos(rot);
    return { x: x, y: y2 };
  }

  function drawRingComets(t) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < 2; i++) {
      var p = ringPoint(t, i / 2);
      var g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, H * 0.045);
      g.addColorStop(0, 'rgba(255,235,190,0.95)');
      g.addColorStop(0.4, 'rgba(' + AMBER + ',0.4)');
      g.addColorStop(1, 'rgba(' + GOLD + ',0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(p.x, p.y, H * 0.045, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawFigure() {
    var y = horizon();
    var fx = W * 0.22, hgt = H * 0.30;
    var w = sprites.figure.width, h = sprites.figure.height;
    ctx.drawImage(sprites.figure, fx - w / (h / hgt) / 2, y - hgt, w / (h / hgt), hgt);
  }

  function drawWaterGlows(t) {
    var y = horizon();
    var m = archMetrics();
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    var beam = ctx.createRadialGradient(m.cx, y, 0, m.cx, y, m.gapHalf);
    beam.addColorStop(0, 'rgba(' + AMBER + ',0.18)');
    beam.addColorStop(1, 'rgba(' + GOLD + ',0)');
    ctx.fillStyle = beam;
    ctx.fillRect(m.cx - m.gapHalf, y, m.gapHalf * 2, (H - y) * 0.5);

    var planet = ctx.createRadialGradient(W * 0.66, y, 0, W * 0.66, y, H * 0.16);
    planet.addColorStop(0, 'rgba(' + BRONZE + ',0.10)');
    planet.addColorStop(1, 'rgba(' + BRONZE + ',0)');
    ctx.fillStyle = planet;
    ctx.fillRect(W * 0.66 - H * 0.16, y, H * 0.32, (H - y) * 0.5);
    ctx.restore();
  }

  function drawReflection(t) {
    var y = horizon();
    var fx = W * 0.22, hgt = H * 0.30;
    var fig = sprites.figure;
    var w = fig.width, h = fig.height;
    var scale = hgt / h;
    var dw = w * scale, dh = hgt;
    var depth = H * 0.34;
    var rows = Math.min(60, Math.ceil(depth / 8));
    var rowH = depth / rows;

    ctx.save();
    ctx.globalAlpha = 0.45;
    for (var i = 0; i < rows; i++) {
      var srcY = (i / rows) * dh;
      var srcHit = 1 - i / rows;
      var sy = y + i * rowH;
      var sway = Math.sin(sy * 0.02 + t * 1.4) * (4 + i * 0.7);
      ctx.globalAlpha = 0.42 * Math.pow(srcHit, 1.2);
      ctx.drawImage(fig, 0, srcY, w, dh / rows, fx - dw / 2 + sway, sy, dw, rowH + 1);
    }
    ctx.restore();
  }

  function drawParticles(t) {
    var y = horizon();
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    var m = archMetrics();
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      var u = (p.phase + t * p.trav / T) % 1;
      u = u < 0 ? u + 1 : u;
      var ease = 1 - Math.pow(1 - u, 2.2);
      var px = p.x * W + Math.sin(Math.PI * 2 * ((p.swayPh + t * p.swayTrav / T) % 1)) * p.swayAmp * W;
      var py = y + H * 0.01 - ease * (y * 0.92);
      var a = Math.pow(Math.sin(Math.PI * u), 0.8);
      var nearBeam = Math.abs(px - m.cx) < m.gapHalf * 0.9 && py < y && py > m.top;
      var alpha = a * (p.bright ? 0.85 : 0.5) * (nearBeam ? 1.4 : 1);
      if (alpha <= 0.02) continue;
      ctx.globalAlpha = Math.min(1, alpha);
      var sz = p.size * (nearBeam ? 1.3 : 1);
      ctx.drawImage(sprites.particle, px - sz, py - sz, sz * 2, sz * 2);
    }
    ctx.restore();
  }

  function frame(now) {
    var s = now / 1000;
    if (lastNow === 0) lastNow = s;
    var dt = Math.min(s - lastNow, 0.05);
    lastNow = s;
    loopTime = (loopTime + dt) % T;
    var t = loopTime;

    drawSky();
    drawHorizonGlow(t);
    drawClouds(t, false);
    drawMonoliths();
    drawArchBack(t);
    drawRing(t, false);
    drawPlanet(t);
    drawRing(t, true);
    drawRingComets(t);
    drawArchFrame(t);
    drawBeam(t);
    drawWater(t);
    drawWaterGlows(t);
    drawFigure();
    drawRipples(t);
    drawReflection(t);
    drawClouds(t, true);
    drawParticles(t);

    requestAnimationFrame(frame);
  }

  buildSprites();
  initParticles();
  resize();
  window.addEventListener('resize', resize);
  requestAnimationFrame(frame);
})();