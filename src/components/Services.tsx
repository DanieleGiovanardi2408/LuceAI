'use client';

import { useRef, useState } from 'react';
import type { ReactElement } from 'react';
import { motion, useInView } from 'framer-motion';
import { SERVICES, EASING } from '@/lib/constants';

const ICONS: Record<string, ReactElement> = {
  globe: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><path d="M2 12h20" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  ),
  chart: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v18h18" /><path d="M18 17V9" /><path d="M13 17V5" /><path d="M8 17v-3" />
    </svg>
  ),
  device: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="2" width="14" height="20" rx="2" /><path d="M12 18h.01" />
    </svg>
  ),
  brain: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a6 6 0 0 1 6 6c0 2-1 3.5-2 4.5" /><path d="M12 2a6 6 0 0 0-6 6c0 2 1 3.5 2 4.5" /><path d="M8 12.5c-1.5 1-3 3-3 5.5h14c0-2.5-1.5-4.5-3-5.5" /><circle cx="12" cy="8" r="2" /><path d="M12 22v-4" />
    </svg>
  ),
  zap: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  code: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /><line x1="14" y1="4" x2="10" y2="20" />
    </svg>
  ),
  shield: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="M9 12l2 2 4-4" />
    </svg>
  ),
};

export default function Services() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' });

  return (
    <section id="servizi" ref={sectionRef} className="relative py-32 md:py-40 overflow-hidden">
      <div className="absolute inset-0 bg-background" />

      <div className="relative z-10 max-w-6xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: EASING.reveal }}
          className="text-center mb-16 md:mb-24"
        >
          <span className="hud-label text-accent/60 mb-4 block">SERVIZI</span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-6">
            <span className="bg-gradient-to-r from-foreground to-muted bg-clip-text text-transparent">
              Cosa costruiamo
            </span>
          </h2>
          <p className="text-muted max-w-xl mx-auto text-base md:text-lg">
            Ogni soluzione è progettata intorno al tuo flusso di lavoro. Nessun template.
          </p>
        </motion.div>

        {/* Service Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {SERVICES.map((service, i) => (
            <ServiceCard key={service.title} service={service} index={i} isInView={isInView} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ServiceCard({
  service,
  index,
  isInView,
}: {
  service: typeof SERVICES[number];
  index: number;
  isInView: boolean;
}) {
  const isLarge = index === 3; // AI/NLP card gets extra prominence
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    setTilt({
      x: ((e.clientY - cy) / (rect.height / 2)) * -8,
      y: ((e.clientX - cx) / (rect.width / 2)) * 8,
    });
  };

  const handleMouseLeave = () => setTilt({ x: 0, y: 0 });

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ duration: 0.6, ease: EASING.reveal, delay: 0.1 + index * 0.08 }}
      className={`group relative ${isLarge ? 'sm:col-span-2 lg:col-span-1' : ''}`}
      style={{ perspective: 800 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div
        style={{ transformStyle: 'preserve-3d', perspective: 800 }}
        animate={{ rotateX: tilt.x, rotateY: tilt.y }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="
          relative h-full p-6 md:p-7 rounded-2xl
          bg-surface/60 border border-border
          hover:border-accent/30 hover:bg-surface
          transition-all duration-500
          overflow-hidden
        "
      >
        {/* Animated border glow on hover */}
        <div className="
          absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700
          pointer-events-none
        " style={{
          background: 'linear-gradient(135deg, rgba(0,229,255,0.05) 0%, transparent 50%, rgba(124,58,237,0.05) 100%)',
        }} />

        {/* Scan highlight on hover */}
        <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
          <div className="
            absolute w-full h-px bg-gradient-to-r from-transparent via-accent/20 to-transparent
            -translate-y-full group-hover:translate-y-[500%]
            transition-transform duration-[2000ms] ease-linear
          " />
        </div>

        {/* Corner indicator */}
        <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-accent/0 group-hover:bg-accent/40 transition-all duration-500" />

        {/* Icon */}
        <motion.div
          className="
            w-11 h-11 rounded-xl flex items-center justify-center mb-5
            bg-accent/5 text-accent/60 border border-accent/10
            group-hover:bg-accent/10 group-hover:text-accent group-hover:border-accent/20
            transition-all duration-500
          "
          whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
          transition={{ duration: 0.4 }}
        >
          {ICONS[service.icon]}
        </motion.div>

        {/* Content */}
        <h3 className="text-lg font-semibold text-foreground mb-2 tracking-tight group-hover:text-accent transition-colors duration-300">
          {service.title}
        </h3>
        <p className="text-sm text-muted leading-relaxed">
          {service.description}
        </p>

        {/* Bottom status line */}
        <div className="mt-5 flex items-center gap-2">
          <div className="h-px flex-1 bg-border group-hover:bg-accent/20 transition-colors duration-500" />
          <span className="font-mono text-[9px] tracking-widest text-muted/40 group-hover:text-accent/40 transition-colors duration-500 uppercase">
            module
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
}
