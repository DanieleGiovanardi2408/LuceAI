'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/* ─────────────────────────────────────────────
   SLIDE DEFINITIONS
───────────────────────────────────────────── */
const SLIDES = [
  {
    id: 'chaos',
    num: '01',
    line1: 'Troppo',
    line2: 'rumore.',
    sub: 'Email, Excel, WhatsApp, telefonate.\nTutto disconnesso. Tutto manuale.',
    cta: null,
  },
  {
    id: 'scan',
    num: '02',
    line1: 'Vediamo',
    line2: 'dove perde.',
    sub: 'Osserviamo i tuoi flussi reali.\nMappiamo ogni attrito nascosto.',
    cta: null,
  },
  {
    id: 'build',
    num: '03',
    line1: 'Costruiamo',
    line2: 'il sistema.',
    sub: 'Progettiamo la soluzione insieme.\nSenza tecnicismo, senza sorprese.',
    cta: null,
  },
  {
    id: 'clarity',
    num: '04',
    line1: 'Chiarezza',
    line2: 'totale.',
    sub: 'Processi automatizzati, dati visibili,\nrisultati misurabili. Tutto sotto controllo.',
    cta: null,
  },
  {
    id: 'cta',
    num: '05',
    line1: 'Iniziamo',
    line2: 'insieme.',
    sub: '',
    cta: { label: 'Prenota una sessione', href: '#form-contatto' },
  },
] as const;

/* ─────────────────────────────────────────────
   CANVAS DRAWING FUNCTIONS
───────────────────────────────────────────── */

/* -- shared node data --------------------------------- */
type Node = { x: number; y: number; vx: number; vy: number; label: string; color: string };

const TOOL_LABELS = ['EMAIL', 'EXCEL', 'WHATSAPP', 'PDF', 'CALENDARIO', 'CRM', 'REPORT', 'FATTURE', 'ORDINI', 'TELEFONATE', 'MODULI', 'APPUNTI'];

function initNodes(w: number, h: number): Node[] {
  return TOOL_LABELS.map((label) => ({
    x: Math.random() * w * 0.8 + w * 0.1,
    y: Math.random() * h * 0.8 + h * 0.1,
    vx: (Math.random() - 0.5) * 1.6,
    vy: (Math.random() - 0.5) * 1.6,
    label,
    color: `hsl(${200 + Math.random() * 60},40%,55%)`,
  }));
}

/* ── SLIDE 0 — chaos ─────────────────────────────── */
function drawChaos(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, nodes: Node[]) {
  ctx.clearRect(0, 0, w, h);
  const dpr = window.devicePixelRatio || 1;

  nodes.forEach((n) => {
    n.x += n.vx + Math.sin(t * 0.8 + n.x * 0.002) * 0.4;
    n.y += n.vy + Math.cos(t * 0.6 + n.y * 0.002) * 0.4;
    if (n.x < 40) { n.x = 40; n.vx *= -1; }
    if (n.x > w - 40) { n.x = w - 40; n.vx *= -1; }
    if (n.y < 40) { n.y = 40; n.vy *= -1; }
    if (n.y > h - 40) { n.y = h - 40; n.vy *= -1; }
    n.vx *= 0.995; n.vy *= 0.995;
    if (Math.abs(n.vx) < 0.3) n.vx += (Math.random() - 0.5) * 0.4;
    if (Math.abs(n.vy) < 0.3) n.vy += (Math.random() - 0.5) * 0.4;
  });

  // draw broken connection attempts
  nodes.forEach((a, i) => {
    nodes.slice(i + 1).forEach((b) => {
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (d > 160 * dpr) return;
      const alpha = (1 - d / (160 * dpr)) * 0.12;
      ctx.beginPath();
      ctx.setLineDash([4, 8]);
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.strokeStyle = `rgba(255,80,80,${alpha})`;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.setLineDash([]);
    });
  });

  // nodes
  nodes.forEach((n) => {
    const flicker = 0.5 + 0.5 * Math.sin(t * 3 + n.x);
    const r = 28 * dpr;
    ctx.beginPath();
    ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(22,22,30,${0.85 * flicker + 0.15})`;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255,80,80,${0.25 * flicker})`;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.font = `${9 * dpr}px "JetBrains Mono",monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = `rgba(200,200,220,${0.55 * flicker + 0.2})`;
    ctx.fillText(n.label, n.x, n.y);
  });
}

/* ── SLIDE 1 — scan / diagnosi ───────────────────── */
function drawScan(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, nodes: Node[]) {
  ctx.clearRect(0, 0, w, h);
  const dpr = window.devicePixelRatio || 1;
  const scanY = (t * 0.18 * h) % h;

  // slow drift
  nodes.forEach((n) => {
    n.vx *= 0.96; n.vy *= 0.96;
    n.x += n.vx; n.y += n.vy;
  });

  // scanner beam
  const beamGrad = ctx.createLinearGradient(0, scanY - 60 * dpr, 0, scanY + 60 * dpr);
  beamGrad.addColorStop(0, 'rgba(0,229,255,0)');
  beamGrad.addColorStop(0.5, 'rgba(0,229,255,0.06)');
  beamGrad.addColorStop(1, 'rgba(0,229,255,0)');
  ctx.fillStyle = beamGrad;
  ctx.fillRect(0, scanY - 60 * dpr, w, 120 * dpr);

  // scan line
  ctx.beginPath();
  ctx.moveTo(0, scanY);
  ctx.lineTo(w, scanY);
  ctx.strokeStyle = 'rgba(0,229,255,0.3)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // connections lighting up near scan
  nodes.forEach((a, i) => {
    nodes.slice(i + 1).forEach((b) => {
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (d > 220 * dpr) return;
      const nearScan = Math.max(0, 1 - Math.abs(a.y - scanY) / (80 * dpr));
      if (nearScan < 0.05) return;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
      const g = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
      g.addColorStop(0, `rgba(0,229,255,${nearScan * 0.35})`);
      g.addColorStop(1, `rgba(124,58,237,${nearScan * 0.2})`);
      ctx.strokeStyle = g;
      ctx.lineWidth = 1;
      ctx.stroke();
    });
  });

  // nodes
  nodes.forEach((n) => {
    const nearScan = Math.max(0, 1 - Math.abs(n.y - scanY) / (70 * dpr));
    const lit = 0.3 + nearScan * 0.7;
    const r = (24 + nearScan * 10) * dpr;
    const glow = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, r * 1.8);
    glow.addColorStop(0, `rgba(0,229,255,${nearScan * 0.15})`);
    glow.addColorStop(1, 'rgba(0,229,255,0)');
    ctx.beginPath(); ctx.arc(n.x, n.y, r * 1.8, 0, Math.PI * 2);
    ctx.fillStyle = glow; ctx.fill();

    ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(22,22,30,0.9)`;
    ctx.fill();
    ctx.strokeStyle = `rgba(0,229,255,${lit * 0.5})`;
    ctx.lineWidth = 1.5; ctx.stroke();

    ctx.font = `${9 * dpr}px "JetBrains Mono",monospace`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = `rgba(0,229,255,${lit * 0.8})`;
    ctx.fillText(n.label, n.x, n.y);

    // activity bar near scan
    if (nearScan > 0.3) {
      const barW = 40 * dpr;
      const barH = 4 * dpr;
      const barX = n.x - barW / 2;
      const barY = n.y + r + 6 * dpr;
      ctx.fillStyle = 'rgba(255,255,255,0.1)';
      ctx.fillRect(barX, barY, barW, barH);
      ctx.fillStyle = `rgba(0,229,255,${nearScan * 0.7})`;
      ctx.fillRect(barX, barY, barW * (0.4 + nearScan * 0.6), barH);
    }
  });
}

/* ── SLIDE 2 — build / flow ──────────────────────── */
const FLOW_STEPS = [
  { label: 'INPUT', sublabel: 'Dati raccolti', color: '#00e5ff' },
  { label: 'AI ENGINE', sublabel: 'Analisi automatica', color: '#7c3aed' },
  { label: 'PROCESSO', sublabel: 'Flusso ottimizzato', color: '#00e5ff' },
  { label: 'OUTPUT', sublabel: 'Risultato misurabile', color: '#3b82f6' },
];

function drawBuild(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  ctx.clearRect(0, 0, w, h);
  const dpr = window.devicePixelRatio || 1;
  const steps = FLOW_STEPS.length;
  const stepW = w / (steps + 1);
  const cy = h * 0.5;
  const nodeR = 48 * dpr;

  // animated progress
  const totalDuration = 4; // seconds per loop
  const phase = (t % totalDuration) / totalDuration; // 0..1 cyclic

  FLOW_STEPS.forEach((step, i) => {
    const cx = stepW * (i + 1);
    const reveal = Math.min(1, Math.max(0, (phase - i * 0.18) / 0.15));

    // connecting arrow
    if (i < steps - 1) {
      const nextCx = stepW * (i + 2);
      const arrowReveal = Math.min(1, Math.max(0, (phase - i * 0.18 - 0.12) / 0.15));
      if (arrowReveal > 0) {
        const x1 = cx + nodeR;
        const x2 = cx + (nextCx - cx - nodeR * 2) * arrowReveal + nodeR;
        ctx.beginPath();
        ctx.moveTo(x1, cy);
        ctx.lineTo(x2, cy);
        const g = ctx.createLinearGradient(x1, cy, x2, cy);
        g.addColorStop(0, step.color + 'cc');
        g.addColorStop(1, FLOW_STEPS[i + 1].color + '99');
        ctx.strokeStyle = g;
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // arrowhead
        if (arrowReveal > 0.9) {
          const ah = 10 * dpr;
          ctx.beginPath();
          ctx.moveTo(x2, cy - ah);
          ctx.lineTo(x2 + ah * 1.2, cy);
          ctx.lineTo(x2, cy + ah);
          ctx.strokeStyle = FLOW_STEPS[i + 1].color + 'cc';
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        // pulse dot on arrow
        if (arrowReveal > 0.5) {
          const pulseProg = ((t * 0.6 + i * 0.3) % 1);
          const px = x1 + (x2 - x1) * pulseProg;
          ctx.beginPath();
          ctx.arc(px, cy, 4 * dpr, 0, Math.PI * 2);
          ctx.fillStyle = step.color + 'cc';
          ctx.fill();
        }
      }
    }

    if (reveal <= 0) return;

    // glow behind node
    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, nodeR * 2);
    glow.addColorStop(0, step.color + '20');
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.beginPath(); ctx.arc(cx, cy, nodeR * 2, 0, Math.PI * 2);
    ctx.fillStyle = glow; ctx.fill();

    // node circle
    ctx.beginPath(); ctx.arc(cx, cy, nodeR * reveal, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(10,10,18,0.95)';
    ctx.fill();
    ctx.strokeStyle = step.color + 'cc';
    ctx.lineWidth = 2.5 * reveal;
    ctx.stroke();

    // label
    ctx.font = `bold ${10 * dpr}px "JetBrains Mono",monospace`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = step.color;
    ctx.globalAlpha = reveal;
    ctx.fillText(step.label, cx, cy - 6 * dpr);
    ctx.font = `${8 * dpr}px "JetBrains Mono",monospace`;
    ctx.fillStyle = 'rgba(200,200,220,0.7)';
    ctx.fillText(step.sublabel, cx, cy + 10 * dpr);
    ctx.globalAlpha = 1;

    // step number
    ctx.font = `${8 * dpr}px "JetBrains Mono",monospace`;
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.fillText(`0${i + 1}`, cx, cy - nodeR - 10 * dpr);
  });

  // background grid
  ctx.strokeStyle = 'rgba(0,229,255,0.04)';
  ctx.lineWidth = 1;
  const gs = 60 * dpr;
  for (let x = 0; x < w; x += gs) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
  for (let y = 0; y < h; y += gs) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
}

/* ── SLIDE 3 — clarity / dashboard ──────────────── */
type BarData = { label: string; value: number; color: string; suffix: string };
const METRICS_DATA: BarData[] = [
  { label: 'Tempo risparmiato', value: 40, color: '#00e5ff', suffix: '%' },
  { label: 'Errori ridotti', value: 70, color: '#7c3aed', suffix: '%' },
  { label: 'Visibilità dati', value: 95, color: '#3b82f6', suffix: '%' },
  { label: 'Supporto attivo', value: 100, color: '#00e5ff', suffix: '%' },
];

function drawClarity(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  ctx.clearRect(0, 0, w, h);
  const dpr = window.devicePixelRatio || 1;

  // subtle grid
  ctx.strokeStyle = 'rgba(0,229,255,0.05)';
  ctx.lineWidth = 1;
  const gs = 60 * dpr;
  for (let x = 0; x < w; x += gs) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
  for (let y = 0; y < h; y += gs) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }

  // dashboard panel
  const panW = Math.min(w * 0.7, 600 * dpr);
  const panH = Math.min(h * 0.6, 340 * dpr);
  const panX = (w - panW) / 2;
  const panY = (h - panH) / 2;

  // panel bg
  ctx.fillStyle = 'rgba(17,17,24,0.8)';
  ctx.beginPath();
  ctx.roundRect(panX, panY, panW, panH, 16 * dpr);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,229,255,0.15)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // panel header
  ctx.fillStyle = 'rgba(0,229,255,0.8)';
  ctx.font = `bold ${9 * dpr}px "JetBrains Mono",monospace`;
  ctx.textAlign = 'left';
  ctx.fillText('LUCE.AI — PANNELLO OPERATIVO', panX + 16 * dpr, panY + 18 * dpr);

  // status dot
  const dotX = panX + panW - 20 * dpr;
  const dotY = panY + 14 * dpr;
  ctx.beginPath(); ctx.arc(dotX, dotY, 5 * dpr, 0, Math.PI * 2);
  ctx.fillStyle = '#00e5ff'; ctx.fill();

  // divider
  ctx.beginPath(); ctx.moveTo(panX + 16 * dpr, panY + 28 * dpr); ctx.lineTo(panX + panW - 16 * dpr, panY + 28 * dpr);
  ctx.strokeStyle = 'rgba(255,255,255,0.07)'; ctx.lineWidth = 1; ctx.stroke();

  // metric bars
  const barArea = panH - 56 * dpr;
  const barSpacing = barArea / METRICS_DATA.length;

  METRICS_DATA.forEach((m, i) => {
    const barY = panY + 40 * dpr + i * barSpacing;
    const maxBarW = panW - 160 * dpr;
    const anim = Math.min(1, Math.max(0, (Math.sin(t * 0.5 + i * 0.7) * 0.05 + 0.95)));
    const barLen = maxBarW * (m.value / 100) * anim;

    // label
    ctx.font = `${8 * dpr}px "JetBrains Mono",monospace`;
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(200,200,220,0.7)';
    ctx.fillText(m.label, panX + 16 * dpr, barY + 10 * dpr);

    // bar bg
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    ctx.beginPath(); ctx.roundRect(panX + 16 * dpr, barY + 18 * dpr, maxBarW, 8 * dpr, 4 * dpr);
    ctx.fill();

    // bar fill with gradient
    const g = ctx.createLinearGradient(panX + 16 * dpr, 0, panX + 16 * dpr + barLen, 0);
    g.addColorStop(0, m.color + 'cc');
    g.addColorStop(1, m.color + '44');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.roundRect(panX + 16 * dpr, barY + 18 * dpr, barLen, 8 * dpr, 4 * dpr);
    ctx.fill();

    // value
    ctx.font = `bold ${10 * dpr}px "JetBrains Mono",monospace`;
    ctx.textAlign = 'right';
    ctx.fillStyle = m.color;
    ctx.fillText(`${Math.round(m.value * anim)}${m.suffix}`, panX + panW - 16 * dpr, barY + 26 * dpr);
  });

  // corner brackets
  const cLen = 14 * dpr;
  const corners = [
    [panX, panY], [panX + panW, panY],
    [panX, panY + panH], [panX + panW, panY + panH],
  ] as [number, number][];
  ctx.strokeStyle = 'rgba(0,229,255,0.4)';
  ctx.lineWidth = 2;
  corners.forEach(([cx, cy], idx) => {
    const sx = idx % 2 === 0 ? 1 : -1;
    const sy = idx < 2 ? 1 : -1;
    ctx.beginPath();
    ctx.moveTo(cx + sx * cLen, cy); ctx.lineTo(cx, cy); ctx.lineTo(cx, cy + sy * cLen);
    ctx.stroke();
  });
}

/* ── SLIDE 4 — luce / CTA ────────────────────────── */
function drawLuce(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  ctx.clearRect(0, 0, w, h);
  const dpr = window.devicePixelRatio || 1;
  const cx = w / 2; const cy = h / 2;
  const pulse = 0.8 + 0.2 * Math.sin(t * 1.5);

  // converging particles
  const seed = 42;
  for (let i = 0; i < 60; i++) {
    const angle = (i / 60) * Math.PI * 2 + Math.sin(seed + i) * 0.5;
    const baseR = (0.3 + (i % 7) * 0.05) * Math.min(w, h);
    const r = baseR * (1 - ((t * 0.12 + i * 0.017) % 1) * 0.85);
    const px = cx + Math.cos(angle) * r;
    const py = cy + Math.sin(angle) * r;
    const progress = 1 - r / baseR;
    const alpha = progress * 0.6;
    ctx.beginPath();
    ctx.arc(px, py, (1.5 + progress * 2) * dpr, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(0,229,255,${alpha})`;
    ctx.fill();
  }

  // rings
  [200, 140, 90].forEach((radius, i) => {
    const rr = radius * dpr * pulse;
    const glow = ctx.createRadialGradient(cx, cy, rr * 0.7, cx, cy, rr);
    glow.addColorStop(0, 'rgba(0,229,255,0)');
    glow.addColorStop(1, 'rgba(0,229,255,0)');
    ctx.beginPath(); ctx.arc(cx, cy, rr, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(0,229,255,${0.08 + i * 0.04})`;
    ctx.lineWidth = 1; ctx.stroke();
  });

  // core glow
  const coreR = 50 * dpr * pulse;
  const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR * 3);
  coreGrad.addColorStop(0, 'rgba(0,229,255,0.25)');
  coreGrad.addColorStop(0.4, 'rgba(124,58,237,0.1)');
  coreGrad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.beginPath(); ctx.arc(cx, cy, coreR * 3, 0, Math.PI * 2);
  ctx.fillStyle = coreGrad; ctx.fill();

  // center dot
  ctx.beginPath(); ctx.arc(cx, cy, 6 * dpr * pulse, 0, Math.PI * 2);
  ctx.fillStyle = '#00e5ff'; ctx.fill();
}

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
export default function FullpageSlider() {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);
  const tRef = useRef(0);
  const nodesRef = useRef<Node[]>([]);
  const lastWheelRef = useRef(0);

  const total = SLIDES.length;

  const go = useCallback((next: number) => {
    if (next < 0 || next >= total) return;
    setDirection(next > current ? 1 : -1);
    setCurrent(next);
    tRef.current = 0;
  }, [current, total]);

  // wheel + keyboard navigation
  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      const now = Date.now();
      if (now - lastWheelRef.current < 800) return;
      lastWheelRef.current = now;
      if (e.deltaY > 0) go(current + 1);
      else go(current - 1);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') go(current + 1);
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') go(current - 1);
    };
    window.addEventListener('wheel', onWheel, { passive: true });
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKey);
    };
  }, [current, go]);

  // canvas animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      nodesRef.current = initNodes(canvas.width, canvas.height);
    };
    resize();
    window.addEventListener('resize', resize);

    const animate = () => {
      tRef.current += 0.016;
      const t = tRef.current;
      const { width: w, height: h } = canvas;

      switch (SLIDES[current].id) {
        case 'chaos':   drawChaos(ctx, w, h, t, nodesRef.current); break;
        case 'scan':    drawScan(ctx, w, h, t, nodesRef.current); break;
        case 'build':   drawBuild(ctx, w, h, t); break;
        case 'clarity': drawClarity(ctx, w, h, t); break;
        case 'cta':     drawLuce(ctx, w, h, t); break;
      }

      frameRef.current = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [current]);

  const slide = SLIDES[current];

  const textVariants = {
    enter: (dir: number) => ({ opacity: 0, y: dir > 0 ? 60 : -60, filter: 'blur(8px)' }),
    center: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.7, ease: 'easeOut' as const } },
    exit: (dir: number) => ({ opacity: 0, y: dir > 0 ? -40 : 40, filter: 'blur(6px)', transition: { duration: 0.4 } }),
  };

  return (
    <section className="relative w-full overflow-hidden" style={{ height: '100svh' }}>
      {/* Canvas fullbleed */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ background: '#0a0a0f' }}
      />

      {/* Vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, transparent 30%, rgba(10,10,15,0.85) 100%)' }}
      />

      {/* Bottom-left gradient for text legibility */}
      <div
        className="absolute bottom-0 left-0 pointer-events-none"
        style={{ width: '65%', height: '55%', background: 'linear-gradient(135deg, rgba(10,10,15,0.7) 0%, transparent 70%)' }}
      />

      {/* Navbar passthrough hint */}
      <div className="absolute top-0 left-0 right-0 h-20 pointer-events-none" />

      {/* Slide number — top right */}
      <div className="absolute top-8 right-10 hidden md:flex items-center gap-3 z-20">
        <span className="font-mono text-[10px] tracking-widest text-white/30">{slide.num}</span>
        <span className="w-8 h-px bg-white/20" />
        <span className="font-mono text-[10px] tracking-widest text-white/20">{String(total).padStart(2, '0')}</span>
      </div>

      {/* Main text — bottom left */}
      <div className="absolute bottom-0 left-0 z-20 px-10 md:px-16 pb-24 md:pb-20 max-w-3xl">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div key={current} custom={direction} variants={textVariants} initial="enter" animate="center" exit="exit">
            {/* Slide label */}
            <p className="font-mono text-[10px] tracking-[0.2em] text-accent/60 mb-4 uppercase">
              {slide.num} — {slide.id.toUpperCase()}
            </p>

            {/* Huge headline */}
            <h2
              className="font-black leading-[0.9] tracking-tight text-white mb-1"
              style={{ fontSize: 'clamp(52px, 9vw, 140px)' }}
            >
              {slide.line1}
            </h2>
            <h2
              className="font-black leading-[0.9] tracking-tight mb-6"
              style={{ fontSize: 'clamp(52px, 9vw, 140px)', color: '#00e5ff' }}
            >
              {slide.line2}
            </h2>

            {/* Subtitle */}
            {slide.sub && (
              <p className="text-sm md:text-base text-white/55 leading-relaxed max-w-sm whitespace-pre-line">
                {slide.sub}
              </p>
            )}

            {/* CTA button (only slide 4) */}
            {slide.cta && (
              <a
                href={slide.cta.href}
                className="inline-flex items-center gap-3 mt-8 px-8 py-4 rounded-xl border border-accent/40 text-accent text-sm font-semibold bg-accent/10 hover:bg-accent/20 hover:border-accent/70 transition-all duration-300"
                style={{ boxShadow: '0 0 24px rgba(0,229,255,0.12)' }}
                onClick={(e) => {
                  e.preventDefault();
                  document.querySelector(slide.cta!.href)?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                {slide.cta.label}
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </a>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Slide dots — right edge */}
      <div className="absolute right-6 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-3">
        {SLIDES.map((s, i) => (
          <button
            key={s.id}
            onClick={() => go(i)}
            aria-label={`Slide ${i + 1}`}
            className="group flex items-center justify-end gap-2"
          >
            <span className={`font-mono text-[8px] tracking-widest transition-all duration-300 hidden md:block ${i === current ? 'text-accent/60 opacity-100' : 'text-white/20 opacity-0 group-hover:opacity-100'}`}>
              {s.num}
            </span>
            <span className={`block rounded-full transition-all duration-300 ${i === current ? 'w-6 h-1.5 bg-accent' : 'w-1.5 h-1.5 bg-white/25 hover:bg-white/50'}`} />
          </button>
        ))}
      </div>

      {/* Arrow navigation — bottom right */}
      <div className="absolute bottom-8 right-10 z-20 flex items-center gap-3">
        <button
          onClick={() => go(current - 1)}
          disabled={current === 0}
          className="w-9 h-9 flex items-center justify-center border border-white/15 rounded-full text-white/40 hover:text-white hover:border-white/40 disabled:opacity-20 disabled:cursor-not-allowed transition-all duration-200"
          aria-label="Precedente"
        >
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
          </svg>
        </button>
        <span className="font-mono text-[10px] text-white/20">|</span>
        <button
          onClick={() => go(current + 1)}
          disabled={current === total - 1}
          className="w-9 h-9 flex items-center justify-center border border-white/15 rounded-full text-white/40 hover:text-white hover:border-white/40 disabled:opacity-20 disabled:cursor-not-allowed transition-all duration-200"
          aria-label="Successivo"
        >
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Scroll-down hint after last slide */}
      {current === total - 1 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2"
        >
          <span className="font-mono text-[9px] tracking-widest text-white/30">SCORRI</span>
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
            className="w-px h-8 bg-gradient-to-b from-white/30 to-transparent"
          />
        </motion.div>
      )}
    </section>
  );
}
