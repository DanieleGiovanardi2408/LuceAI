'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { METHOD_STEPS, EASING } from '@/lib/constants';

export default function Method() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' });

  return (
    <section id="metodo" ref={sectionRef} className="relative py-32 md:py-40 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-surface to-background" />
      <div className="absolute inset-0 grid-overlay opacity-30" />

      <div className="relative z-10 max-w-6xl mx-auto px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: EASING.reveal }}
          className="text-center mb-20 md:mb-28"
        >
          <span className="hud-label text-accent/60 mb-4 block">IL NOSTRO METODO</span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-6">
            <span className="bg-gradient-to-r from-foreground to-muted bg-clip-text text-transparent">
              Quattro fasi. Un sistema.
            </span>
          </h2>
          <p className="text-muted max-w-xl mx-auto text-base md:text-lg">
            Non vendiamo tecnologia. Costruiamo soluzioni partendo dal modo in cui lavori oggi.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="relative">
          {/* Vertical Line */}
          <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-px md:-translate-x-px">
            <motion.div
              initial={{ scaleY: 0 }}
              animate={isInView ? { scaleY: 1 } : {}}
              transition={{ duration: 1.5, ease: EASING.cinematic, delay: 0.3 }}
              className="w-full h-full bg-gradient-to-b from-accent/40 via-accent/20 to-transparent origin-top"
            />
          </div>

          {METHOD_STEPS.map((step, i) => (
            <MethodStep key={step.number} step={step} index={i} isInView={isInView} />
          ))}
        </div>
      </div>
    </section>
  );
}

function MethodStep({
  step,
  index,
  isInView,
}: {
  step: typeof METHOD_STEPS[number];
  index: number;
  isInView: boolean;
}) {
  const isLeft = index % 2 === 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: isLeft ? -40 : 40 }}
      animate={isInView ? { opacity: 1, x: 0 } : {}}
      transition={{
        duration: 0.7,
        ease: EASING.reveal,
        delay: 0.4 + index * 0.15,
      }}
      className={`relative flex items-start gap-6 md:gap-0 mb-16 md:mb-24 last:mb-0 ${
        isLeft ? 'md:flex-row' : 'md:flex-row-reverse'
      }`}
    >
      {/* Number node */}
      <div className="absolute left-6 md:left-1/2 -translate-x-1/2 z-10">
        <motion.div
          initial={{ scale: 0 }}
          animate={isInView ? { scale: 1 } : {}}
          transition={{ delay: 0.5 + index * 0.15, duration: 0.5, ease: EASING.reveal }}
          className="w-12 h-12 rounded-xl bg-surface border border-accent/20 flex items-center justify-center glow-border"
        >
          <span className="font-mono text-sm font-bold text-accent">{step.number}</span>
        </motion.div>
      </div>

      {/* Content */}
      <div className={`ml-16 md:ml-0 md:w-1/2 ${isLeft ? 'md:pr-16 md:text-right' : 'md:pl-16'}`}>
        <div className="group p-6 rounded-2xl bg-surface/50 border border-border hover:border-accent/20 transition-all duration-500">
          <h3 className="text-xl md:text-2xl font-bold text-foreground mb-2 tracking-tight">
            {step.title}
          </h3>
          <p className="text-accent/80 text-sm font-medium mb-3">
            {step.description}
          </p>
          <p className="text-muted text-sm leading-relaxed">
            {step.detail}
          </p>

          {/* Animated scan bar */}
          <div className="mt-4 h-px w-full bg-border overflow-hidden">
            <motion.div
              initial={{ x: '-100%' }}
              animate={isInView ? { x: '100%' } : {}}
              transition={{
                delay: 1 + index * 0.2,
                duration: 2,
                ease: 'linear',
                repeat: Infinity,
                repeatDelay: 3,
              }}
              className="h-full w-1/3 bg-gradient-to-r from-transparent via-accent/40 to-transparent"
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
