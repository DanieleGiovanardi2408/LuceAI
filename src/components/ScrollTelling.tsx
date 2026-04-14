'use client';

import { useRef, useEffect, useCallback } from 'react';
import { motion, useScroll, useTransform, useMotionValueEvent, MotionValue } from 'framer-motion';
import { SCROLL_PHASES } from '@/lib/constants';

export default function ScrollTelling() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const progressRef = useRef(0);
  const frameRef = useRef<number>(0);
  const nodesRef = useRef<Array<{
    x: number; y: number; tx: number; ty: number;
    vx: number; vy: number; label: string; opacity: number;
  }>>([]);
  const connsRef = useRef<Array<{ a: number; b: number }>>([]);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end end'],
  });

  const currentPhase = useTransform(scrollYProgress, [0, 0.25, 0.5, 0.75, 1], [0, 0, 1, 2, 3]);

  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    progressRef.current = v;
  });

  const LABELS = ['EMAIL', 'EXCEL', 'WHATSAPP', 'TELEFONATE', 'PDF', 'CALENDARIO', 'APPUNTI', 'MODULI', 'FATTURE', 'CRM', 'ORDINI', 'REPORT'];

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const container = canvas.parentElement;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;

    const nodes: typeof nodesRef.current = [];
    const cols = 4;
    const rows = 3;
    const sx = Math.min(w * 0.14, 170 * dpr);
    const sy = Math.min(h * 0.16, 130 * dpr);

    LABELS.forEach((label, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      nodes.push({
        x: Math.random() * w * 0.8 + w * 0.1,
        y: Math.random() * h * 0.8 + h * 0.1,
        tx: cx + (col - (cols - 1) / 2) * sx,
        ty: cy + (row - (rows - 1) / 2) * sy,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        label,
        opacity: 0.4,
      });
    });
    nodesRef.current = nodes;

    const conns: typeof connsRef.current = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        if (Math.random() < 0.35) conns.push({ a: i, b: j });
      }
    }
    connsRef.current = conns;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    initCanvas();
    window.addEventListener('resize', initCanvas);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;

    const animate = () => {
      const w = canvas.width;
      const h = canvas.height;
      const p = progressRef.current;
      ctx.clearRect(0, 0, w, h);

      const phase = p < 0.25 ? 0 : p < 0.5 ? 1 : p < 0.75 ? 2 : 3;
      const pp = ((p % 0.25) / 0.25);
      const nodes = nodesRef.current;
      const conns = connsRef.current;

      // Update nodes
      nodes.forEach((n, i) => {
        if (phase === 0) {
          n.vx += (Math.random() - 0.5) * 0.6;
          n.vy += (Math.random() - 0.5) * 0.6;
          n.vx *= 0.94;
          n.vy *= 0.94;
          n.x += n.vx;
          n.y += n.vy;
          if (n.x < 40 || n.x > w - 40) n.vx *= -1;
          if (n.y < 40 || n.y > h - 40) n.vy *= -1;
          n.x = Math.max(40, Math.min(w - 40, n.x));
          n.y = Math.max(40, Math.min(h - 40, n.y));
          n.opacity = 0.25 + Math.sin(Date.now() * 0.003 + i) * 0.15;
        } else if (phase === 1) {
          n.vx *= 0.9;
          n.vy *= 0.9;
          n.x += n.vx;
          n.y += n.vy;
          n.opacity = 0.4 + pp * 0.3;
        } else if (phase === 2) {
          const ease = pp < 0.5 ? 2 * pp * pp : 1 - Math.pow(-2 * pp + 2, 2) / 2;
          n.x += (n.tx - n.x) * ease * 0.06;
          n.y += (n.ty - n.y) * ease * 0.06;
          n.vx = 0; n.vy = 0;
          n.opacity = 0.6 + pp * 0.4;
        } else {
          const fx = Math.sin(Date.now() * 0.0008 + i * 0.7) * 3;
          const fy = Math.cos(Date.now() * 0.001 + i * 0.5) * 3;
          n.x += (n.tx + fx - n.x) * 0.08;
          n.y += (n.ty + fy - n.y) * 0.08;
          n.opacity = 1;
        }
      });

      // Grid (grows with phase)
      const go = phase * 0.02 + (phase >= 2 ? pp * 0.02 : 0);
      if (go > 0) {
        ctx.strokeStyle = `rgba(0, 229, 255, ${Math.min(go, 0.06)})`;
        ctx.lineWidth = 0.5;
        const gs = 60 * dpr;
        for (let x = 0; x < w; x += gs) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
        for (let y = 0; y < h; y += gs) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
      }

      // Connections
      conns.forEach(c => {
        const a = nodes[c.a], b = nodes[c.b];
        if (!a || !b) return;
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        const maxD = phase >= 2 ? w * 0.6 : w * 0.22;
        if (d > maxD) return;

        let alpha = 0;
        if (phase === 0) alpha = d < 100 * dpr ? 0.04 : 0;
        else if (phase === 1) alpha = 0.05 + pp * 0.1;
        else if (phase === 2) alpha = 0.12 + pp * 0.15;
        else alpha = 0.25;

        if (alpha <= 0) return;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);

        if (phase >= 2) {
          const gr = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
          gr.addColorStop(0, `rgba(0, 229, 255, ${alpha})`);
          gr.addColorStop(0.5, `rgba(124, 58, 237, ${alpha * 0.6})`);
          gr.addColorStop(1, `rgba(0, 229, 255, ${alpha})`);
          ctx.strokeStyle = gr;
        } else {
          ctx.strokeStyle = `rgba(0, 229, 255, ${alpha})`;
        }
        ctx.lineWidth = phase >= 3 ? 1.5 : 1;
        ctx.stroke();

        // Signal pulses
        if (phase >= 2) {
          const sp = (Date.now() * 0.0008 + c.a * 0.3) % 1;
          const px = a.x + (b.x - a.x) * sp;
          const py = a.y + (b.y - a.y) * sp;
          ctx.beginPath();
          ctx.arc(px, py, 2 * dpr, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(0, 229, 255, ${alpha * 1.5})`;
          ctx.fill();
        }
      });

      // Nodes
      nodes.forEach(n => {
        // Glow
        const gr = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, (phase >= 2 ? 24 : 14) * dpr);
        gr.addColorStop(0, `rgba(0, 229, 255, ${n.opacity * 0.25})`);
        gr.addColorStop(1, 'rgba(0, 229, 255, 0)');
        ctx.beginPath();
        ctx.arc(n.x, n.y, (phase >= 2 ? 24 : 14) * dpr, 0, Math.PI * 2);
        ctx.fillStyle = gr;
        ctx.fill();

        // Dot
        ctx.beginPath();
        ctx.arc(n.x, n.y, (phase >= 3 ? 5 : 3.5) * dpr, 0, Math.PI * 2);
        ctx.fillStyle = phase >= 3
          ? `rgba(0, 229, 255, ${n.opacity})`
          : `rgba(232, 234, 237, ${n.opacity})`;
        ctx.fill();

        // Label
        if (phase >= 2) {
          const lo = phase === 2 ? pp * 0.5 : 0.55;
          ctx.font = `${9 * dpr}px "JetBrains Mono", monospace`;
          ctx.fillStyle = `rgba(0, 229, 255, ${lo})`;
          ctx.textAlign = 'center';
          ctx.fillText(n.label, n.x, n.y + 20 * dpr);
        }
      });

      // Center glow discovery
      if (phase === 1) {
        const r = pp * Math.min(w, h) * 0.35;
        const cg = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, r);
        cg.addColorStop(0, `rgba(0, 229, 255, ${0.06 * pp})`);
        cg.addColorStop(0.6, `rgba(124, 58, 237, ${0.03 * pp})`);
        cg.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.beginPath();
        ctx.arc(w / 2, h / 2, r, 0, Math.PI * 2);
        ctx.fillStyle = cg;
        ctx.fill();
      }

      // Scan line discovery
      if (phase === 1) {
        const sy = ((Date.now() * 0.0003) % 1) * h;
        ctx.fillStyle = `rgba(0, 229, 255, ${0.025 * pp})`;
        ctx.fillRect(0, sy - 60 * dpr, w, 120 * dpr);
      }

      // Dashboard frame in clarity
      if (phase === 3) {
        const margin = 40 * dpr;
        ctx.strokeStyle = `rgba(0, 229, 255, ${0.1 + pp * 0.05})`;
        ctx.lineWidth = 1;
        ctx.setLineDash([8 * dpr, 4 * dpr]);
        ctx.strokeRect(margin, margin, w - margin * 2, h - margin * 2);
        ctx.setLineDash([]);

        // Corner brackets
        const cLen = 20 * dpr;
        const corners = [
          [margin, margin], [w - margin, margin],
          [margin, h - margin], [w - margin, h - margin],
        ];
        ctx.strokeStyle = `rgba(0, 229, 255, ${0.3})`;
        ctx.lineWidth = 2;
        corners.forEach(([cx, cy]) => {
          const sx = cx === margin ? 1 : -1;
          const syt = cy === margin ? 1 : -1;
          ctx.beginPath();
          ctx.moveTo(cx + sx * cLen, cy);
          ctx.lineTo(cx, cy);
          ctx.lineTo(cx, cy + syt * cLen);
          ctx.stroke();
        });
      }

      frameRef.current = requestAnimationFrame(animate);
    };

    animate();
    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener('resize', initCanvas);
    };
  }, [initCanvas]);

  return (
    <section ref={sectionRef} className="relative" style={{ height: '400vh' }}>
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        {/* Canvas */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          style={{ background: '#0a0a0f' }}
        />

        {/* Noise */}
        <div className="absolute inset-0 noise pointer-events-none" />

        {/* Phase Text Panels */}
        {SCROLL_PHASES.map((phase, i) => (
          <PhasePanel
            key={phase.id}
            phase={phase}
            index={i}
            scrollProgress={scrollYProgress}
          />
        ))}

        {/* Phase Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 z-20">
          {SCROLL_PHASES.map((phase, i) => (
            <PhaseIndicator key={phase.id} index={i} currentPhase={currentPhase} label={phase.label} />
          ))}
        </div>
      </div>
    </section>
  );
}

function PhasePanel({
  phase,
  index,
  scrollProgress,
}: {
  phase: typeof SCROLL_PHASES[number];
  index: number;
  scrollProgress: MotionValue<number>;
}) {
  const start = index * 0.25;
  const end = (index + 1) * 0.25;
  const mid = start + 0.05;
  const fadeOut = end - 0.05;

  const opacity = useTransform(
    scrollProgress,
    [start, mid, fadeOut, end],
    [0, 1, 1, 0]
  );
  const y = useTransform(
    scrollProgress,
    [start, mid, fadeOut, end],
    [40, 0, 0, -20]
  );

  const isLeft = index % 2 === 0;

  return (
    <motion.div
      style={{ opacity, y }}
      className={`absolute top-1/2 -translate-y-1/2 z-20 max-w-sm px-6 ${isLeft ? 'left-6 md:left-12 lg:left-20' : 'right-6 md:right-12 lg:right-20'}`}
    >
      <div className="space-y-4">
        <span className="hud-label text-accent/60">{phase.label}</span>
        <h3 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
          {phase.title}
        </h3>
        <p className="text-sm md:text-base text-muted leading-relaxed">
          {phase.description}
        </p>
      </div>
    </motion.div>
  );
}

function PhaseIndicator({
  index,
  currentPhase,
  label,
}: {
  index: number;
  currentPhase: MotionValue<number>;
  label: string;
}) {
  const isActive = useTransform(currentPhase, (v: number) => Math.round(v) >= index);
  const opacity = useTransform(isActive, (v: boolean) => (v ? 1 : 0.3));
  const scale = useTransform(currentPhase, (v: number) => (Math.round(v) === index ? 1.3 : 1));

  return (
    <motion.div
      style={{ opacity, scale }}
      className="flex items-center gap-2"
      title={label}
    >
      <div className="w-2 h-2 rounded-full bg-accent" />
    </motion.div>
  );
}
