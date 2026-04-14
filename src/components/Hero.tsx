'use client';

import { useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { HERO_COPY, EASING } from '@/lib/constants';

export default function Hero() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const frameRef = useRef<number>(0);
  const particlesRef = useRef<Array<{
    x: number; y: number; vx: number; vy: number;
    size: number; opacity: number; speed: number;
  }>>([]);
  const beamsRef = useRef<Array<{
    x: number; angle: number; width: number; opacity: number; speed: number;
  }>>([]);

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    // Create particles
    const particles = [];
    for (let i = 0; i < 80; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.5 + 0.1,
        speed: Math.random() * 0.5 + 0.2,
      });
    }
    particlesRef.current = particles;

    // Create light beams
    const beams = [];
    for (let i = 0; i < 3; i++) {
      beams.push({
        x: Math.random() * canvas.width,
        angle: -Math.PI / 4 + Math.random() * Math.PI / 2,
        width: 60 + Math.random() * 100,
        opacity: 0.02 + Math.random() * 0.03,
        speed: 0.1 + Math.random() * 0.2,
      });
    }
    beamsRef.current = beams;
  }, []);

  useEffect(() => {
    initCanvas();
    window.addEventListener('resize', initCanvas);

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const dpr = window.devicePixelRatio || 1;
      mouseRef.current = {
        x: (e.clientX - rect.left) * dpr,
        y: (e.clientY - rect.top) * dpr,
      };
    };
    window.addEventListener('mousemove', handleMouseMove);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animate = () => {
      const w = canvas.width;
      const h = canvas.height;
      const dpr = window.devicePixelRatio || 1;

      ctx.clearRect(0, 0, w, h);

      // Draw grid
      ctx.strokeStyle = 'rgba(0, 229, 255, 0.04)';
      ctx.lineWidth = 0.5;
      const gridSize = 80 * dpr;
      const offsetX = (Date.now() * 0.01) % gridSize;
      for (let x = -gridSize + offsetX; x < w + gridSize; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Draw light beams
      beamsRef.current.forEach(beam => {
        beam.x += beam.speed;
        if (beam.x > w + 200) beam.x = -200;

        ctx.save();
        ctx.translate(beam.x, 0);
        ctx.rotate(beam.angle);
        const gradient = ctx.createLinearGradient(-beam.width / 2, 0, beam.width / 2, 0);
        gradient.addColorStop(0, 'rgba(0, 229, 255, 0)');
        gradient.addColorStop(0.5, `rgba(0, 229, 255, ${beam.opacity})`);
        gradient.addColorStop(1, 'rgba(0, 229, 255, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(-beam.width / 2, -h, beam.width, h * 3);
        ctx.restore();
      });

      // Draw particles
      particlesRef.current.forEach(p => {
        p.x += p.vx * p.speed;
        p.y += p.vy * p.speed;

        // Mouse influence
        const dx = mouseRef.current.x - p.x;
        const dy = mouseRef.current.y - p.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 200 * dpr) {
          const force = (200 * dpr - dist) / (200 * dpr) * 0.02;
          p.vx += dx * force * 0.01;
          p.vy += dy * force * 0.01;
        }

        p.vx *= 0.99;
        p.vy *= 0.99;

        // Wrap around
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * dpr, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 229, 255, ${p.opacity})`;
        ctx.fill();

        // Draw connections to nearby particles
        particlesRef.current.forEach(p2 => {
          const d = Math.hypot(p.x - p2.x, p.y - p2.y);
          if (d < 120 * dpr && d > 0) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(0, 229, 255, ${0.06 * (1 - d / (120 * dpr))})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });

      // Center radial glow
      const centerGradient = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.4);
      centerGradient.addColorStop(0, 'rgba(0, 229, 255, 0.03)');
      centerGradient.addColorStop(0.5, 'rgba(124, 58, 237, 0.015)');
      centerGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = centerGradient;
      ctx.fillRect(0, 0, w, h);

      frameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener('resize', initCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [initCanvas]);

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30, filter: 'blur(10px)' },
    visible: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: { duration: 0.8, ease: EASING.reveal },
    },
  };

  return (
    <section id="hero" className="relative w-full h-screen min-h-[700px] overflow-hidden flex items-center justify-center">
      {/* Canvas Background */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ background: 'linear-gradient(180deg, #0a0a0f 0%, #0d0d18 50%, #0a0a0f 100%)' }}
      />

      {/* Noise overlay */}
      <div className="absolute inset-0 noise pointer-events-none" />

      {/* Vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 30%, #0a0a0f 80%)',
        }}
      />

      {/* HUD corners */}
      <div className="absolute top-8 left-8 hud-label hidden md:block">
        <span className="opacity-40">SYS.STATUS</span>
        <span className="ml-2 text-accent opacity-60">● ONLINE</span>
      </div>
      <div className="absolute top-8 right-8 hud-label hidden md:block">
        <span className="opacity-40">LUCE.AI v1.0</span>
      </div>
      <div className="absolute bottom-8 left-8 hud-label hidden md:block">
        <span className="opacity-40">LAT 45.4642 · LON 9.1900</span>
      </div>
      <div className="absolute bottom-8 right-8 hud-label hidden md:block">
        <span className="opacity-40">SCROLL ↓</span>
      </div>

      {/* Content */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 text-center px-6 max-w-4xl mx-auto"
      >
        {/* Eyebrow */}
        <motion.div variants={itemVariants} className="mb-6">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-accent/20 bg-accent/5 text-xs font-mono tracking-widest text-accent/80 uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            {HERO_COPY.eyebrow}
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          variants={itemVariants}
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05] mb-6"
        >
          <span className="bg-gradient-to-b from-white via-foreground to-muted bg-clip-text text-transparent">
            {HERO_COPY.headline}
          </span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          variants={itemVariants}
          className="text-base sm:text-lg md:text-xl text-muted max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          {HERO_COPY.subheadline}
        </motion.p>

        {/* CTAs */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="#contatto"
            className="
              group relative px-8 py-3.5 rounded-xl text-sm font-semibold
              bg-accent text-background
              hover:shadow-[0_0_30px_rgba(0,229,255,0.3)]
              transition-all duration-300
              overflow-hidden
            "
          >
            <span className="relative z-10">{HERO_COPY.cta}</span>
            <div className="absolute inset-0 bg-gradient-to-r from-accent via-soft-blue to-accent bg-[length:200%_100%] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </a>
          <a
            href="#metodo"
            className="
              px-8 py-3.5 rounded-xl text-sm font-medium
              border border-border text-foreground/80
              hover:border-accent/30 hover:text-accent
              transition-all duration-300
            "
          >
            {HERO_COPY.ctaSecondary}
          </a>
        </motion.div>
      </motion.div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent pointer-events-none" />
    </section>
  );
}
