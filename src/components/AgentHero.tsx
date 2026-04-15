'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/* ═══════════════════════════════════════════════════
   TYPES
═══════════════════════════════════════════════════ */

type Phase = 'chaos' | 'arrival' | 'work' | 'clarity' | 'cta';

interface DeskWin {
  id: number;
  x: number; y: number; w: number; h: number;
  type: 'email' | 'excel' | 'chat' | 'invoice' | 'calendar';
  title: string;
  errorMsg: string;
  state: 'broken' | 'fixing' | 'fixed';
  fixPct: number;       // 0..1
  vx: number; vy: number;
  flickerTimer: number;
  agentId: number | null;
}

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  life: number; maxLife: number;
  color: string; size: number;
}

interface Agent {
  id: number;
  name: string; role: string; color: string;
  x: number; y: number;
  vx: number; vy: number;
  tx: number; ty: number;       // current target position
  state: 'offscreen' | 'flying' | 'moving' | 'working' | 'idle' | 'done';
  workWinId: number | null;
  eyeAngle: number;
  wobbleT: number;
  trailPoints: Array<{ x: number; y: number; a: number }>;
}

/* ═══════════════════════════════════════════════════
   CONFIG
═══════════════════════════════════════════════════ */

const WIN_DEFS = [
  { type: 'email'   as const, title: 'POSTA IN ARRIVO',  err: '847 non letti',   rx: 0.05, ry: 0.10, rw: 0.22, rh: 0.30 },
  { type: 'excel'   as const, title: 'REPORT_Q4.xlsx',   err: '#REF! — errori',  rx: 0.32, ry: 0.06, rw: 0.26, rh: 0.27 },
  { type: 'chat'    as const, title: 'MESSAGGI',          err: '34 non risposti', rx: 0.66, ry: 0.14, rw: 0.21, rh: 0.28 },
  { type: 'invoice' as const, title: 'FATTURE',           err: '12 scadute',      rx: 0.10, ry: 0.56, rw: 0.24, rh: 0.27 },
  { type: 'calendar'as const, title: 'CALENDARIO',        err: '8 conflitti',     rx: 0.50, ry: 0.57, rw: 0.25, rh: 0.26 },
];

const AGENT_DEFS = [
  { id: 0, name: 'AG-01', role: 'ANALISI',  color: '#00e5ff' },
  { id: 1, name: 'AG-02', role: 'AUTOMAZ.', color: '#a855f7' },
  { id: 2, name: 'AG-03', role: 'CONNECT.', color: '#60a5fa' },
];

const PHASE_TEXT: Record<Phase, { l1: string; l2: string; sub: string }> = {
  chaos:   { l1: 'Il tuo',      l2: 'digitale.',  sub: 'Email, Excel, WhatsApp, fatture.\nTutto disconnesso. Tutto manuale.' },
  arrival: { l1: 'Vediamo',     l2: 'tutto.',     sub: 'Tre agenti analizzano ogni processo,\nogni attrito, ogni punto debole.' },
  work:    { l1: 'Costruiamo',  l2: 'il sistema.',sub: 'Ogni tool connesso. Ogni flusso ottimizzato.\nNessun dato perso.' },
  clarity: { l1: 'Chiarezza',   l2: 'totale.',    sub: 'Automatizzato, misurabile, sotto controllo.\nTutto funziona.' },
  cta:     { l1: 'Iniziamo',    l2: 'insieme.',   sub: '' },
};

/* ═══════════════════════════════════════════════════
   DRAW HELPERS
═══════════════════════════════════════════════════ */

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }
function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)); }

function drawRoundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.closePath();
}

/* ── Window ─────────────────────────────────────── */
function drawWindow(ctx: CanvasRenderingContext2D, win: DeskWin, totalT: number, dpr: number) {
  const { x, y, w, h, state, fixPct, flickerTimer, type, title, errorMsg } = win;
  const r = 10 * dpr;
  const flicker = state === 'broken' ? (Math.sin(flickerTimer * 8) > 0.3 ? 1 : 0.8) : 1;

  // shadow
  ctx.save();
  ctx.shadowColor = state === 'fixed' ? 'rgba(0,229,255,0.15)' : 'rgba(255,60,60,0.1)';
  ctx.shadowBlur = 20 * dpr;

  // bg
  drawRoundRect(ctx, x, y, w, h, r);
  ctx.fillStyle = `rgba(10,10,18,${0.88 * flicker})`;
  ctx.fill();
  ctx.restore();

  // border
  const borderColor = state === 'fixed'
    ? `rgba(0,229,255,0.4)`
    : state === 'fixing'
      ? `rgba(${lerp(255, 0, fixPct)},${lerp(60, 229, fixPct)},${lerp(60, 255, fixPct)},0.5)`
      : `rgba(255,60,60,${0.35 * flicker + 0.1})`;
  drawRoundRect(ctx, x, y, w, h, r);
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // title bar
  const tbH = 26 * dpr;
  ctx.save();
  ctx.beginPath(); ctx.roundRect(x, y, w, tbH, [r, r, 0, 0]); ctx.clip();
  ctx.fillStyle = state === 'fixed' ? 'rgba(0,229,255,0.08)' : 'rgba(255,60,60,0.07)';
  ctx.fillRect(x, y, w, tbH);
  ctx.restore();

  // dots
  const dotY = y + tbH / 2;
  [0, 1, 2].forEach((i) => {
    ctx.beginPath();
    ctx.arc(x + (10 + i * 12) * dpr, dotY, 4 * dpr, 0, Math.PI * 2);
    ctx.fillStyle = state === 'fixed'
      ? ['#00e5ff', '#00e5ff88', '#00e5ff44'][i]
      : ['#ff5f57', '#febc2e', '#28c840'][i];
    ctx.fill();
  });

  // title text
  ctx.font = `bold ${8 * dpr}px "JetBrains Mono",monospace`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = state === 'fixed' ? 'rgba(0,229,255,0.8)' : `rgba(220,220,240,${0.7 * flicker})`;
  ctx.fillText(title, x + w / 2, y + tbH / 2);

  // content area
  const cy = y + tbH + 4 * dpr;
  const ch = h - tbH - 4 * dpr;
  drawWindowContent(ctx, win, cx => cx, cy, ch, totalT, dpr);

  // error badge (broken / fixing)
  if (state !== 'fixed') {
    const badgeAlpha = state === 'fixing' ? (1 - fixPct) : (0.7 + 0.3 * Math.sin(totalT * 4));
    const bx = x + w - 4 * dpr; const by = y + 4 * dpr;
    ctx.beginPath(); ctx.arc(bx, by, 7 * dpr, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,60,60,${badgeAlpha})`;
    ctx.fill();
    ctx.font = `bold ${7 * dpr}px "JetBrains Mono",monospace`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff'; ctx.fillText('!', bx, by);
  }

  // fix progress bar (fixing state)
  if (state === 'fixing') {
    const bh = 3 * dpr;
    const by2 = y + h - bh;
    ctx.beginPath(); ctx.roundRect(x, by2, w, bh, [0, 0, r, r]); ctx.fillStyle = 'rgba(255,255,255,0.06)'; ctx.fill();
    const barColor = `rgba(${Math.round(lerp(255, 0, fixPct))},${Math.round(lerp(60, 229, fixPct))},${Math.round(lerp(60, 255, fixPct))},0.8)`;
    ctx.beginPath(); ctx.roundRect(x, by2, w * fixPct, bh, [0, 0, r, r]); ctx.fillStyle = barColor; ctx.fill();
  }

  // fixed checkmark
  if (state === 'fixed') {
    ctx.save();
    ctx.translate(x + w - 14 * dpr, y + 14 * dpr);
    ctx.beginPath();
    ctx.arc(0, 0, 8 * dpr, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,229,255,0.15)'; ctx.fill();
    ctx.strokeStyle = '#00e5ff'; ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-3 * dpr, 0); ctx.lineTo(-1 * dpr, 2.5 * dpr); ctx.lineTo(4 * dpr, -2.5 * dpr);
    ctx.stroke();
    ctx.restore();
  }
}

function drawWindowContent(ctx: CanvasRenderingContext2D, win: DeskWin, _cx: (x: number) => number, cy: number, ch: number, totalT: number, dpr: number) {
  const { x, w, type, state, fixPct } = win;
  const px = x + 10 * dpr; const pw = w - 20 * dpr;
  const isFixed = state === 'fixed';
  const rowAlpha = isFixed ? 0.7 : 0.4;

  if (type === 'email') {
    const rows = ['Marco R. — Offerta Q4', 'Silvia B. — Fattura #223', 'Luca M. — Riunione ore 15', 'Team — Report settimana'];
    rows.forEach((row, i) => {
      const ry = cy + (8 + i * 20) * dpr;
      if (ry > cy + ch - 8 * dpr) return;
      ctx.fillStyle = isFixed ? 'rgba(0,229,255,0.06)' : `rgba(255,80,80,${0.04 + (i % 2) * 0.03})`;
      ctx.fillRect(px, ry, pw, 16 * dpr);
      ctx.font = `${7.5 * dpr}px "JetBrains Mono",monospace`;
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillStyle = isFixed ? `rgba(200,240,255,${rowAlpha})` : `rgba(220,200,200,${rowAlpha})`;
      ctx.fillText(row, px + 4 * dpr, ry + 8 * dpr);
      if (!isFixed && i < 2) {
        ctx.beginPath(); ctx.arc(px + pw - 6 * dpr, ry + 8 * dpr, 3 * dpr, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,80,80,0.7)'; ctx.fill();
      }
    });
  } else if (type === 'excel') {
    const cols = 4; const rows = 4;
    const cw = pw / cols; const rh = (ch - 8 * dpr) / rows;
    const errors = [[1, 2], [2, 1], [3, 3]];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cx2 = px + c * cw; const ry = cy + 4 * dpr + r * rh;
        const isErr = !isFixed && errors.some(([er, ec]) => er === r && ec === c);
        ctx.strokeStyle = isFixed ? 'rgba(0,229,255,0.12)' : 'rgba(255,255,255,0.07)';
        ctx.lineWidth = 0.5; ctx.strokeRect(cx2, ry, cw, rh);
        if (isErr) {
          ctx.fillStyle = 'rgba(255,60,60,0.2)'; ctx.fillRect(cx2, ry, cw, rh);
          ctx.font = `${6.5 * dpr}px "JetBrains Mono",monospace`;
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillStyle = 'rgba(255,80,80,0.9)'; ctx.fillText('#ERR', cx2 + cw / 2, ry + rh / 2);
        } else if (isFixed || (r + c) % 3 !== 0) {
          ctx.font = `${6.5 * dpr}px "JetBrains Mono",monospace`;
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          const val = isFixed ? `${(r * 4 + c + 1) * 12}` : (r === 0 ? ['Q1', 'Q2', 'Q3', 'Q4'][c] : '—');
          ctx.fillStyle = isFixed ? `rgba(0,229,255,${rowAlpha})` : `rgba(180,180,200,0.3)`;
          ctx.fillText(val, cx2 + cw / 2, ry + rh / 2);
        }
      }
    }
    if (isFixed) {
      // mini bar chart hint
      const barAreaY = cy + ch - 18 * dpr;
      const barW = pw / 4 - 4 * dpr;
      [0.4, 0.7, 0.5, 0.9].forEach((v, i) => {
        const bx = px + i * (pw / 4);
        const bh = 14 * dpr * v;
        ctx.fillStyle = `rgba(0,229,255,${0.3 + v * 0.3})`;
        ctx.fillRect(bx, barAreaY + (14 * dpr - bh), barW, bh);
      });
    }
  } else if (type === 'chat') {
    const msgs = [
      { text: 'Dov\'è il report?', out: false },
      { text: 'Non l\'ho ricevuto', out: false },
      { text: 'Ho mandato ieri...', out: true },
      { text: '???', out: false },
    ];
    msgs.forEach((msg, i) => {
      const ry = cy + (6 + i * 18) * dpr;
      if (ry > cy + ch - 8 * dpr) return;
      const bw = Math.min(pw * 0.72, 90 * dpr);
      const bx = msg.out ? px + pw - bw : px;
      ctx.beginPath(); ctx.roundRect(bx, ry, bw, 14 * dpr, 5 * dpr);
      ctx.fillStyle = isFixed
        ? (msg.out ? 'rgba(0,229,255,0.2)' : 'rgba(255,255,255,0.06)')
        : (msg.out ? 'rgba(100,100,200,0.2)' : 'rgba(255,255,255,0.05)');
      ctx.fill();
      ctx.font = `${7 * dpr}px "JetBrains Mono",monospace`;
      ctx.textAlign = msg.out ? 'right' : 'left';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = isFixed ? `rgba(220,240,255,${rowAlpha})` : `rgba(200,200,220,0.45)`;
      ctx.fillText(msg.text, msg.out ? bx + bw - 5 * dpr : bx + 5 * dpr, ry + 7 * dpr);
    });
  } else if (type === 'invoice') {
    const items = [['#2241', '€ 3.200', 'SCADUTA'], ['#2242', '€ 1.850', 'SCADUTA'], ['#2243', '€ 4.100', 'PENDENTE'], ['#2244', '€ 980',  'PAGATA']];
    items.forEach(([id, amt, st], i) => {
      const ry = cy + (6 + i * 19) * dpr;
      if (ry > cy + ch - 6 * dpr) return;
      ctx.font = `${7 * dpr}px "JetBrains Mono",monospace`;
      ctx.textBaseline = 'middle';
      const stColor = isFixed ? 'rgba(0,229,255,0.7)' : (st === 'SCADUTA' ? 'rgba(255,80,80,0.8)' : st === 'PENDENTE' ? 'rgba(255,200,60,0.8)' : 'rgba(80,255,120,0.8)');
      ctx.textAlign = 'left'; ctx.fillStyle = `rgba(200,200,220,${rowAlpha})`; ctx.fillText(id, px, ry);
      ctx.textAlign = 'center'; ctx.fillStyle = `rgba(200,200,220,${rowAlpha})`; ctx.fillText(amt, px + pw / 2, ry);
      ctx.textAlign = 'right'; ctx.fillStyle = isFixed ? stColor : stColor; ctx.fillText(isFixed ? 'OK ✓' : st, px + pw, ry);
    });
  } else if (type === 'calendar') {
    const days = ['L', 'M', 'M', 'G', 'V', 'S', 'D'];
    const dayW = pw / 7;
    days.forEach((d, i) => {
      ctx.font = `bold ${7 * dpr}px "JetBrains Mono",monospace`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = `rgba(150,150,180,0.6)`;
      ctx.fillText(d, px + (i + 0.5) * dayW, cy + 8 * dpr);
    });
    const conflicts = [2, 4, 6];
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 7; c++) {
        const day = r * 7 + c + 1;
        if (day > 28) continue;
        const cx2 = px + (c + 0.5) * dayW; const ry2 = cy + (18 + r * 14) * dpr;
        const isConflict = !isFixed && conflicts.includes(c) && r < 2;
        if (isConflict) {
          ctx.beginPath(); ctx.arc(cx2, ry2, 5 * dpr, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255,80,80,0.3)'; ctx.fill();
        }
        ctx.font = `${7 * dpr}px "JetBrains Mono",monospace`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillStyle = isConflict ? 'rgba(255,100,100,0.8)' : (isFixed ? `rgba(0,229,255,${rowAlpha * 0.8})` : 'rgba(180,180,200,0.4)');
        ctx.fillText(String(day), cx2, ry2);
      }
    }
  }
  void fixPct; // suppress unused warning
}

/* ── Agent ──────────────────────────────────────── */
function drawAgent(ctx: CanvasRenderingContext2D, ag: Agent, totalT: number, dpr: number) {
  const { x, y, color, name, role, state, wobbleT } = ag;
  if (state === 'offscreen') return;
  const sz = 22 * dpr;
  const wobble = Math.sin(wobbleT * 2.5) * 2 * dpr;
  const ay = y + wobble;

  // trail
  ag.trailPoints.forEach((pt, i) => {
    const a = pt.a * (i / ag.trailPoints.length) * 0.4;
    ctx.beginPath(); ctx.arc(pt.x, pt.y, 2 * dpr * (i / ag.trailPoints.length), 0, Math.PI * 2);
    ctx.fillStyle = color + Math.floor(a * 255).toString(16).padStart(2, '0');
    ctx.fill();
  });

  // outer glow ring
  const glowR = sz * 2;
  const glow = ctx.createRadialGradient(x, ay, sz * 0.3, x, ay, glowR);
  glow.addColorStop(0, color + '30');
  glow.addColorStop(1, color + '00');
  ctx.beginPath(); ctx.arc(x, ay, glowR, 0, Math.PI * 2);
  ctx.fillStyle = glow; ctx.fill();

  // hexagon body
  ctx.save(); ctx.translate(x, ay);
  const sides = 6;
  ctx.beginPath();
  for (let i = 0; i < sides; i++) {
    const angle = (i * Math.PI * 2) / sides - Math.PI / 6;
    const px = Math.cos(angle) * sz; const py = Math.sin(angle) * sz;
    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = 'rgba(10,10,18,0.92)'; ctx.fill();
  ctx.strokeStyle = color + 'cc'; ctx.lineWidth = 2;
  if (state === 'working') {
    ctx.setLineDash([4, 3]);
    ctx.lineDashOffset = -totalT * 15;
  }
  ctx.stroke();
  ctx.setLineDash([]);

  // inner scan lines
  for (let i = -2; i <= 2; i++) {
    const scanY = (totalT * 20 * dpr + i * 8 * dpr) % (sz * 2.2) - sz * 1.1;
    ctx.beginPath(); ctx.moveTo(-sz * 0.7, scanY); ctx.lineTo(sz * 0.7, scanY);
    ctx.strokeStyle = color + '22'; ctx.lineWidth = 1; ctx.stroke();
  }

  // eye
  const eyeX = Math.cos(ag.eyeAngle) * sz * 0.3;
  const eyeY = Math.sin(ag.eyeAngle) * sz * 0.3;
  ctx.beginPath(); ctx.arc(eyeX, eyeY, sz * 0.18, 0, Math.PI * 2);
  ctx.fillStyle = color + 'dd'; ctx.fill();
  ctx.beginPath(); ctx.arc(eyeX, eyeY, sz * 0.08, 0, Math.PI * 2);
  ctx.fillStyle = '#fff'; ctx.fill();

  // status pulse (working)
  if (state === 'working') {
    const pulseR = (sz * 0.25 + Math.sin(totalT * 6) * sz * 0.1);
    ctx.beginPath(); ctx.arc(0, -sz * 1.4, pulseR, 0, Math.PI * 2);
    ctx.fillStyle = color + '40'; ctx.fill();
    ctx.beginPath(); ctx.arc(0, -sz * 1.4, sz * 0.12, 0, Math.PI * 2);
    ctx.fillStyle = color; ctx.fill();
  }

  ctx.restore();

  // name tag
  ctx.font = `bold ${7.5 * dpr}px "JetBrains Mono",monospace`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillStyle = color + 'cc';
  ctx.fillText(name, x, ay + sz + 6 * dpr);
  ctx.font = `${6.5 * dpr}px "JetBrains Mono",monospace`;
  ctx.fillStyle = color + '66';
  ctx.fillText(role, x, ay + sz + 16 * dpr);
}

/* ── Work beam ──────────────────────────────────── */
function drawWorkBeam(ctx: CanvasRenderingContext2D, ag: Agent, win: DeskWin, totalT: number, dpr: number) {
  const tx = win.x + win.w / 2; const ty = win.y + win.h / 2;
  const dist = Math.hypot(tx - ag.x, ty - ag.y);

  // beam
  ctx.save();
  ctx.beginPath(); ctx.moveTo(ag.x, ag.y); ctx.lineTo(tx, ty);
  ctx.strokeStyle = ag.color + '50';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 4]);
  ctx.lineDashOffset = -totalT * 20;
  ctx.stroke();
  ctx.setLineDash([]);

  // moving data packet along beam
  const t2 = ((totalT * 0.8) % 1);
  const px = ag.x + (tx - ag.x) * t2;
  const py = ag.y + (ty - ag.y) * t2;
  ctx.beginPath(); ctx.arc(px, py, 3 * dpr, 0, Math.PI * 2);
  ctx.fillStyle = ag.color; ctx.fill();

  ctx.restore();
  void dist;
}

/* ── Particles ──────────────────────────────────── */
function drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]) {
  particles.forEach((p) => {
    const a = p.life / p.maxLife;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.size * a, 0, Math.PI * 2);
    ctx.fillStyle = p.color + Math.floor(a * 200).toString(16).padStart(2, '0');
    ctx.fill();
  });
}

/* ── Data flow between fixed windows ────────────── */
function drawDataFlows(ctx: CanvasRenderingContext2D, wins: DeskWin[], totalT: number, dpr: number) {
  const fixed = wins.filter(w => w.state === 'fixed');
  for (let i = 0; i < fixed.length; i++) {
    for (let j = i + 1; j < fixed.length; j++) {
      const a = fixed[i]; const b = fixed[j];
      const ax = a.x + a.w / 2; const ay = a.y + a.h / 2;
      const bx = b.x + b.w / 2; const by = b.y + b.h / 2;
      const dist = Math.hypot(bx - ax, by - ay);
      if (dist > 500 * dpr) continue;

      ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by);
      const g = ctx.createLinearGradient(ax, ay, bx, by);
      g.addColorStop(0, 'rgba(0,229,255,0.12)'); g.addColorStop(1, 'rgba(124,58,237,0.08)');
      ctx.strokeStyle = g; ctx.lineWidth = 1;
      ctx.setLineDash([3, 6]); ctx.lineDashOffset = -totalT * 12; ctx.stroke(); ctx.setLineDash([]);

      // packet
      const t = (totalT * 0.4 + i * 0.3) % 1;
      const px = ax + (bx - ax) * t; const py = ay + (by - ay) * t;
      ctx.beginPath(); ctx.arc(px, py, 2.5 * dpr, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,229,255,0.7)'; ctx.fill();
    }
  }
}

/* ═══════════════════════════════════════════════════
   COMPONENT
═══════════════════════════════════════════════════ */

export default function AgentHero() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);
  const stateRef = useRef<{
    phase: Phase; phaseT: number; totalT: number;
    windows: DeskWin[]; agents: Agent[]; particles: Particle[];
    dt: number; lastFrameTime: number;
  }>({
    phase: 'chaos', phaseT: 0, totalT: 0,
    windows: [], agents: [], particles: [],
    dt: 0.016, lastFrameTime: 0,
  });
  const [phase, setPhase] = useState<Phase>('chaos');

  const initState = useCallback((cw: number, ch: number) => {
    const dpr = window.devicePixelRatio || 1;
    const s = stateRef.current;

    s.windows = WIN_DEFS.map((def, id) => ({
      id, type: def.type, title: def.title, errorMsg: def.err,
      x: def.rx * cw, y: def.ry * ch + 40 * dpr,
      w: def.rw * cw, h: def.rh * ch,
      state: 'broken', fixPct: 0,
      vx: (Math.random() - 0.5) * 0.4 * dpr,
      vy: (Math.random() - 0.5) * 0.3 * dpr,
      flickerTimer: Math.random() * 10,
      agentId: null,
    }));

    // Agents start offscreen
    s.agents = AGENT_DEFS.map((def, i) => {
      const entryAngles = [Math.PI * 1.25, Math.PI * 0.75, 0];
      const ea = entryAngles[i];
      const dist = Math.max(cw, ch) * 0.7;
      return {
        ...def,
        x: cw / 2 + Math.cos(ea) * dist,
        y: ch / 2 + Math.sin(ea) * dist,
        vx: 0, vy: 0, tx: cw / 2, ty: ch / 2,
        state: 'offscreen' as const,
        workWinId: null,
        eyeAngle: 0, wobbleT: i * 2.1,
        trailPoints: [],
      };
    });

    s.phase = 'chaos'; s.phaseT = 0; s.totalT = 0;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      initState(canvas.width, canvas.height);
    };
    resize();
    window.addEventListener('resize', resize);

    const PHASE_DUR: Record<Phase, number> = {
      chaos: 3.5, arrival: 3, work: 14, clarity: 7, cta: 9999,
    };
    const PHASE_ORDER: Phase[] = ['chaos', 'arrival', 'work', 'clarity', 'cta'];

    const tick = (now: number) => {
      const s = stateRef.current;
      const dt = Math.min((now - s.lastFrameTime) / 1000, 0.05);
      s.lastFrameTime = now;
      s.dt = dt; s.totalT += dt; s.phaseT += dt;

      const { phase, windows: wins, agents, particles } = s;
      const cw = canvas.width; const ch = canvas.height;
      const dpr = window.devicePixelRatio || 1;

      // ── Phase transitions ──────────────────────
      if (s.phaseT > PHASE_DUR[phase]) {
        const idx = PHASE_ORDER.indexOf(phase);
        if (idx < PHASE_ORDER.length - 1) {
          s.phase = PHASE_ORDER[idx + 1];
          s.phaseT = 0;
          setPhase(s.phase);
          onPhaseEnter(s.phase, wins, agents, cw, ch, dpr);
        }
      }

      // ── Update windows ─────────────────────────
      wins.forEach((win) => {
        win.flickerTimer += dt;
        if (phase === 'chaos') {
          win.x += win.vx; win.y += win.vy;
          win.vx += (Math.random() - 0.5) * 0.03 * dpr;
          win.vy += (Math.random() - 0.5) * 0.02 * dpr;
          win.vx = clamp(win.vx, -0.8 * dpr, 0.8 * dpr);
          win.vy = clamp(win.vy, -0.5 * dpr, 0.5 * dpr);
          if (win.x < 0 || win.x + win.w > cw) win.vx *= -1;
          if (win.y < 30 * dpr || win.y + win.h > ch) win.vy *= -1;
        } else {
          // damp drift in later phases
          win.vx *= 0.92; win.vy *= 0.92;
          win.x += win.vx; win.y += win.vy;
        }
        // fixing progress
        if (win.state === 'fixing') {
          win.fixPct = Math.min(1, win.fixPct + dt * 0.12);
          if (win.fixPct >= 1) {
            win.state = 'fixed'; win.fixPct = 1;
            const ag = agents.find(a => a.id === win.agentId);
            if (ag) { ag.workWinId = null; ag.state = 'idle'; win.agentId = null; }
            // spark burst
            for (let i = 0; i < 12; i++) {
              particles.push({
                x: win.x + win.w / 2, y: win.y + win.h / 2,
                vx: (Math.random() - 0.5) * 200 * dpr,
                vy: (Math.random() - 0.5) * 200 * dpr,
                life: 0.6, maxLife: 0.6,
                color: '#00e5ff', size: 3 * dpr,
              });
            }
          }
        }
      });

      // ── Update agents ──────────────────────────
      agents.forEach((ag) => {
        ag.wobbleT += dt;
        ag.eyeAngle += dt * (ag.state === 'working' ? 4 : 1.2);

        // trail
        ag.trailPoints.push({ x: ag.x, y: ag.y, a: ag.state === 'flying' ? 0.8 : 0.3 });
        if (ag.trailPoints.length > 18) ag.trailPoints.shift();

        if (ag.state === 'offscreen') return;

        // spring toward target
        const tdx = ag.tx - ag.x; const tdy = ag.ty - ag.y;
        const tdist = Math.hypot(tdx, tdy);
        const speed = ag.state === 'flying' ? 12 * dpr : 6 * dpr;
        if (tdist > 2 * dpr) {
          ag.vx += (tdx / tdist) * speed;
          ag.vy += (tdy / tdist) * speed;
        }
        ag.vx *= 0.82; ag.vy *= 0.82;
        ag.x += ag.vx * dt; ag.y += ag.vy * dt;

        if (tdist < 10 * dpr && ag.state === 'flying') ag.state = 'idle';
        if (tdist < 8 * dpr && ag.state === 'moving') {
          ag.state = 'working';
          const win = wins.find(w => w.id === ag.workWinId);
          if (win && win.state === 'broken') win.state = 'fixing';
        }

        // work idle — find next target
        if (ag.state === 'idle' && phase === 'work') {
          const nextWin = wins.find(w => w.state === 'broken' && w.agentId === null);
          if (nextWin) {
            nextWin.agentId = ag.id;
            ag.workWinId = nextWin.id;
            ag.state = 'moving';
            ag.tx = nextWin.x + nextWin.w / 2;
            ag.ty = nextWin.y - 30 * dpr;
          }
        }
      });

      // ── Update particles ───────────────────────
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt;
        p.vx *= 0.92; p.vy *= 0.92;
        if (p.life <= 0) particles.splice(i, 1);
      }

      // ── Draw ───────────────────────────────────
      ctx.clearRect(0, 0, cw, ch);

      // bg
      ctx.fillStyle = '#0a0a0f';
      ctx.fillRect(0, 0, cw, ch);

      // subtle grid
      ctx.strokeStyle = 'rgba(0,229,255,0.025)';
      ctx.lineWidth = 1;
      const gs = 60 * dpr;
      for (let x = 0; x < cw; x += gs) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, ch); ctx.stroke(); }
      for (let y = 0; y < ch; y += gs) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(cw, y); ctx.stroke(); }

      // data flows (clarity+)
      if (phase === 'clarity' || phase === 'cta') drawDataFlows(ctx, wins, s.totalT, dpr);

      // windows
      wins.forEach(win => drawWindow(ctx, win, s.totalT, dpr));

      // work beams
      agents.forEach(ag => {
        if (ag.state !== 'working' && ag.state !== 'moving') return;
        const win = wins.find(w => w.id === ag.workWinId);
        if (win) drawWorkBeam(ctx, ag, win, s.totalT, dpr);
      });

      // particles
      drawParticles(ctx, particles);

      // agents
      agents.forEach(ag => drawAgent(ctx, ag, s.totalT, dpr));

      frameRef.current = requestAnimationFrame(tick);
    };

    frameRef.current = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [initState]);

  return (
    <section className="relative w-full overflow-hidden" style={{ height: '100svh' }}>
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* vignette */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, transparent 25%, rgba(10,10,15,0.75) 100%)' }} />
      {/* text legibility gradient bottom-left */}
      <div className="absolute bottom-0 left-0 pointer-events-none"
        style={{ width: '60%', height: '50%', background: 'linear-gradient(135deg, rgba(10,10,15,0.8) 0%, transparent 70%)' }} />

      {/* Phase text — bottom left */}
      <div className="absolute bottom-0 left-0 z-20 px-10 md:px-16 pb-20 md:pb-16 max-w-2xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={phase}
            initial={{ opacity: 0, y: 40, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.7, ease: 'easeOut' } }}
            exit={{ opacity: 0, y: -30, filter: 'blur(6px)', transition: { duration: 0.4 } }}
          >
            <p className="font-mono text-[10px] tracking-[0.2em] text-accent/50 mb-4 uppercase">
              {String((['chaos','arrival','work','clarity','cta'].indexOf(phase) + 1)).padStart(2,'0')} — {phase.toUpperCase()}
            </p>
            <h2 className="font-black leading-[0.88] tracking-tight text-white"
              style={{ fontSize: 'clamp(48px, 8.5vw, 130px)' }}>
              {PHASE_TEXT[phase].l1}
            </h2>
            <h2 className="font-black leading-[0.88] tracking-tight mb-5"
              style={{ fontSize: 'clamp(48px, 8.5vw, 130px)', color: '#00e5ff' }}>
              {PHASE_TEXT[phase].l2}
            </h2>
            {PHASE_TEXT[phase].sub && (
              <p className="text-sm text-white/50 leading-relaxed whitespace-pre-line max-w-xs">
                {PHASE_TEXT[phase].sub}
              </p>
            )}
            {phase === 'cta' && (
              <a href="#form-contatto"
                className="inline-flex items-center gap-3 mt-8 px-8 py-4 rounded-xl border border-accent/40 text-accent text-sm font-semibold bg-accent/10 hover:bg-accent/20 transition-all duration-300"
                style={{ boxShadow: '0 0 24px rgba(0,229,255,0.1)' }}
                onClick={(e) => { e.preventDefault(); document.querySelector('#form-contatto')?.scrollIntoView({ behavior: 'smooth' }); }}>
                Prenota una sessione
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </a>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Phase dots — right edge */}
      <div className="absolute right-6 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-4">
        {(['chaos','arrival','work','clarity','cta'] as Phase[]).map((p, i) => (
          <div key={p} className="flex items-center justify-end gap-2">
            <span className={`font-mono text-[8px] tracking-widest transition-all duration-500 hidden md:block ${phase === p ? 'text-accent/60' : 'text-white/15'}`}>
              {String(i+1).padStart(2,'0')}
            </span>
            <span className={`rounded-full transition-all duration-500 ${phase === p ? 'w-5 h-1.5 bg-accent' : 'w-1.5 h-1.5 bg-white/20'}`} />
          </div>
        ))}
      </div>

      {/* Scroll hint */}
      {phase === 'cta' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2">
          <span className="font-mono text-[9px] tracking-widest text-white/25">SCORRI</span>
          <motion.div animate={{ y: [0, 6, 0] }} transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
            className="w-px h-8 bg-gradient-to-b from-white/25 to-transparent" />
        </motion.div>
      )}
    </section>
  );
}

/* ── Phase enter side-effects ────────────────────── */
function onPhaseEnter(phase: Phase, wins: DeskWin[], agents: Agent[], cw: number, ch: number, dpr: number) {
  if (phase === 'arrival') {
    // send agents flying in from outside
    const targets = [
      { x: cw * 0.25, y: ch * 0.45 },
      { x: cw * 0.50, y: ch * 0.30 },
      { x: cw * 0.75, y: ch * 0.50 },
    ];
    agents.forEach((ag, i) => {
      ag.state = 'flying';
      ag.tx = targets[i].x;
      ag.ty = targets[i].y;
    });
  }

  if (phase === 'work') {
    // agents start hunting broken windows in sequence
    agents.forEach((ag, i) => {
      ag.state = 'idle'; // will auto-find next broken window
      ag.tx = ag.x; ag.ty = ag.y;
      // stagger: agent i only starts after delay (handled by idle loop)
      // pre-assign first window per agent
      const winIdx = i < wins.length ? i : null;
      if (winIdx !== null) {
        const win = wins[winIdx];
        win.agentId = ag.id;
        ag.workWinId = win.id;
        ag.state = 'moving';
        ag.tx = win.x + win.w / 2;
        ag.ty = win.y - 30 * dpr;
      }
    });
  }

  if (phase === 'clarity') {
    // fix any remaining windows instantly, send agents to watch positions
    wins.forEach(w => { w.state = 'fixed'; w.fixPct = 1; w.agentId = null; w.vx = 0; w.vy = 0; });
    const watchPos = [
      { x: cw * 0.15, y: ch * 0.5 },
      { x: cw * 0.50, y: ch * 0.85 },
      { x: cw * 0.85, y: ch * 0.5 },
    ];
    agents.forEach((ag, i) => {
      ag.workWinId = null;
      ag.state = 'idle';
      ag.tx = watchPos[i].x;
      ag.ty = watchPos[i].y;
    });
  }

  if (phase === 'cta') {
    // agents converge center
    const center = { x: cw * 0.5, y: ch * 0.55 };
    agents.forEach((ag, i) => {
      const angle = (i / agents.length) * Math.PI * 2;
      ag.state = 'idle';
      ag.tx = center.x + Math.cos(angle) * 100 * dpr;
      ag.ty = center.y + Math.sin(angle) * 60 * dpr;
    });
  }
}
