'use client';

import React, { useRef, useEffect, useState } from 'react';
import { useScroll, useMotionValueEvent, motion, AnimatePresence } from 'framer-motion';

// ==============================================================
// HELPER FUNCTIONS
// ==============================================================

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

// ==============================================================
// TYPE DEFINITIONS
// ==============================================================

type SceneType = 'intro' | 'approach' | 'chaos' | 'arrival' | 'work' | 'clarity' | 'cta';

interface WindowDef {
  id: number;
  title: string;
  errorTxt: string;
  rx: number;
  ry: number;
  rw: number;
  rh: number;
}

interface WindowData extends WindowDef {
  x: number;
  y: number;
  w: number;
  h: number;
  state: 'broken' | 'fixed';
  fixPct: number;
}

interface AgentDef {
  id: number;
  name: string;
  role: string;
  color: string;
}

interface AgentData extends AgentDef {
  x: number;
  y: number;
  appear: number;
  scale: number;
}

interface StatCard {
  label: string;
  value: number;
  suffix: string;
  color: string;
}

// ==============================================================
// SCENE MAPPING & DATA
// ==============================================================

function getSceneFromProgress(p: number): SceneType {
  if (p < 0.08) return 'intro';
  if (p < 0.28) return 'approach';
  if (p < 0.44) return 'chaos';
  if (p < 0.58) return 'arrival';
  if (p < 0.76) return 'work';
  if (p < 0.90) return 'clarity';
  return 'cta';
}

function getMonitorScale(p: number): number {
  if (p < 0.08) return 0.22;
  if (p < 0.28) return lerp(0.22, 3.8, easeInOut((p - 0.08) / 0.2));
  if (p < 0.90) return 3.8;
  return lerp(3.8, 0.7, easeInOut((p - 0.9) / 0.1));
}

const WIN_DEFS: WindowDef[] = [
  { id: 0, title: 'POSTA IN ARRIVO', errorTxt: '847 non letti', rx: 0.03, ry: 0.02, rw: 0.28, rh: 0.38 },
  { id: 1, title: 'REPORT_Q4.xlsx', errorTxt: '#REF! Errori', rx: 0.35, ry: 0.0, rw: 0.3, rh: 0.35 },
  { id: 2, title: 'MESSAGGI', errorTxt: '34 non risposti', rx: 0.7, ry: 0.06, rw: 0.27, rh: 0.32 },
  { id: 3, title: 'FATTURE', errorTxt: '12 scadute', rx: 0.08, ry: 0.5, rw: 0.28, rh: 0.38 },
  { id: 4, title: 'CALENDARIO', errorTxt: '8 conflitti', rx: 0.55, ry: 0.48, rw: 0.38, rh: 0.38 },
];

const AGENT_DEFS: AgentDef[] = [
  { id: 0, name: 'NEXUS', role: 'ANALISI', color: '#00e5ff' },
  { id: 1, name: 'FORGE', role: 'BUILD', color: '#a855f7' },
  { id: 2, name: 'LINK', role: 'CONNECT', color: '#60a5fa' },
];

const SCENE_TEXT: Record<SceneType, { l1: string; l2: string; sub: string }> = {
  intro: { l1: 'Il tuo', l2: 'digitale.', sub: 'Ogni mattina: 847 email, 12 fatture scadute,\n8 conflitti in calendario. Il tuo caos digitale.' },
  approach: { l1: '', l2: '', sub: '' },
  chaos: { l1: 'Caos', l2: 'operativo.', sub: 'Email, Excel, WhatsApp, fatture.\nTutto disconnesso. Tutto manuale.' },
  arrival: { l1: 'I nostri', l2: 'agenti.', sub: 'NEXUS, FORGE, LINK analizzano ogni processo,\nogni attrito, ogni punto debole.' },
  work: { l1: 'Stiamo', l2: 'sistemando.', sub: 'Ogni finestra riparata. Ogni connessione attivata.\nIl caos diventa sistema.' },
  clarity: { l1: 'Chiarezza', l2: 'totale.', sub: 'Automatizzato, misurabile, sotto controllo.\nTutto funziona.' },
  cta: { l1: 'Iniziamo', l2: 'insieme.', sub: '' },
};

function getWindows(x: number, y: number, w: number, h: number, scene: SceneType, p: number): WindowData[] {
  const numFixed = scene === 'work'
    ? Math.floor(((p - 0.58) / 0.18) * 5)
    : (scene === 'clarity' || scene === 'cta' ? 5 : 0);

  return WIN_DEFS.map((def, i) => ({
    ...def,
    x: x + def.rx * w,
    y: y + def.ry * h,
    w: def.rw * w,
    h: def.rh * h,
    state: i < numFixed ? 'fixed' : 'broken',
    fixPct: scene === 'work' ? clamp(((p - 0.58) / 0.18) * 5 - i, 0, 1) : i < numFixed ? 1 : 0,
  }));
}

function getAgents(x: number, y: number, w: number, h: number, scene: SceneType, p: number): AgentData[] {
  const localP = scene === 'arrival' ? (p - 0.44) / 0.14 : (p - 0.58) / 0.32;
  const positions = [
    { x: x + w * 0.2, y: y + h * 0.55 },
    { x: x + w * 0.5, y: y + h * 0.6 },
    { x: x + w * 0.8, y: y + h * 0.55 },
  ];

  return AGENT_DEFS.map((def, i) => {
    const appear = clamp((localP - i * 0.25) / 0.15, 0, 1);
    return {
      ...def,
      ...positions[i],
      appear,
      scale: appear,
    };
  });
}

// ==============================================================
// DRAWING FUNCTIONS
// ==============================================================

function drawStarField(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, alpha: number, dpr: number) {
  if (alpha <= 0) return;
  ctx.globalAlpha = alpha;
  for (let i = 0; i < 80; i++) {
    const sx = ((i * 137.5 * dpr) % w);
    const sy = ((i * 73.1 * dpr) % h);
    const pulse = 0.4 + 0.3 * Math.sin(t * 0.8 + i);
    ctx.beginPath();
    ctx.arc(sx, sy, 1.2 * dpr, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(200,220,255,${pulse * 0.6})`;
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawDesktopWindow(ctx: CanvasRenderingContext2D, win: WindowData, scene: SceneType, t: number, dpr: number) {
  const isBroken = win.state === 'broken';
  const edge = isBroken ? 'rgba(255,60,60,0.4)' : 'rgba(0,229,255,0.3)';
  const bg = isBroken ? 'rgba(20,5,5,0.85)' : 'rgba(5,15,20,0.9)';
  const contentColor = isBroken ? 'rgba(180,50,50,0.6)' : 'rgba(0,229,255,0.7)';

  // During fixing, transition colors
  if (win.fixPct > 0 && win.fixPct < 1) {
    const r = Math.floor(lerp(255, 0, win.fixPct));
    const g = Math.floor(lerp(60, 229, win.fixPct));
    const b = Math.floor(lerp(60, 255, win.fixPct));
    ctx.strokeStyle = `rgba(${r},${g},${b},${0.4 + win.fixPct * 0.3})`;
  } else {
    ctx.strokeStyle = edge;
  }

  // Window frame
  ctx.beginPath();
  ctx.roundRect(win.x, win.y, win.w, win.h, 6 * dpr);
  ctx.fillStyle = bg;
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Title bar
  const titleH = 24 * dpr;
  ctx.fillStyle = 'rgba(10,10,15,0.8)';
  ctx.fillRect(win.x, win.y, win.w, titleH);

  // Title text
  ctx.font = `bold ${8 * dpr}px "JetBrains Mono",monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = contentColor;
  ctx.fillText(win.title, win.x + win.w / 2, win.y + titleH / 2);

  // macOS dots
  const dotSize = 2.5 * dpr;
  const dotsX = win.x + 8 * dpr;
  const dotsY = win.y + titleH / 2;
  const colors = ['#ff605c', '#ffbd44', '#00ca4e'];
  colors.forEach((col, i) => {
    ctx.beginPath();
    ctx.arc(dotsX + i * 8 * dpr, dotsY, dotSize, 0, Math.PI * 2);
    ctx.fillStyle = col;
    ctx.fill();
  });

  // Content area
  const contentX = win.x + 8 * dpr;
  const contentY = win.y + titleH + 8 * dpr;
  const contentW = win.w - 16 * dpr;
  const contentH = win.h - titleH - 16 * dpr;

  ctx.font = `${6.5 * dpr}px "JetBrains Mono",monospace`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle = contentColor;

  // Generic error text or content based on window
  const lines = [win.errorTxt, 'Status: PENDING', '---', 'Action required'];
  const lineH = 10 * dpr;
  lines.forEach((line, i) => {
    ctx.fillText(line, contentX, contentY + i * lineH);
  });

  // Fixed indicator
  if (win.state === 'fixed') {
    ctx.font = `bold ${10 * dpr}px sans-serif`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillStyle = 'rgba(0,229,255,0.8)';
    ctx.fillText('✓', win.x + win.w - 8 * dpr, win.y + 8 * dpr);
  }

  // Pulse indicator for broken state
  if (isBroken) {
    const pulse = 0.3 + 0.3 * Math.sin(t * 4);
    ctx.beginPath();
    ctx.arc(win.x + win.w - 12 * dpr, win.y + titleH / 2, 3 * dpr, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,100,100,${pulse})`;
    ctx.fill();
  }
}

function drawSuperAgent(ctx: CanvasRenderingContext2D, ag: AgentData, scene: SceneType, t: number, dpr: number) {
  if (ag.appear <= 0) return;

  const { x, y, color, name, role, appear, scale } = ag;
  const sz = 28 * dpr * scale;
  const bob = Math.sin(t * 2 + ag.id) * 3 * dpr;
  const ay = y + bob;

  ctx.save();
  ctx.globalAlpha = appear;
  ctx.translate(x, ay);

  // Entry burst
  if (appear < 0.8) {
    const burstR = sz * (1 + (1 - appear) * 4);
    const burstGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, burstR);
    burstGrad.addColorStop(0, color + '60');
    burstGrad.addColorStop(1, color + '00');
    ctx.beginPath();
    ctx.arc(0, 0, burstR, 0, Math.PI * 2);
    ctx.fillStyle = burstGrad;
    ctx.fill();
  }

  // Cape
  ctx.beginPath();
  ctx.moveTo(-sz * 0.35, -sz * 0.4);
  ctx.bezierCurveTo(-sz * 1.2, sz * 0.3, -sz * 0.9, sz * 1.8, -sz * 0.1, sz * 1.6);
  ctx.lineTo(sz * 0.1, sz * 1.6);
  ctx.bezierCurveTo(sz * 0.9, sz * 1.8, sz * 1.2, sz * 0.3, sz * 0.35, -sz * 0.4);
  ctx.closePath();
  const capeGrad = ctx.createLinearGradient(0, -sz * 0.4, 0, sz * 1.6);
  capeGrad.addColorStop(0, color + 'aa');
  capeGrad.addColorStop(0.5, color + '55');
  capeGrad.addColorStop(1, color + '00');
  ctx.fillStyle = capeGrad;
  ctx.fill();

  // Body (armor)
  ctx.beginPath();
  ctx.moveTo(-sz * 0.45, -sz * 0.38);
  ctx.lineTo(-sz * 0.32, sz * 0.48);
  ctx.lineTo(sz * 0.32, sz * 0.48);
  ctx.lineTo(sz * 0.45, -sz * 0.38);
  ctx.closePath();
  const bodyGrad = ctx.createLinearGradient(-sz * 0.4, 0, sz * 0.4, 0);
  bodyGrad.addColorStop(0, color + 'cc');
  bodyGrad.addColorStop(0.5, color + 'ff');
  bodyGrad.addColorStop(1, color + 'bb');
  ctx.fillStyle = bodyGrad;
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.lineWidth = 1 * dpr;
  ctx.stroke();

  // Chest symbol
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.font = `bold ${7 * dpr}px monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(role.charAt(0), 0, sz * 0.04);

  // Head (helmet)
  const headY = -sz * 0.78;
  ctx.beginPath();
  ctx.arc(0, headY, sz * 0.3, 0, Math.PI * 2);
  ctx.fillStyle = color + 'dd';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.lineWidth = 1.5 * dpr;
  ctx.stroke();

  // Visor
  ctx.beginPath();
  const visAngle = t * 3;
  ctx.arc(0, headY, sz * 0.18, visAngle - 0.6, visAngle + 0.6);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2 * dpr;
  ctx.stroke();

  // Arms (action pose)
  const armAngle = scene === 'work' ? Math.sin(t * 4 + ag.id) * 0.3 : 0.2;

  ctx.save();
  ctx.rotate(-armAngle - 0.4);
  ctx.beginPath();
  ctx.roundRect(-sz * 0.46, -sz * 0.3, sz * 0.16, sz * 0.5, 3 * dpr);
  ctx.fillStyle = color + 'cc';
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.rotate(armAngle + 0.4);
  ctx.beginPath();
  ctx.roundRect(sz * 0.3, -sz * 0.3, sz * 0.16, sz * 0.5, 3 * dpr);
  ctx.fillStyle = color + 'cc';
  ctx.fill();
  ctx.restore();

  // Legs
  [-0.16, 0.16].forEach((ox) => {
    ctx.beginPath();
    ctx.roundRect(ox * sz - sz * 0.1, sz * 0.45, sz * 0.2, sz * 0.5, 3 * dpr);
    ctx.fillStyle = color + 'aa';
    ctx.fill();
  });

  // Outer glow ring
  const gR = sz * 2.2;
  const outerGlow = ctx.createRadialGradient(0, 0, sz * 0.4, 0, 0, gR);
  outerGlow.addColorStop(0, color + '15');
  outerGlow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.beginPath();
  ctx.arc(0, 0, gR, 0, Math.PI * 2);
  ctx.fillStyle = outerGlow;
  ctx.fill();

  // Energy particles (work scene)
  if (scene === 'work') {
    for (let i = 0; i < 4; i++) {
      const pAngle = t * 2 + i * (Math.PI / 2);
      const pDist = sz * (0.8 + Math.sin(t * 3 + i) * 0.3);
      const px = Math.cos(pAngle) * pDist;
      const py = Math.sin(pAngle) * pDist - sz * 0.2;
      ctx.beginPath();
      ctx.arc(px, py, 2 * dpr, 0, Math.PI * 2);
      ctx.fillStyle = color + 'cc';
      ctx.fill();
    }
  }

  // Name tag
  ctx.font = `bold ${7.5 * dpr}px "JetBrains Mono",monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillStyle = color + 'cc';
  ctx.fillText(name, 0, sz * 1.05);
  ctx.font = `${6 * dpr}px "JetBrains Mono",monospace`;
  ctx.fillStyle = color + '55';
  ctx.fillText(role, 0, sz * 1.18);

  ctx.restore();
  ctx.globalAlpha = 1;
}

function drawStatsOverlay(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, p: number, t: number, dpr: number) {
  const localP = clamp((p - 0.76) / 0.14, 0, 1);

  const stats: StatCard[] = [
    { label: 'Tempo risparmiato', value: 40, suffix: '%', color: '#00e5ff' },
    { label: 'Errori eliminati', value: 70, suffix: '%', color: '#a855f7' },
    { label: 'Visibilità processi', value: 95, suffix: '%', color: '#60a5fa' },
    { label: 'Efficienza team', value: 85, suffix: '%', color: '#34d399' },
  ];

  const cols = 2;
  const cardW = w * 0.36;
  const cardH = h * 0.26;

  stats.forEach((s, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const appear = clamp((localP - i * 0.18) / 0.2, 0, 1);
    if (appear <= 0) return;

    const cx = x + w * 0.1 + col * (cardW + w * 0.08);
    const cy2 = y + h * 0.1 + row * (cardH + h * 0.05);

    // Card bg
    ctx.beginPath();
    ctx.roundRect(cx, cy2, cardW, cardH, 8 * dpr);
    ctx.fillStyle = `rgba(10,10,20,${0.85 * appear})`;
    ctx.fill();
    const alphaHex = Math.floor(appear * 80)
      .toString(16)
      .padStart(2, '0');
    ctx.strokeStyle = s.color + alphaHex;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Number
    const displayVal = Math.round(s.value * easeInOut(appear));
    ctx.font = `bold ${clamp(cardW * 0.3, 20 * dpr, 32 * dpr)}px "Inter",sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = s.color;
    ctx.globalAlpha = appear;
    ctx.fillText(`${displayVal}${s.suffix}`, cx + cardW / 2, cy2 + cardH * 0.42);

    // Label
    ctx.font = `${7 * dpr}px "JetBrains Mono",monospace`;
    ctx.fillStyle = 'rgba(200,200,220,0.7)';
    ctx.fillText(s.label, cx + cardW / 2, cy2 + cardH * 0.75);

    ctx.globalAlpha = 1;
  });
}

function drawDesktop(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  scene: SceneType,
  t: number,
  p: number,
  dpr: number
) {
  // Background
  const bg = ctx.createLinearGradient(x, y, x, y + h);
  const isChaos = scene === 'chaos' || scene === 'arrival' || scene === 'work';
  bg.addColorStop(0, isChaos ? '#1a0808' : '#050510');
  bg.addColorStop(1, isChaos ? '#0a0815' : '#0a0520');
  ctx.fillStyle = bg;
  ctx.fillRect(x, y, w, h);

  // Menubar
  ctx.fillStyle = 'rgba(20,10,10,0.9)';
  ctx.fillRect(x, y, w, 20 * dpr);
  ctx.font = `bold ${8 * dpr}px "JetBrains Mono",monospace`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = isChaos ? 'rgba(255,100,100,0.7)' : 'rgba(0,229,255,0.7)';
  ctx.fillText('● PMI S.r.l.', x + 8 * dpr, y + 10 * dpr);

  ctx.textAlign = 'right';
  ctx.fillStyle = 'rgba(200,200,200,0.4)';
  const now = new Date();
  const timeStr = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;
  ctx.fillText(timeStr, x + w - 8 * dpr, y + 10 * dpr);

  // Windows
  const winData = getWindows(x, y + 20 * dpr, w, h - 20 * dpr, scene, p);
  winData.forEach((win) => drawDesktopWindow(ctx, win, scene, t, dpr));

  // Agents
  if (scene === 'arrival' || scene === 'work' || scene === 'clarity' || scene === 'cta') {
    const agentData = getAgents(x, y + 20 * dpr, w, h - 20 * dpr, scene, p);
    agentData.forEach((ag) => drawSuperAgent(ctx, ag, scene, t, dpr));
  }

  // Stats overlay
  if (scene === 'clarity' || scene === 'cta') {
    drawStatsOverlay(ctx, x, y + 20 * dpr, w, h - 20 * dpr, p, t, dpr);
  }
}

function drawMonitor(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  w: number,
  h: number,
  dpr: number,
  desktopScene: SceneType,
  t: number,
  p: number
) {
  const monW = w * 0.52;
  const monH = monW * 0.68;
  const monX = cx - monW / 2;
  const monY = cy - monH / 2;
  const bezelThick = 14 * dpr;
  const standH = 28 * dpr;

  // Bezel (outer frame)
  ctx.beginPath();
  ctx.roundRect(monX, monY, monW, monH - standH, 10 * dpr);
  ctx.fillStyle = '#1e1e2e';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Screen clipping area
  const screenX = monX + bezelThick;
  const screenY = monY + bezelThick;
  const screenW = monW - bezelThick * 2;
  const screenH = monH - bezelThick * 2 - standH;

  ctx.save();
  ctx.beginPath();
  ctx.roundRect(screenX, screenY, screenW, screenH, 4 * dpr);
  ctx.clip();
  drawDesktop(ctx, screenX, screenY, screenW, screenH, desktopScene, t, p, dpr);
  ctx.restore();

  // Stand
  ctx.beginPath();
  ctx.moveTo(cx - 25 * dpr, monY + monH - standH);
  ctx.lineTo(cx + 25 * dpr, monY + monH - standH);
  ctx.lineTo(cx + 35 * dpr, monY + monH);
  ctx.lineTo(cx - 35 * dpr, monY + monH);
  ctx.closePath();
  ctx.fillStyle = '#1a1a2a';
  ctx.fill();

  // Glow (clarity + cta scenes)
  if (desktopScene === 'clarity' || desktopScene === 'cta') {
    const glowGrad = ctx.createRadialGradient(cx, cy, monW * 0.2, cx, cy, monW);
    glowGrad.addColorStop(0, 'rgba(0,229,255,0.08)');
    glowGrad.addColorStop(1, 'rgba(0,229,255,0)');
    ctx.fillStyle = glowGrad;
    ctx.fillRect(monX - monW * 0.5, monY - monH * 0.3, monW * 2, monH * 1.6);
  }
}

// ==============================================================
// TEXT OVERLAY COMPONENT
// ==============================================================

function TextOverlay({ scene }: { scene: SceneType }) {
  const text = SCENE_TEXT[scene];

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={scene}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.5 }}
        className="absolute bottom-8 left-8 z-20 pointer-events-none max-w-md"
      >
        {text.l1 && (
          <div className="text-white font-bold" style={{ fontSize: 'clamp(48px, 8vw, 120px)', lineHeight: '1.1' }}>
            {text.l1}
          </div>
        )}
        {text.l2 && (
          <div className="text-[#00e5ff] font-bold" style={{ fontSize: 'clamp(48px, 8vw, 120px)', lineHeight: '1.1' }}>
            {text.l2}
          </div>
        )}
        {text.sub && (
          <div className="text-gray-400 text-sm mt-4 whitespace-pre-line font-mono">
            {text.sub}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

// ==============================================================
// MAIN COMPONENT
// ==============================================================

export default function ImmersiveScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const progressRef = useRef(0);
  const [currentScene, setCurrentScene] = useState<SceneType>('intro');

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    progressRef.current = v;
    setCurrentScene(getSceneFromProgress(v));
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;

    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.scale(dpr, dpr);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    let animationFrameId: number;
    let startTime = Date.now();

    const animate = () => {
      const now = Date.now();
      const t = (now - startTime) / 1000;
      const p = progressRef.current;

      const w = window.innerWidth;
      const h = window.innerHeight;
      const cx = w / 2;
      const cy = h / 2;

      // Clear canvas
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, w, h);

      // Determine which scenes show starfield
      const currentScene = getSceneFromProgress(p);
      const showStars = currentScene === 'intro' || currentScene === 'approach' || currentScene === 'cta';
      const starsAlpha = currentScene === 'approach' ? 1 - ((p - 0.08) / 0.2) : currentScene === 'intro' ? 1 : currentScene === 'cta' ? (p - 0.9) / 0.1 : 0;

      if (showStars) {
        drawStarField(ctx, w, h, t, starsAlpha, dpr);
      }

      // Monitor scale and zoom transform
      const monitorScale = getMonitorScale(p);
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(monitorScale, monitorScale);
      ctx.translate(-cx, -cy);

      drawMonitor(ctx, cx, cy, w, h, dpr, currentScene, t, p);

      ctx.restore();

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="relative w-full bg-black">
      <div ref={containerRef} style={{ height: '800vh' }}>
        <div className="sticky top-0 h-screen w-full overflow-hidden bg-black">
          <canvas
            ref={canvasRef}
            className="w-full h-full block"
            style={{ display: 'block' }}
          />
          <TextOverlay scene={currentScene} />
        </div>
      </div>
    </div>
  );
}
