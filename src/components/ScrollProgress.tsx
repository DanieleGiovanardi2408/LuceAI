'use client';

import { motion, useScroll, useSpring } from 'framer-motion';

export default function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 200,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <motion.div
      style={{ scaleX }}
      className="fixed top-0 left-0 right-0 h-[2px] origin-left z-[100] pointer-events-none"
      aria-hidden="true"
      role="presentation"
    >
      <div className="w-full h-full bg-gradient-to-r from-accent via-violet to-accent" />
    </motion.div>
  );
}
