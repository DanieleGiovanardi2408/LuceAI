'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NAV_LINKS } from '@/lib/constants';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setIsScrolled(currentScrollY > 50);
      setIsVisible(currentScrollY < lastScrollY || currentScrollY < 100);
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ 
        y: isVisible ? 0 : -100, 
        opacity: isVisible ? 1 : 0 
      }}
      transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
      className="fixed top-0 left-0 right-0 z-50 px-4 pt-4"
    >
      <nav
        className={`
          mx-auto max-w-6xl rounded-2xl px-6 py-3 transition-all duration-500
          ${isScrolled 
            ? 'glass shadow-lg shadow-black/20' 
            : 'bg-transparent'
          }
        `}
      >
        <div className="flex items-center justify-between">
          {/* Logo */}
          <a href="#" className="flex items-center gap-2 group" aria-label="Luce AI Home">
            <div className="relative w-8 h-8 flex items-center justify-center">
              <div className="absolute inset-0 rounded-lg bg-accent/10 group-hover:bg-accent/20 transition-colors duration-300" />
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="relative z-10">
                <circle cx="10" cy="10" r="3" fill="#00e5ff" opacity="0.9" />
                <circle cx="10" cy="10" r="6" stroke="#00e5ff" strokeWidth="0.5" opacity="0.4" />
                <circle cx="10" cy="10" r="9" stroke="#00e5ff" strokeWidth="0.3" opacity="0.2" />
                <line x1="10" y1="1" x2="10" y2="4" stroke="#00e5ff" strokeWidth="0.5" opacity="0.3" />
                <line x1="10" y1="16" x2="10" y2="19" stroke="#00e5ff" strokeWidth="0.5" opacity="0.3" />
                <line x1="1" y1="10" x2="4" y2="10" stroke="#00e5ff" strokeWidth="0.5" opacity="0.3" />
                <line x1="16" y1="10" x2="19" y2="10" stroke="#00e5ff" strokeWidth="0.5" opacity="0.3" />
              </svg>
            </div>
            <span className="text-lg font-semibold tracking-tight text-foreground">
              Luce<span className="text-accent">AI</span>
            </span>
          </a>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm text-muted hover:text-foreground transition-colors duration-300 tracking-wide"
              >
                {link.label}
              </a>
            ))}
            <a
              href="#contatto"
              className="
                relative px-5 py-2 text-sm font-medium rounded-lg overflow-hidden
                bg-accent/10 text-accent border border-accent/20
                hover:bg-accent/20 hover:border-accent/40
                transition-all duration-300
              "
            >
              Contattaci
            </a>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden relative w-8 h-8 flex flex-col items-center justify-center gap-1.5"
            aria-label="Menu"
          >
            <motion.span
              animate={isMenuOpen ? { rotate: 45, y: 5 } : { rotate: 0, y: 0 }}
              className="w-5 h-px bg-foreground block"
            />
            <motion.span
              animate={isMenuOpen ? { opacity: 0 } : { opacity: 1 }}
              className="w-5 h-px bg-foreground block"
            />
            <motion.span
              animate={isMenuOpen ? { rotate: -45, y: -5 } : { rotate: 0, y: 0 }}
              className="w-5 h-px bg-foreground block"
            />
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
              className="md:hidden overflow-hidden"
            >
              <div className="pt-4 pb-2 flex flex-col gap-3">
                {NAV_LINKS.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsMenuOpen(false)}
                    className="text-sm text-muted hover:text-foreground transition-colors py-2"
                  >
                    {link.label}
                  </a>
                ))}
                <a
                  href="#contatto"
                  onClick={() => setIsMenuOpen(false)}
                  className="text-sm font-medium text-accent py-2"
                >
                  Contattaci
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </motion.header>
  );
}
