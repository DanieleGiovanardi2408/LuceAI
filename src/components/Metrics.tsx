'use client';

import { useRef, useEffect, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { METRICS, EASING } from '@/lib/constants';

function AnimatedCounter({ target, suffix, duration = 2000 }: { target: number; suffix: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const hasStartedRef = useRef(false);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  useEffect(() => {
    if (!isInView || hasStartedRef.current) return;
    hasStartedRef.current = true;

    const startTime = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(target * eased));

      if (progress >= 1) clearInterval(timer);
    }, 16);

    return () => clearInterval(timer);
  }, [isInView, target, duration]);

  return (
    <span ref={ref} className="tabular-nums">
      {count}{suffix}
    </span>
  );
}

export default function Metrics() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' });

  return (
    <section ref={sectionRef} className="relative py-32 md:py-40 overflow-hidden">
      <div className="absolute inset-0 bg-background" />

      <div className="relative z-10 max-w-6xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: EASING.reveal }}
          className="text-center mb-16 md:mb-24"
        >
          <span className="hud-label text-accent/60 mb-4 block">IMPATTO</span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-6">
            <span className="bg-gradient-to-r from-foreground to-muted bg-clip-text text-transparent">
              Risultati concreti
            </span>
          </h2>
          <p className="text-muted max-w-xl mx-auto text-base md:text-lg">
            I numeri che contano quando il lavoro diventa più intelligente.
          </p>
        </motion.div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {METRICS.map((metric, i) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, ease: EASING.reveal, delay: 0.2 + i * 0.1 }}
              className="group relative"
            >
              <div className="
                relative p-8 rounded-2xl text-center
                bg-surface/40 border border-border
                hover:border-accent/20 hover:bg-surface/60
                transition-all duration-500
              ">
                {/* Large Number */}
                <div className="text-5xl md:text-6xl font-bold text-accent mb-2 glow-text">
                  <AnimatedCounter target={metric.value} suffix={metric.suffix} />
                </div>

                {/* Label */}
                <h3 className="text-base font-semibold text-foreground mb-1">
                  {metric.label}
                </h3>

                {/* Description */}
                <p className="text-xs text-muted">
                  {metric.description}
                </p>

                {/* Decorative bottom bar */}
                <div className="mt-6 h-0.5 w-full bg-border rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={isInView ? { width: `${metric.value}%` } : {}}
                    transition={{ duration: 1.5, ease: EASING.cinematic, delay: 0.5 + i * 0.15 }}
                    className="h-full bg-gradient-to-r from-accent to-violet rounded-full"
                    style={{ maxWidth: '100%' }}
                  />
                </div>

                {/* HUD corner */}
                <div className="absolute top-3 right-3">
                  <span className="font-mono text-[8px] text-accent/20 tracking-widest">
                    KPI.{String(i + 1).padStart(2, '0')}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
