'use client';

import { useState, useRef } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { EASING } from '@/lib/constants';

type FormState = 'idle' | 'loading' | 'success' | 'error';

export default function ContactForm() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-80px' });

  const [formState, setFormState] = useState<FormState>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [fields, setFields] = useState({ name: '', email: '', message: '' });
  const [touched, setTouched] = useState({ name: false, email: false, message: false });

  const errors = {
    name: touched.name && fields.name.trim().length < 2 ? 'Inserisci il tuo nome' : '',
    email: touched.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email) ? 'Email non valida' : '',
    message: touched.message && fields.message.trim().length < 10 ? 'Messaggio troppo corto (min 10 caratteri)' : '',
  };

  const isValid = fields.name.trim().length >= 2 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email) &&
    fields.message.trim().length >= 10;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ name: true, email: true, message: true });
    if (!isValid) return;

    setFormState('loading');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Errore sconosciuto');
      setFormState('success');
      setFields({ name: '', email: '', message: '' });
      setTouched({ name: false, email: false, message: false });
    } catch (err) {
      setFormState('error');
      setErrorMsg(err instanceof Error ? err.message : 'Errore nell\'invio. Riprova.');
    }
  };

  return (
    <section
      id="form-contatto"
      ref={sectionRef}
      className="relative py-24 md:py-32 overflow-hidden"
    >
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-surface to-background" />
      <div className="absolute inset-0 grid-overlay opacity-20" />

      <div className="relative z-10 max-w-2xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: EASING.reveal }}
          className="text-center mb-12"
        >
          <span className="hud-label text-accent/60 mb-3 block">INVIA UN MESSAGGIO</span>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Parliamoci.
          </h2>
          <p className="mt-3 text-sm text-muted">
            Raccontaci la tua sfida. Ti rispondiamo entro 24 ore.
          </p>
        </motion.div>

        {/* Form card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: EASING.reveal, delay: 0.1 }}
          className="relative rounded-2xl bg-surface/60 border border-border p-8 md:p-10 overflow-hidden"
        >
          {/* Corner brackets */}
          {[['top-3 left-3', 'top-0 left-0'], ['top-3 right-3', 'top-0 right-0'], ['bottom-3 left-3', 'bottom-0 left-0'], ['bottom-3 right-3', 'bottom-0 right-0']].map(([pos], i) => (
            <svg
              key={i}
              width="16" height="16"
              className={`absolute ${pos} text-accent/20`}
              viewBox="0 0 16 16" fill="none"
            >
              {i === 0 && <><path d="M0 8V0H8" stroke="currentColor" strokeWidth="1.5" /></>}
              {i === 1 && <><path d="M16 8V0H8" stroke="currentColor" strokeWidth="1.5" /></>}
              {i === 2 && <><path d="M0 8V16H8" stroke="currentColor" strokeWidth="1.5" /></>}
              {i === 3 && <><path d="M16 8V16H8" stroke="currentColor" strokeWidth="1.5" /></>}
            </svg>
          ))}

          <AnimatePresence mode="wait">
            {formState === 'success' ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, ease: EASING.reveal }}
                className="py-12 text-center space-y-4"
              >
                <div className="mx-auto w-16 h-16 rounded-full bg-accent/10 border border-accent/30 flex items-center justify-center mb-2">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00e5ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-foreground">Messaggio inviato.</h3>
                <p className="text-sm text-muted max-w-xs mx-auto">
                  Grazie! Ti risponderemo entro 24 ore all&apos;indirizzo che hai indicato.
                </p>
                <button
                  onClick={() => setFormState('idle')}
                  className="mt-4 text-xs font-mono text-accent/60 hover:text-accent transition-colors"
                >
                  → Invia un altro messaggio
                </button>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                onSubmit={handleSubmit}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                noValidate
                className="space-y-6"
              >
                {/* Row: Name + Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <Field
                    id="name"
                    label="Nome"
                    type="text"
                    value={fields.name}
                    error={errors.name}
                    placeholder="Mario Rossi"
                    onChange={v => setFields(f => ({ ...f, name: v }))}
                    onBlur={() => setTouched(t => ({ ...t, name: true }))}
                  />
                  <Field
                    id="email"
                    label="Email"
                    type="email"
                    value={fields.email}
                    error={errors.email}
                    placeholder="mario@azienda.it"
                    onChange={v => setFields(f => ({ ...f, email: v }))}
                    onBlur={() => setTouched(t => ({ ...t, email: true }))}
                  />
                </div>

                {/* Message */}
                <div className="space-y-1.5">
                  <label htmlFor="message" className="hud-label text-foreground/50">
                    Messaggio
                  </label>
                  <textarea
                    id="message"
                    rows={5}
                    value={fields.message}
                    placeholder="Raccontaci la tua situazione, che processi vorresti migliorare, che ostacoli incontri..."
                    onChange={e => setFields(f => ({ ...f, message: e.target.value }))}
                    onBlur={() => setTouched(t => ({ ...t, message: true }))}
                    className={`
                      w-full px-4 py-3 rounded-xl resize-none
                      bg-surface-2 border text-sm text-foreground placeholder:text-muted/40
                      focus:outline-none focus:border-accent/40 focus:bg-surface-3
                      transition-all duration-300
                      ${errors.message ? 'border-red-500/50' : 'border-border'}
                    `}
                  />
                  {errors.message && (
                    <p className="text-xs text-red-400 font-mono">{errors.message}</p>
                  )}
                </div>

                {/* Error banner */}
                {formState === 'error' && (
                  <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    {errorMsg}
                  </div>
                )}

                {/* Submit */}
                <div className="flex items-center justify-between pt-2">
                  <span className="font-mono text-[10px] text-muted/30 tracking-widest uppercase">
                    Risposta garantita in 24h
                  </span>
                  <button
                    type="submit"
                    disabled={formState === 'loading'}
                    className="
                      group relative inline-flex items-center gap-2.5 px-7 py-3 rounded-xl
                      text-sm font-semibold bg-accent text-background
                      hover:shadow-[0_0_30px_rgba(0,229,255,0.3)]
                      disabled:opacity-60 disabled:cursor-not-allowed
                      transition-all duration-300 overflow-hidden
                    "
                  >
                    <span className="relative z-10">
                      {formState === 'loading' ? 'Invio in corso…' : 'Invia messaggio'}
                    </span>
                    {formState !== 'loading' && (
                      <svg
                        className="relative z-10 w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-300"
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    )}
                    {formState === 'loading' && (
                      <svg className="relative z-10 w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-r from-accent via-soft-blue to-accent bg-[length:200%_100%] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Contacts row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-6 text-xs text-muted"
        >
          <a href="mailto:info@luceai.it" className="flex items-center gap-2 hover:text-accent transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="M2 7l10 7 10-7" />
            </svg>
            info@luceai.it
          </a>
          <span className="hidden sm:block w-px h-4 bg-border" />
          <span className="flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            Milano, Italia
          </span>
        </motion.div>
      </div>
    </section>
  );
}

function Field({
  id, label, type, value, error, placeholder, onChange, onBlur,
}: {
  id: string; label: string; type: string; value: string; error: string;
  placeholder: string; onChange: (v: string) => void; onBlur: () => void;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="hud-label text-foreground/50">{label}</label>
      <input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        onBlur={onBlur}
        className={`
          w-full px-4 py-3 rounded-xl
          bg-surface-2 border text-sm text-foreground placeholder:text-muted/40
          focus:outline-none focus:border-accent/40 focus:bg-surface-3
          transition-all duration-300
          ${error ? 'border-red-500/50' : 'border-border'}
        `}
      />
      {error && <p className="text-xs text-red-400 font-mono">{error}</p>}
    </div>
  );
}
