'use client';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative border-t border-border bg-surface/30">
      <div className="max-w-6xl mx-auto px-6 py-12 md:py-16">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          {/* Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                  <circle cx="10" cy="10" r="3" fill="#00e5ff" opacity="0.9" />
                  <circle cx="10" cy="10" r="6" stroke="#00e5ff" strokeWidth="0.5" opacity="0.4" />
                  <circle cx="10" cy="10" r="9" stroke="#00e5ff" strokeWidth="0.3" opacity="0.2" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-foreground tracking-tight">
                Luce<span className="text-accent">AI</span>
              </span>
            </div>
            <p className="text-xs text-muted max-w-xs">
              Automazione intelligente e software su misura per piccole e medie imprese italiane.
            </p>
          </div>

          {/* Links */}
          <div className="flex flex-wrap gap-8 text-xs text-muted">
            <div className="space-y-2">
              <span className="font-mono text-[10px] text-accent/40 tracking-widest uppercase block">Navigazione</span>
              <a href="#metodo" className="block hover:text-foreground transition-colors">Metodo</a>
              <a href="#servizi" className="block hover:text-foreground transition-colors">Servizi</a>
              <a href="#perche" className="block hover:text-foreground transition-colors">Perché noi</a>
            </div>
            <div className="space-y-2">
              <span className="font-mono text-[10px] text-accent/40 tracking-widest uppercase block">Contatti</span>
              <a href="mailto:info@luceai.it" className="block hover:text-foreground transition-colors">info@luceai.it</a>
              <span className="block">Milano, Italia</span>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-[11px] text-muted/60">
            © {year} Luce AI. Tutti i diritti riservati.
          </span>
          <span className="font-mono text-[9px] text-accent/20 tracking-widest">
            DESIGNED WITH INTELLIGENCE
          </span>
        </div>
      </div>
    </footer>
  );
}
