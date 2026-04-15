'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import {
  motion, useScroll, useMotionValueEvent, AnimatePresence,
} from 'framer-motion';

/* ═══════════════════════════════════════════════════════════
   SCENE MAP  —  every beat of the story mapped to scroll 0→1
   Total section height: 1400vh
═══════════════════════════════════════════════════════════ */
const SCENES = {
  intro:    [0,    0.06] as [number,number],  // dark space, monitor tiny
  approach: [0.06, 0.21] as [number,number],  // camera flies into screen
  chaos:    [0.21, 0.35] as [number,number],  // inside — broken desktop
  arrival:  [0.35, 0.47] as [number,number],  // agents materialize
  work:     [0.47, 0.64] as [number,number],  // agents fix everything
  clarity:  [0.64, 0.72] as [number,number],  // clean dashboard + metrics
  services: [0.72, 0.82] as [number,number],  // services revealed
  method:   [0.82, 0.89] as [number,number],  // 4-step method
  metrics:  [0.89, 0.95] as [number,number],  // big numbers
  cta:      [0.95, 1.00] as [number,number],  // zoom out + contact
} as const;

type SceneName = keyof typeof SCENES;

function getScene(p: number): { name: SceneName; local: number } {
  for (const [name, [start, end]] of Object.entries(SCENES) as [SceneName, [number,number]][]) {
    if (p >= start && p <= end) {
      return { name, local: clamp((p - start) / (end - start), 0, 1) };
    }
  }
  return { name: 'cta', local: 1 };
}

/* ═══════════════════════════════════════════════════════════
   MATH HELPERS
═══════════════════════════════════════════════════════════ */
function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)); }
function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }
function eio(t: number) {                          // ease-in-out cubic
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
function eout(t: number) { return 1 - Math.pow(1 - t, 3); }
function map(v: number, a: number, b: number, c: number, d: number) {
  return clamp(c + (d - c) * ((v - a) / (b - a)), Math.min(c,d), Math.max(c,d));
}

/* ═══════════════════════════════════════════════════════════
   WINDOW DEFINITIONS
═══════════════════════════════════════════════════════════ */
interface WinDef { id: number; title: string; err: string; icon: string }
const WIN_DEFS: WinDef[] = [
  { id: 0, title: 'Posta in arrivo',  err: '847 non letti',   icon: '✉' },
  { id: 1, title: 'Report Q4.xlsx',  err: '#REF! — 12 errori',icon: '⊞' },
  { id: 2, title: 'Messaggi',         err: '34 senza risposta',icon: '◉' },
  { id: 3, title: 'Fatture',          err: '12 scadute',       icon: '₿' },
  { id: 4, title: 'Calendario',       err: '8 conflitti',      icon: '▦' },
  { id: 5, title: 'CRM',              err: '203 lead persi',   icon: '◈' },
];

const AGENT_COLORS = ['#00e5ff', '#a855f7', '#60a5fa'] as const;
const AGENT_NAMES  = ['NEXUS', 'FORGE', 'LINK'] as const;
const AGENT_ROLES  = ['ANALISI', 'BUILD', 'CONNECT'] as const;

/* ═══════════════════════════════════════════════════════════
   CANVAS DRAWING
═══════════════════════════════════════════════════════════ */

/** Compute monitor scale based on global progress. */
function monitorScale(p: number): number {
  if (p < SCENES.approach[0]) return 0.20;
  if (p < SCENES.approach[1]) return lerp(0.20, 3.9, eio(map(p, ...SCENES.approach, 0, 1)));
  if (p < SCENES.cta[0])      return 3.9;
  return lerp(3.9, 0.68, eio(map(p, ...SCENES.cta, 0, 1)));
}

/** Stars in the background (only visible when not fully inside screen). */
function drawStars(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, alpha: number) {
  if (alpha <= 0.01) return;
  ctx.save(); ctx.globalAlpha = alpha;
  for (let i = 0; i < 120; i++) {
    const sx = ((i * 163.7) % 1) * w;
    const sy = ((i * 97.3) % 1) * h;
    const pulse = 0.35 + 0.3 * Math.sin(t * 0.6 + i * 0.8);
    ctx.beginPath(); ctx.arc(sx, sy, (0.8 + (i % 3) * 0.4), 0, Math.PI * 2);
    ctx.fillStyle = `rgba(200,220,255,${pulse * 0.7})`; ctx.fill();
  }
  ctx.restore();
}

/** Monitor frame (bezel + stand). */
function drawMonitorFrame(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, w: number, h: number,
  dpr: number, isClean: boolean,
) {
  const mw = w * 0.52; const mh = mw * 0.66;
  const mx = cx - mw / 2; const my = cy - mh / 2;
  const bz = 13 * dpr; const r = 10 * dpr; const standH = 26 * dpr;

  // Outer bezel
  ctx.beginPath(); ctx.roundRect(mx, my, mw, mh - standH, r);
  const bg = ctx.createLinearGradient(mx, my, mx, my + mh);
  bg.addColorStop(0, '#252535'); bg.addColorStop(1, '#16162a');
  ctx.fillStyle = bg; ctx.fill();
  ctx.strokeStyle = isClean ? 'rgba(0,229,255,0.25)' : 'rgba(255,255,255,0.07)';
  ctx.lineWidth = 1.5; ctx.stroke();

  // Stand
  ctx.beginPath();
  ctx.moveTo(cx - 22*dpr, my + mh - standH);
  ctx.lineTo(cx + 22*dpr, my + mh - standH);
  ctx.lineTo(cx + 30*dpr, my + mh);
  ctx.lineTo(cx - 30*dpr, my + mh);
  ctx.closePath();
  ctx.fillStyle = '#1a1a28'; ctx.fill();

  // Screen clip region
  const sx = mx + bz; const sy = my + bz;
  const sw = mw - bz * 2; const sh = mh - bz * 2 - standH;

  if (isClean) {
    const glow = ctx.createRadialGradient(cx, cy, mw*0.1, cx, cy, mw);
    glow.addColorStop(0, 'rgba(0,229,255,0.12)');
    glow.addColorStop(1, 'rgba(0,229,255,0)');
    ctx.fillStyle = glow; ctx.fillRect(mx - mw*0.5, my - mh*0.3, mw*2, mh*1.6);
  }

  return { sx, sy, sw, sh };
}

/** Desktop inside the monitor. */
function drawDesktop(
  ctx: CanvasRenderingContext2D,
  sx: number, sy: number, sw: number, sh: number,
  p: number, t: number, dpr: number,
) {
  const scene = getScene(p);

  // Clip to screen
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(sx, sy, sw, sh, 4 * dpr); ctx.clip();

  // Background
  const isChaos = ['chaos','arrival','work'].includes(scene.name);
  const bgGrad = ctx.createLinearGradient(sx, sy, sx, sy + sh);
  if (isChaos) {
    bgGrad.addColorStop(0, '#120808'); bgGrad.addColorStop(1, '#0a0614');
  } else {
    bgGrad.addColorStop(0, '#050414'); bgGrad.addColorStop(1, '#080320');
  }
  ctx.fillStyle = bgGrad; ctx.fillRect(sx, sy, sw, sh);

  // Subtle grid
  ctx.strokeStyle = isChaos ? 'rgba(255,60,60,0.04)' : 'rgba(0,229,255,0.04)';
  ctx.lineWidth = 0.5;
  const gs = 40 * dpr;
  for (let x = sx; x < sx + sw; x += gs) { ctx.beginPath(); ctx.moveTo(x, sy); ctx.lineTo(x, sy + sh); ctx.stroke(); }
  for (let y = sy; y < sy + sh; y += gs) { ctx.beginPath(); ctx.moveTo(sx, y); ctx.lineTo(sx + sw, y); ctx.stroke(); }

  // Menubar
  ctx.fillStyle = 'rgba(8,4,20,0.95)';
  ctx.fillRect(sx, sy, sw, 18 * dpr);
  ctx.font = `bold ${7*dpr}px "JetBrains Mono",monospace`;
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillStyle = isChaos ? 'rgba(255,80,80,0.6)' : 'rgba(0,229,255,0.6)';
  ctx.fillText('● PMI S.r.l.', sx + 6*dpr, sy + 9*dpr);
  ctx.textAlign = 'right';
  ctx.fillStyle = 'rgba(200,200,220,0.35)';
  const hh = new Date().getHours(); const mm = new Date().getMinutes();
  ctx.fillText(`${hh}:${String(mm).padStart(2,'0')}`, sx + sw - 6*dpr, sy + 9*dpr);

  // Window grid
  const contentTop = sy + 18 * dpr;
  const contentH = sh - 18 * dpr;
  drawWindowGrid(ctx, sx, contentTop, sw, contentH, p, t, dpr, scene);

  // Agents
  if (['arrival','work','clarity','services','method','metrics','cta'].includes(scene.name)) {
    drawAgents(ctx, sx, contentTop, sw, contentH, p, t, dpr, scene);
  }

  ctx.restore();
}

/** 3-column × 2-row grid of windows. */
function drawWindowGrid(
  ctx: CanvasRenderingContext2D,
  ax: number, ay: number, aw: number, ah: number,
  p: number, t: number, dpr: number,
  scene: { name: SceneName; local: number },
) {
  const cols = 3; const rows = 2;
  const padX = aw * 0.03; const padY = ah * 0.04;
  const gapX = aw * 0.025; const gapY = ah * 0.04;
  const winW = (aw - padX * 2 - gapX * (cols - 1)) / cols;
  const winH = (ah - padY * 2 - gapY * (rows - 1)) / rows;

  // How many windows are "fixed"
  let numFixed = 0;
  if (scene.name === 'work') numFixed = Math.floor(scene.local * 6.5);
  else if (['clarity','services','method','metrics','cta'].includes(scene.name)) numFixed = 6;

  // Chaos jitter (slight shake on broken windows)
  const jitter = (i: number) => {
    if (numFixed > i) return { dx: 0, dy: 0 };
    const jMag = 1.5 * dpr * Math.sin(t * 8 + i * 1.7);
    return { dx: jMag * Math.cos(i * 2.3), dy: jMag * Math.sin(i * 1.9) };
  };

  WIN_DEFS.forEach((def, i) => {
    const col = i % cols; const row = Math.floor(i / cols);
    const bx = ax + padX + col * (winW + gapX);
    const by = ay + padY + row * (winH + gapY);
    const { dx, dy } = jitter(i);

    // Window appears with stagger in chaos/arrival
    let winAlpha = 1;
    if (scene.name === 'chaos') winAlpha = clamp((scene.local - i * 0.08) / 0.12, 0, 1);
    else if (scene.name === 'approach') winAlpha = 0;
    else if (scene.name === 'intro') winAlpha = 0;
    if (winAlpha <= 0) return;

    // Fix progress per window
    const fixPct = scene.name === 'work'
      ? clamp((scene.local * 6 - i), 0, 1)
      : (numFixed > i ? 1 : 0);

    ctx.save(); ctx.globalAlpha = winAlpha;
    drawOneWindow(ctx, bx + dx, by + dy, winW, winH, def, fixPct, t, dpr);
    ctx.restore();
  });
}

function drawOneWindow(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  def: WinDef, fixPct: number, t: number, dpr: number,
) {
  const r = 7 * dpr; const tbH = 20 * dpr;
  const isBroken = fixPct < 0.05;
  const isFixed = fixPct >= 0.98;

  // Window bg
  ctx.beginPath(); ctx.roundRect(x, y, w, h, r);
  ctx.fillStyle = isBroken ? 'rgba(15,5,5,0.92)' : (isFixed ? 'rgba(4,12,22,0.95)' : 'rgba(10,8,18,0.93)');
  ctx.fill();

  // Border
  let borderAlpha: number;
  let borderR: number, borderG: number, borderB: number;
  if (isFixed) { borderR=0; borderG=229; borderB=255; borderAlpha=0.35; }
  else if (isBroken) {
    const flicker = 0.25 + 0.15 * Math.sin(t * 7 + def.id * 2.1);
    borderR=255; borderG=50; borderB=50; borderAlpha=flicker;
  } else {
    borderR = Math.round(lerp(255, 0, fixPct));
    borderG = Math.round(lerp(50, 229, fixPct));
    borderB = Math.round(lerp(50, 255, fixPct));
    borderAlpha = 0.4;
  }
  ctx.beginPath(); ctx.roundRect(x, y, w, h, r);
  ctx.strokeStyle = `rgba(${borderR},${borderG},${borderB},${borderAlpha})`;
  ctx.lineWidth = 1.5; ctx.stroke();

  // Title bar
  ctx.save();
  ctx.beginPath(); ctx.roundRect(x, y, w, tbH, [r, r, 0, 0]); ctx.clip();
  ctx.fillStyle = isFixed ? 'rgba(0,229,255,0.08)' : 'rgba(255,50,50,0.06)';
  ctx.fillRect(x, y, w, tbH);
  ctx.restore();

  // Traffic lights
  const dotCols = isFixed ? ['#00e5ff', '#00e5ff99', '#00e5ff44'] : ['#ff5f57','#febc2e','#28c840'];
  dotCols.forEach((c, i) => {
    ctx.beginPath(); ctx.arc(x + (8 + i * 11) * dpr, y + tbH/2, 3.5*dpr, 0, Math.PI*2);
    ctx.fillStyle = c; ctx.fill();
  });

  // Title text
  ctx.font = `${7*dpr}px "JetBrains Mono",monospace`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = isFixed ? 'rgba(0,229,255,0.8)' : (isBroken ? `rgba(220,180,180,${0.6 + 0.2*Math.sin(t*3+def.id)})` : 'rgba(200,200,220,0.6)');
  ctx.fillText(def.title, x + w/2, y + tbH/2);

  // Content rows
  const rowY = y + tbH + 4*dpr;
  const rowH = (h - tbH - 8*dpr) / 4;
  for (let r2 = 0; r2 < 4; r2++) {
    const ry = rowY + r2 * rowH;
    if (ry + rowH > y + h - 4*dpr) break;
    if (!isFixed && r2 % 2 === 0) {
      ctx.fillStyle = 'rgba(255,50,50,0.04)';
      ctx.fillRect(x + 6*dpr, ry, w - 12*dpr, rowH - 2*dpr);
    }
    ctx.font = `${6*dpr}px "JetBrains Mono",monospace`;
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    const rowAlpha = isFixed ? 0.55 : (isBroken ? 0.3 + 0.1 * Math.sin(t*2+r2) : 0.4);
    ctx.fillStyle = isFixed ? `rgba(0,229,255,${rowAlpha})` : `rgba(220,180,180,${rowAlpha})`;

    const rowContent = getRowContent(def.id, r2, isFixed);
    ctx.fillText(rowContent, x + 8*dpr, ry + rowH/2);

    if (!isFixed) {
      // Error dot
      ctx.beginPath(); ctx.arc(x + w - 10*dpr, ry + rowH/2, 2.5*dpr, 0, Math.PI*2);
      ctx.fillStyle = `rgba(255,80,80,${0.4 + 0.3*Math.sin(t*4+r2)})`; ctx.fill();
    }
  }

  // Error badge (top-right, broken only)
  if (isBroken) {
    const pulse = 0.7 + 0.3 * Math.sin(t * 4 + def.id);
    ctx.beginPath(); ctx.arc(x + w - 5*dpr, y + 5*dpr, 6*dpr, 0, Math.PI*2);
    ctx.fillStyle = `rgba(255,60,60,${pulse})`; ctx.fill();
    ctx.font = `bold ${6.5*dpr}px "JetBrains Mono",monospace`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff'; ctx.fillText('!', x + w - 5*dpr, y + 5*dpr);
  }

  // Fix progress bar
  if (fixPct > 0.02 && fixPct < 0.98) {
    const barY = y + h - 3*dpr;
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    ctx.fillRect(x, barY, w, 3*dpr);
    ctx.fillStyle = `rgba(${Math.round(lerp(255,0,fixPct))},${Math.round(lerp(50,229,fixPct))},${Math.round(lerp(50,255,fixPct))},0.85)`;
    ctx.fillRect(x, barY, w * fixPct, 3*dpr);
  }

  // Fixed checkmark
  if (isFixed) {
    ctx.save(); ctx.translate(x + w - 12*dpr, y + 12*dpr);
    ctx.beginPath(); ctx.arc(0, 0, 7*dpr, 0, Math.PI*2);
    ctx.fillStyle = 'rgba(0,229,255,0.15)'; ctx.fill();
    ctx.strokeStyle = '#00e5ff'; ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-3*dpr, 0); ctx.lineTo(-0.5*dpr, 2.5*dpr); ctx.lineTo(3.5*dpr, -2.5*dpr);
    ctx.stroke(); ctx.restore();
  }
}

function getRowContent(winId: number, row: number, fixed: boolean): string {
  const email = ['Silvia B.  — Offerta urgente','Marco R.  — Fattura #223','Team      — Report settimana','Luca M.   — Riunione ore 15'];
  const excel = ['=SUM(B2:B48)','=VLOOKUP(#REF!)','Q4 Target: —','Delta: #ERR'];
  const excelOk = ['Q1: €42.800','Q2: €51.200','Q3: €48.600','Q4: €59.100'];
  const chat = ['Maria: dov\'è il report?','Cliente A: ancora niente','Fornitore: risposta?','(non risposto da 2gg)'];
  const inv = ['#2241  €3.200  SCADUTA','#2242  €1.850  SCADUTA','#2243  €4.100  PENDENTE','#2244  €980    PAGATA'];
  const invOk = ['#2241  €3.200  ✓','#2242  €1.850  ✓','#2243  €4.100  →','#2244  €980    ✓'];
  const cal = ['09:00  Riunione (2 conflit)','11:00  Call — DOPPIO','14:00  Review (+3 pendenti)','15:30  Scadenza URGENTE'];
  const calOk = ['09:00  Riunione confermata','11:00  Call organizzato','14:00  Review pianificato','15:30  Promemoria attivo'];
  const crm = ['Lead 203  — non contattati','Pipeline: €0 settimana','Follow-up: 0 / 47 fatti','Conversione: 0.0%'];
  const crmOk = ['Lead 203  — in nurturing','Pipeline: €84.200','Follow-up: 41 / 47 ✓','Conversione: 18.4%'];
  const tables = fixed
    ? [email, excelOk, chat, invOk, calOk, crmOk]
    : [email, excel, chat, inv, cal, crm];
  return tables[winId]?.[row] ?? '—';
}

/** 3 superhero agents. */
function drawAgents(
  ctx: CanvasRenderingContext2D,
  ax: number, ay: number, aw: number, ah: number,
  p: number, t: number, dpr: number,
  scene: { name: SceneName; local: number },
) {
  // Agent target positions (above their assigned windows)
  const cols = 3; const padX = aw * 0.03; const gapX = aw * 0.025;
  const winW = (aw - padX * 2 - gapX * (cols - 1)) / cols;

  const idlePositions = [
    { x: ax + padX + winW * 0.5,          y: ay + ah * 0.78 },
    { x: ax + padX + winW * 1.5 + gapX,   y: ay + ah * 0.78 },
    { x: ax + padX + winW * 2.5 + gapX*2, y: ay + ah * 0.78 },
  ];

  AGENT_NAMES.forEach((name, i) => {
    const color = AGENT_COLORS[i];
    let appear = 0;

    if (scene.name === 'arrival') {
      appear = clamp((scene.local - i * 0.2) / 0.25, 0, 1);
    } else if (['work','clarity','services','method','metrics','cta'].includes(scene.name)) {
      appear = 1;
    }
    if (appear <= 0) return;

    let agX = idlePositions[i].x;
    let agY = idlePositions[i].y;

    // In work scene: agent moves above their target window
    if (scene.name === 'work') {
      const targetWinIdx = i * 2; // each agent handles 2 windows
      const fixProgress = clamp(scene.local * 6 - targetWinIdx, 0, 1);
      const nextWinIdx = targetWinIdx + 1;
      const nextFix = clamp(scene.local * 6 - nextWinIdx, 0, 1);

      if (fixProgress < 1) {
        const col = targetWinIdx % cols; const row = Math.floor(targetWinIdx / cols);
        const twinX = ax + padX + col * (winW + gapX) + winW * 0.5;
        const twinY = ay + (row === 0 ? ah * 0.24 : ah * 0.56);
        agX = lerp(idlePositions[i].x, twinX, eout(fixProgress));
        agY = lerp(idlePositions[i].y, twinY, eout(fixProgress));
      } else if (nextFix < 1) {
        const col = nextWinIdx % cols; const row = Math.floor(nextWinIdx / cols);
        const twinX = ax + padX + col * (winW + gapX) + winW * 0.5;
        const twinY = ay + (row === 0 ? ah * 0.24 : ah * 0.56);
        agX = lerp(idlePositions[i].x, twinX, eout(nextFix));
        agY = lerp(idlePositions[i].y, twinY, eout(nextFix));
      }
    }

    // Gentle hover bob
    const bob = Math.sin(t * 1.8 + i * 1.1) * 3 * dpr;
    drawSuperAgent(ctx, agX, agY + bob, color, name, AGENT_ROLES[i], appear, scene.name === 'work', t, dpr);
  });
}

function drawSuperAgent(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  color: string, name: string, role: string,
  appear: number, isWorking: boolean, t: number, dpr: number,
) {
  const sz = 20 * dpr;
  ctx.save(); ctx.globalAlpha = appear; ctx.translate(x, y);

  // Entry burst
  if (appear < 0.6) {
    const br = sz * 4 * (1 - appear);
    const bg = ctx.createRadialGradient(0, 0, 0, 0, 0, br);
    bg.addColorStop(0, color + '50'); bg.addColorStop(1, color + '00');
    ctx.beginPath(); ctx.arc(0, 0, br, 0, Math.PI * 2);
    ctx.fillStyle = bg; ctx.fill();
  }

  // CAPE
  ctx.beginPath();
  ctx.moveTo(-sz * 0.38, -sz * 0.3);
  ctx.bezierCurveTo(-sz * 1.1, sz * 0.4, -sz * 0.85, sz * 1.7, -sz * 0.1, sz * 1.55);
  ctx.lineTo(sz * 0.1, sz * 1.55);
  ctx.bezierCurveTo(sz * 0.85, sz * 1.7, sz * 1.1, sz * 0.4, sz * 0.38, -sz * 0.3);
  ctx.closePath();
  const cg = ctx.createLinearGradient(0, -sz*0.3, 0, sz*1.55);
  cg.addColorStop(0, color + 'aa'); cg.addColorStop(0.6, color + '44'); cg.addColorStop(1, color + '00');
  ctx.fillStyle = cg; ctx.fill();

  // BODY (armored torso)
  ctx.beginPath();
  ctx.moveTo(-sz*0.42, -sz*0.35); ctx.lineTo(-sz*0.28, sz*0.44);
  ctx.lineTo(sz*0.28, sz*0.44); ctx.lineTo(sz*0.42, -sz*0.35);
  ctx.closePath();
  const body = ctx.createLinearGradient(-sz*0.4, -sz*0.3, sz*0.4, sz*0.4);
  body.addColorStop(0, color + 'dd'); body.addColorStop(0.5, color + 'ff'); body.addColorStop(1, color + 'aa');
  ctx.fillStyle = body; ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.22)'; ctx.lineWidth = dpr; ctx.stroke();

  // Chest emblem
  ctx.font = `bold ${8*dpr}px monospace`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.fillText(role.charAt(0), 0, sz * 0.06);

  // HEAD (helmet)
  const headY = -sz * 0.72;
  ctx.beginPath(); ctx.arc(0, headY, sz*0.3, 0, Math.PI*2);
  ctx.fillStyle = color + 'dd'; ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 1.2*dpr; ctx.stroke();

  // Visor (scanning eye)
  const visA = t * (isWorking ? 4 : 1.5);
  ctx.beginPath(); ctx.arc(0, headY, sz*0.17, visA - 0.65, visA + 0.65);
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.2*dpr; ctx.stroke();

  // ARMS
  const armSway = isWorking ? Math.sin(t * 5 + 0.3) * 0.4 : 0.25;
  [[-1, -0.4], [1, 0.4]].forEach(([side, off]) => {
    ctx.save(); ctx.rotate((off + armSway * side) as number);
    ctx.beginPath();
    ctx.roundRect(side < 0 ? -sz*0.46 : sz*0.3, -sz*0.28, sz*0.16, sz*0.48, 3*dpr);
    ctx.fillStyle = color + 'cc'; ctx.fill(); ctx.restore();
  });

  // LEGS
  [-0.15, 0.15].forEach(ox => {
    ctx.beginPath(); ctx.roundRect(ox*sz - sz*0.09, sz*0.42, sz*0.18, sz*0.48, 3*dpr);
    ctx.fillStyle = color + 'aa'; ctx.fill();
  });

  // OUTER GLOW
  const og = ctx.createRadialGradient(0, 0, sz*0.3, 0, 0, sz*2.4);
  og.addColorStop(0, color + '18'); og.addColorStop(1, color + '00');
  ctx.beginPath(); ctx.arc(0, 0, sz*2.4, 0, Math.PI*2);
  ctx.fillStyle = og; ctx.fill();

  // Work particles
  if (isWorking) {
    for (let i = 0; i < 5; i++) {
      const pa = t * 2.5 + i * Math.PI * 0.4;
      const pr = sz * (0.9 + Math.sin(t * 3 + i) * 0.25);
      ctx.beginPath(); ctx.arc(Math.cos(pa)*pr, Math.sin(pa)*pr - sz*0.1, 1.8*dpr, 0, Math.PI*2);
      ctx.fillStyle = color + 'cc'; ctx.fill();
    }
  }

  // Name tag
  ctx.font = `bold ${7.5*dpr}px "JetBrains Mono",monospace`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillStyle = color + 'cc'; ctx.fillText(name, 0, sz * 1.08);
  ctx.font = `${6*dpr}px "JetBrains Mono",monospace`;
  ctx.fillStyle = color + '55'; ctx.fillText(role, 0, sz * 1.21);

  ctx.restore();
}

/** Main render entry point — called every frame. */
function renderFrame(
  ctx: CanvasRenderingContext2D,
  p: number, t: number, w: number, h: number, dpr: number,
) {
  const scale = monitorScale(p);
  const scene = getScene(p);
  const isInside = scale > 1.8;
  const starAlpha = clamp(1 - (scale - 0.2) / 1.2, 0, 1);

  // BG
  ctx.fillStyle = '#040410'; ctx.fillRect(0, 0, w, h);

  drawStars(ctx, w, h, t, starAlpha);

  // Atmospheric glow when "inside"
  if (isInside) {
    const mood = ['chaos','arrival'].includes(scene.name) ? '80,20,20' : '0,60,100';
    const ag = ctx.createRadialGradient(w/2, h/2, 0, w/2, h/2, w * 0.5);
    ag.addColorStop(0, `rgba(${mood},0.08)`); ag.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = ag; ctx.fillRect(0, 0, w, h);
  }

  // Monitor (with zoom transform)
  const cx = w / 2; const cy = h / 2;
  ctx.save();
  ctx.translate(cx, cy); ctx.scale(scale, scale); ctx.translate(-cx, -cy);

  const isClean = ['clarity','services','method','metrics','cta'].includes(scene.name);
  const { sx, sy, sw, sh } = drawMonitorFrame(ctx, cx, cy, w, h, dpr, isClean);

  // Desktop inside screen
  if (scene.name !== 'intro') {
    drawDesktop(ctx, sx, sy, sw, sh, p, t, dpr);
  } else {
    // Blank screen glow in intro
    ctx.beginPath(); ctx.roundRect(sx, sy, sw, sh, 4*dpr);
    ctx.fillStyle = 'rgba(0,229,255,0.04)'; ctx.fill();
  }

  ctx.restore();

  // Vignette when inside (hides monitor edges)
  if (isInside) {
    const vigAlpha = clamp((scale - 1.8) / 1.5, 0, 0.9);
    const vig = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.55);
    vig.addColorStop(0, 'rgba(4,4,16,0)'); vig.addColorStop(0.7, 'rgba(4,4,16,0)');
    vig.addColorStop(1, `rgba(4,4,16,${vigAlpha})`);
    ctx.fillStyle = vig; ctx.fillRect(0, 0, w, h);
  }
}

/* ═══════════════════════════════════════════════════════════
   TEXT OVERLAY DATA
═══════════════════════════════════════════════════════════ */
interface SceneText { l1: string; l2: string; sub: string }
const SCENE_TEXT: Record<SceneName, SceneText> = {
  intro:    { l1: 'Luce',       l2: 'AI.',         sub: 'Automazione intelligente\nper PMI italiane.' },
  approach: { l1: '',           l2: '',             sub: '' },
  chaos:    { l1: 'Caos',       l2: 'operativo.',  sub: '847 email. 12 fatture scadute.\n8 conflitti. Nessun sistema.' },
  arrival:  { l1: 'I nostri',   l2: 'agenti.',     sub: 'NEXUS analizza. FORGE costruisce.\nLINK connette.' },
  work:     { l1: 'Stiamo',     l2: 'sistemando.', sub: 'Ogni tool riparato in sequenza.\nIl caos diventa sistema.' },
  clarity:  { l1: 'Chiarezza',  l2: 'totale.',     sub: 'Tutti i processi connessi.\nTutto sotto controllo.' },
  services: { l1: 'Cosa',       l2: 'costruiamo.', sub: '' },
  method:   { l1: 'Il nostro',  l2: 'metodo.',     sub: '' },
  metrics:  { l1: 'Risultati',  l2: 'concreti.',   sub: '' },
  cta:      { l1: 'Iniziamo',   l2: 'insieme.',    sub: '' },
};

/* ═══════════════════════════════════════════════════════════
   SERVICE CARDS (HTML overlay in services scene)
═══════════════════════════════════════════════════════════ */
const SERVICE_CARDS = [
  { icon: '✉', title: 'Automazione Email', desc: 'Smistamento, risposte automatiche, follow-up.' },
  { icon: '⊞', title: 'Dashboard & Report', desc: 'Dati in tempo reale, sempre aggiornati.' },
  { icon: '◉', title: 'Chatbot AI', desc: 'Risposte immediate su WhatsApp e web.' },
  { icon: '₿', title: 'Gestione Fatture', desc: 'Emissione, solleciti e riconciliazione auto.' },
  { icon: '▦', title: 'Pianificazione AI', desc: 'Zero conflitti, agenda ottimizzata.' },
  { icon: '◈', title: 'CRM Intelligente', desc: 'Pipeline, lead e clienti senza sforzo.' },
];

const METHOD_STEPS = [
  { n: '01', title: 'Scoperta', desc: 'Osserviamo come lavori davvero.' },
  { n: '02', title: 'Diagnosi', desc: 'Mappiamo frizioni e colli di bottiglia.' },
  { n: '03', title: 'Co-design', desc: 'Progettiamo insieme la soluzione.' },
  { n: '04', title: 'Build & Go', desc: 'Realizziamo, formiamo, supportiamo.' },
];

const STAT_CARDS = [
  { value: 40, suffix: '%', label: 'Tempo risparmiato', color: '#00e5ff' },
  { value: 70, suffix: '%', label: 'Errori eliminati',  color: '#a855f7' },
  { value: 3,  suffix: 'x', label: 'Più visibilità',   color: '#60a5fa' },
  { value: 100,suffix: '%', label: 'Supporto attivo',  color: '#34d399' },
];

/* ═══════════════════════════════════════════════════════════
   COMPONENT
═══════════════════════════════════════════════════════════ */
export default function LuceAIExperience() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);
  const progressRef = useRef(0);

  const [scene, setScene] = useState<SceneName>('intro');
  const [statValues, setStatValues] = useState([0, 0, 0, 0]);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    progressRef.current = v;
    const s = getScene(v);
    setScene(s.name);

    // Animate stat counters
    if (s.name === 'metrics') {
      setStatValues(STAT_CARDS.map(c => Math.round(c.value * eout(s.local))));
    }
  });

  const resize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
  }, []);

  useEffect(() => {
    resize();
    window.addEventListener('resize', resize);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const tick = (now: number) => {
      const dpr = window.devicePixelRatio || 1;
      renderFrame(ctx, progressRef.current, now / 1000, canvas.width, canvas.height, dpr);
      frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [resize]);

  const txt = SCENE_TEXT[scene];
  const showText = txt.l1 !== '';
  const showServices = scene === 'services';
  const showMethod = scene === 'method';
  const showMetrics = scene === 'metrics';
  const showCTA = scene === 'cta';

  return (
    <div ref={containerRef} style={{ height: '1400vh' }}>
      <div className="sticky top-0 overflow-hidden" style={{ height: '100svh' }}>
        {/* Canvas */}
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

        {/* Scene label — top-right */}
        <AnimatePresence mode="wait">
          {showText && (
            <motion.div
              key={scene + '-label'}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="absolute top-8 right-10 z-20 text-right hidden md:block"
            >
              <p className="font-mono text-[9px] tracking-[0.25em] text-white/25 uppercase">
                {String(Object.keys(SCENES).indexOf(scene) + 1).padStart(2, '0')} — {scene}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main text — bottom left */}
        <AnimatePresence mode="wait">
          {showText && (
            <motion.div
              key={scene}
              initial={{ opacity: 0, y: 48, filter: 'blur(10px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.75, ease: 'easeOut' } }}
              exit={{ opacity: 0, y: -32, filter: 'blur(8px)', transition: { duration: 0.4 } }}
              className="absolute bottom-0 left-0 z-20 px-10 md:px-16 pb-20 md:pb-16 max-w-2xl pointer-events-none"
            >
              <h2 className="font-black leading-[0.87] tracking-tight text-white"
                style={{ fontSize: 'clamp(44px, 8vw, 118px)' }}>
                {txt.l1}
              </h2>
              <h2 className="font-black leading-[0.87] tracking-tight mb-5"
                style={{ fontSize: 'clamp(44px, 8vw, 118px)', color: '#00e5ff' }}>
                {txt.l2}
              </h2>
              {txt.sub && (
                <p className="text-sm text-white/45 leading-relaxed whitespace-pre-line max-w-xs">
                  {txt.sub}
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* SERVICES OVERLAY */}
        <AnimatePresence>
          {showServices && (
            <motion.div
              key="services"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 z-20 flex flex-col justify-end pb-8 pointer-events-none"
            >
              <div className="px-10 md:px-16 pb-8">
                <p className="font-mono text-[9px] tracking-[0.25em] text-white/30 mb-3 uppercase">Servizi</p>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-3 max-w-4xl">
                  {SERVICE_CARDS.map((s, i) => (
                    <motion.div
                      key={s.title}
                      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.07, duration: 0.5, ease: 'easeOut' }}
                      className="rounded-xl p-3 text-center"
                      style={{ background: 'rgba(0,229,255,0.05)', border: '1px solid rgba(0,229,255,0.12)' }}
                    >
                      <div className="text-lg mb-1" style={{ color: '#00e5ff' }}>{s.icon}</div>
                      <div className="font-mono text-[7px] text-white/70 leading-tight">{s.title}</div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* METHOD OVERLAY */}
        <AnimatePresence>
          {showMethod && (
            <motion.div
              key="method"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 z-20 flex flex-col justify-end pb-8 pointer-events-none"
            >
              <div className="px-10 md:px-16 pb-8">
                <p className="font-mono text-[9px] tracking-[0.25em] text-white/30 mb-4 uppercase">Metodo</p>
                <div className="flex gap-4">
                  {METHOD_STEPS.map((s, i) => (
                    <motion.div key={s.n}
                      initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.12, duration: 0.5 }}
                      className="flex-1 rounded-xl p-4"
                      style={{ background: 'rgba(0,0,10,0.7)', border: '1px solid rgba(0,229,255,0.15)' }}
                    >
                      <p className="font-mono text-[8px] text-accent/50 mb-1">{s.n}</p>
                      <p className="text-sm font-bold text-white mb-1">{s.title}</p>
                      <p className="text-[10px] text-white/45 leading-tight">{s.desc}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* METRICS OVERLAY */}
        <AnimatePresence>
          {showMetrics && (
            <motion.div
              key="metrics"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none"
            >
              <div className="grid grid-cols-2 md:grid-cols-4 gap-5 px-10">
                {STAT_CARDS.map((s, i) => (
                  <motion.div key={s.label}
                    initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.12, duration: 0.6, ease: 'easeOut' }}
                    className="rounded-2xl p-6 text-center"
                    style={{ background: 'rgba(4,4,18,0.85)', border: `1px solid ${s.color}30` }}
                  >
                    <div className="font-black mb-1 tabular-nums" style={{ fontSize: 'clamp(36px,5vw,64px)', color: s.color }}>
                      {statValues[i]}{s.suffix}
                    </div>
                    <div className="font-mono text-[9px] text-white/45 tracking-wide uppercase">{s.label}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* CTA OVERLAY */}
        <AnimatePresence>
          {showCTA && (
            <motion.div
              key="cta"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 z-20 flex flex-col items-center justify-end pb-24 pointer-events-auto"
            >
              <motion.h2
                initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.8, ease: 'easeOut' }}
                className="font-black text-center mb-3 tracking-tight text-white"
                style={{ fontSize: 'clamp(44px, 8vw, 118px)', lineHeight: 0.88 }}
              >
                Iniziamo<br /><span style={{ color: '#00e5ff' }}>insieme.</span>
              </motion.h2>
              <motion.p
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
                className="text-sm text-white/45 mb-8 text-center max-w-xs"
              >
                Non una soluzione preconfezionata.<br />Un sistema costruito su di te.
              </motion.p>
              <motion.a
                href="#form-contatto"
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                onClick={(e) => { e.preventDefault(); document.querySelector('#form-contatto')?.scrollIntoView({ behavior: 'smooth' }); }}
                className="inline-flex items-center gap-3 px-9 py-4 rounded-xl text-sm font-semibold"
                style={{
                  border: '1px solid rgba(0,229,255,0.45)',
                  color: '#00e5ff',
                  background: 'rgba(0,229,255,0.08)',
                  boxShadow: '0 0 28px rgba(0,229,255,0.12)',
                }}
                whileHover={{ boxShadow: '0 0 40px rgba(0,229,255,0.25)', scale: 1.02 }}
              >
                Prenota una sessione
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </motion.a>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Right-edge scene dots */}
        <div className="absolute right-5 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-3">
          {(Object.keys(SCENES) as SceneName[]).map((s, i) => (
            <div key={s} className="flex items-center justify-end gap-2">
              <span className={`font-mono text-[7px] tracking-widest transition-all duration-400 hidden md:block ${scene === s ? 'text-accent/50' : 'text-white/15'}`}>
                {String(i+1).padStart(2,'0')}
              </span>
              <span className={`rounded-full transition-all duration-400 ${scene === s ? 'w-5 h-1.5 bg-accent' : 'w-1.5 h-1.5 bg-white/20'}`} />
            </div>
          ))}
        </div>

        {/* Scroll hint — first scene only */}
        <AnimatePresence>
          {scene === 'intro' && (
            <motion.div
              key="scrollhint"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ delay: 1.2 }}
              className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 pointer-events-none"
            >
              <span className="font-mono text-[8px] tracking-widest text-white/25 uppercase">Scorri per entrare</span>
              <motion.div animate={{ y: [0, 7, 0] }} transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
                className="w-px h-8 bg-gradient-to-b from-white/25 to-transparent" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
