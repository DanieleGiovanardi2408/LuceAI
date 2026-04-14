'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { FINAL_CTA, EASING } from '@/lib/constants';

export default function FinalCTA() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' });

  return (
    <section
      id="contatto"
      ref={sectionRef}
      className="relative py-32 md:py-48 overflow-hidden"
    >
      {/* Background with multiple layers */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-surface to-background" />
      
      {/* Central light composition */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {/* Outer glow ring */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 2, ease: EASING.cinematic }}
          className="absolute w-[600px] h-[600px] md:w-[800px] md:h-[800px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(0,229,255,0.04) 0%, rgba(124,58,237,0.02) 40%, transparent 70%)',
          }}
        />

        {/* Inner glow */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 1.5, ease: EASING.cinematic, delay: 0.3 }}
          className="absolute w-[300px] h-[300px] md:w-[400px] md:h-[400px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(0,229,255,0.06) 0%, transparent 60%)',
          }}
        />

        {/* Animated ring */}
        <motion.div
          initial={{ opacity: 0, scale: 0.6, rotate: 0 }}
          animate={isInView ? { opacity: 0.15, scale: 1, rotate: 360 } : {}}
          transition={{ duration: 30, ease: 'linear', repeat: Infinity }}
          className="absolute w-[500px] h-[500px] md:w-[600px] md:h-[600px] rounded-full border border-accent/10"
          style={{
            borderStyle: 'dashed',
            borderWidth: '1px',
          }}
        />
      </div>

      <div className="absolute inset-0 noise pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: EASING.reveal }}
          className="mb-4"
        >
          <span className="hud-label text-accent/60">INIZIAMO</span>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }}
          animate={isInView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
          transition={{ duration: 1, ease: EASING.reveal, delay: 0.15 }}
          className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6 leading-[1.1]"
        >
          <span className="bg-gradient-to-b from-white via-foreground to-muted bg-clip-text text-transparent">
            {FINAL_CTA.headline}
          </span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: EASING.reveal, delay: 0.3 }}
          className="text-muted text-base md:text-lg mb-10 max-w-lg mx-auto"
        >
          {FINAL_CTA.subheadline}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: EASING.reveal, delay: 0.45 }}
        >
          <a
            href="mailto:info@luceai.it"
            className="
              group relative inline-flex items-center gap-3 px-10 py-4 rounded-xl text-base font-semibold
              bg-accent text-background
              hover:shadow-[0_0_40px_rgba(0,229,255,0.35)]
              transition-all duration-500
              overflow-hidden
            "
          >
            <span className="relative z-10">{FINAL_CTA.cta}</span>
            <svg className="relative z-10 w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
            <div className="absolute inset-0 bg-gradient-to-r from-accent via-soft-blue to-accent bg-[length:200%_100%] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          </a>
        </motion.div>

        {/* Bottom system label */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 1, delay: 0.8 }}
          className="mt-16"
        >
          <span className="hud-label text-accent/20">
            LUCE.AI — AUTOMAZIONE INTELLIGENTE PER PMI
          </span>
        </motion.div>
      </div>
    </section>
  );
}
