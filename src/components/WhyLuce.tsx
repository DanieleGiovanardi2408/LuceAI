'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { WHY_LUCE, EASING } from '@/lib/constants';

export default function WhyLuce() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' });

  return (
    <section id="perche" ref={sectionRef} className="relative py-32 md:py-40 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-surface to-background" />
      <div className="absolute inset-0 grid-overlay opacity-20" />

      {/* Large decorative text */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none">
        <span className="text-[12vw] md:text-[10vw] font-bold tracking-tighter text-accent/[0.02] whitespace-nowrap">
          CHIAREZZA
        </span>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: EASING.reveal }}
          className="mb-16 md:mb-24"
        >
          <span className="hud-label text-accent/60 mb-4 block">PERCHÉ LUCE AI</span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6 max-w-3xl">
            <span className="bg-gradient-to-r from-foreground via-foreground to-muted bg-clip-text text-transparent">
              Non siamo l&apos;ennesima agenzia digitale.
            </span>
          </h2>
          <p className="text-muted max-w-xl text-base md:text-lg">
            Lavoriamo con le PMI italiane. Parliamo la loro lingua. Risolviamo i loro problemi reali.
          </p>
        </motion.div>

        {/* Differentiators Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-border/50 rounded-2xl overflow-hidden">
          {WHY_LUCE.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, ease: EASING.reveal, delay: 0.2 + i * 0.1 }}
              className="group bg-surface/80 p-8 md:p-10 hover:bg-surface transition-colors duration-500 relative overflow-hidden"
            >
              {/* Big number background */}
              <span className="absolute -bottom-4 -right-2 text-8xl font-black text-accent/[0.04] select-none pointer-events-none leading-none group-hover:text-accent/[0.07] transition-colors duration-500">
                {String(i + 1).padStart(2, '0')}
              </span>

              {/* Number */}
              <span className="font-mono text-xs text-accent/30 mb-4 block">
                {String(i + 1).padStart(2, '0')}
              </span>

              {/* Title */}
              <h3 className="text-lg md:text-xl font-bold text-foreground mb-3 tracking-tight group-hover:text-accent transition-colors duration-300 relative z-10">
                {item.title}
              </h3>

              {/* Description */}
              <p className="text-sm text-muted leading-relaxed relative z-10">
                {item.description}
              </p>

              {/* Bottom animated line */}
              <motion.div
                className="absolute bottom-0 left-0 h-px bg-gradient-to-r from-accent/60 to-violet/40"
                initial={{ width: 0 }}
                whileHover={{ width: '100%' }}
                transition={{ duration: 0.4 }}
              />

              {/* Corner glow on hover */}
              <div className="absolute top-0 right-0 w-20 h-20 bg-accent/0 group-hover:bg-accent/5 rounded-bl-full transition-all duration-700 pointer-events-none" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
