// Design system constants and Italian copy

export const COLORS = {
  background: '#0a0a0f',
  surface: '#111118',
  surface2: '#16161f',
  surface3: '#1c1c28',
  accent: '#00e5ff',
  accentDim: '#00738080',
  violet: '#7c3aed',
  violetDim: '#7c3aed40',
  softBlue: '#3b82f6',
  foreground: '#e8eaed',
  muted: '#6b7280',
  border: '#ffffff12',
} as const;

export const EASING = {
  smooth: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
  cinematic: [0.77, 0, 0.175, 1] as [number, number, number, number],
  reveal: [0.16, 1, 0.3, 1] as [number, number, number, number],
};

export const HERO_COPY = {
  eyebrow: 'Automazione · AI · Software su misura per PMI',
  headline: 'Portiamo chiarezza dove oggi c\'è attrito.',
  subheadline: 'Osserviamo come lavori, eliminiamo attività ripetitive e costruiamo strumenti digitali che fanno risparmiare tempo e denaro.',
  cta: 'Prenota una sessione',
  ctaSecondary: 'Scopri come lavoriamo',
};

export const SCROLL_PHASES = [
  {
    id: 'chaos',
    title: 'Caos operativo',
    description: 'Email, fogli Excel, WhatsApp, chiamate, PDF, appunti sparsi. Tutto è disconnesso, manuale, lento.',
    label: 'FASE 01 — CAOS',
  },
  {
    id: 'discovery',
    title: 'Mappatura intelligente',
    description: 'Un layer di analisi inizia a leggere i processi. Le connessioni emergono. I pattern diventano visibili.',
    label: 'FASE 02 — DIAGNOSI',
  },
  {
    id: 'build',
    title: 'Costruzione del sistema',
    description: 'I nodi si riorganizzano in un flusso intelligente. I percorsi si attivano. Il sistema prende forma.',
    label: 'FASE 03 — BUILD',
  },
  {
    id: 'clarity',
    title: 'Controllo totale',
    description: 'Tutto è visibile, misurabile, sotto controllo. Un centro operativo elegante e funzionale.',
    label: 'FASE 04 — CHIAREZZA',
  },
] as const;

export const METHOD_STEPS = [
  {
    number: '01',
    title: 'Scoperta',
    description: 'Andiamo dal cliente. Guardiamo come lavora davvero.',
    detail: 'Osserviamo i flussi reali, parliamo con chi opera ogni giorno, mappiamo le criticità.',
  },
  {
    number: '02',
    title: 'Diagnosi',
    description: 'Individuiamo frizioni, colli di bottiglia e opportunità concrete.',
    detail: 'Analizziamo tempi, costi nascosti e processi duplicati. Identifichiamo le leve di impatto.',
  },
  {
    number: '03',
    title: 'Co-progettazione',
    description: 'Definiamo insieme la soluzione giusta. Nessun tecnicismo inutile.',
    detail: 'Progettiamo con il cliente, non per il cliente. Ogni scelta è condivisa e comprensibile.',
  },
  {
    number: '04',
    title: 'Implementazione',
    description: 'Realizziamo, formiamo e restiamo vicini nel tempo.',
    detail: 'Sviluppiamo, testiamo, formiamo il team e garantiamo supporto continuativo.',
  },
] as const;

export const SERVICES = [
  {
    title: 'Siti web',
    description: 'Presenze digitali veloci, moderne e ottimizzate per convertire.',
    icon: 'globe',
  },
  {
    title: 'Dashboard interattive',
    description: 'Pannelli di controllo per visualizzare dati e KPI in tempo reale.',
    icon: 'chart',
  },
  {
    title: 'App web e mobile',
    description: 'Applicazioni su misura per gestire processi specifici del tuo business.',
    icon: 'device',
  },
  {
    title: 'AI / NLP',
    description: 'Analisi documenti, chatbot, classificazione automatica, estrazione dati.',
    icon: 'brain',
  },
  {
    title: 'Automazione processi',
    description: 'Flussi automatici che eliminano il lavoro manuale ripetitivo.',
    icon: 'zap',
  },
  {
    title: 'Software custom',
    description: 'Soluzioni progettate intorno al tuo modo di lavorare, non il contrario.',
    icon: 'code',
  },
  {
    title: 'Manutenzione continuativa',
    description: 'Aggiornamenti, monitoraggio e supporto nel tempo. Non ti lasciamo solo.',
    icon: 'shield',
  },
] as const;

export const WHY_LUCE = [
  { title: 'Parliamo la lingua delle PMI', description: 'Niente gergo tecnico. Soluzioni che capisci e che funzionano.' },
  { title: 'Osserviamo prima di proporre', description: 'Ogni progetto parte dall\'ascolto, non da template preconfezionati.' },
  { title: 'Costruiamo insieme', description: 'Il cliente è parte attiva di ogni fase. Co-progettazione vera.' },
  { title: 'Tecnologia comprensibile', description: 'Strumenti che il tuo team sa usare dal giorno uno.' },
  { title: 'Risultati misurabili', description: 'Tempo risparmiato, errori ridotti, processi visibili. Numeri reali.' },
  { title: 'Supporto continuativo', description: 'Non scompariamo dopo la consegna. Restiamo vicini.' },
] as const;

export const METRICS = [
  { value: 40, suffix: '%', label: 'Tempo risparmiato', description: 'su attività manuali ripetitive' },
  { value: 70, suffix: '%', label: 'Meno errori', description: 'nei processi automatizzati' },
  { value: 3, suffix: 'x', label: 'Più visibilità', description: 'sui dati operativi aziendali' },
  { value: 100, suffix: '%', label: 'Supporto attivo', description: 'manutenzione e affiancamento continuo' },
] as const;

export const FINAL_CTA = {
  headline: 'La vera trasformazione inizia quando il lavoro torna chiaro.',
  subheadline: 'Non portiamo una soluzione preconfezionata. Portiamo un metodo.',
  cta: 'Parliamone',
};

export const NAV_LINKS = [
  { label: 'Metodo', href: '#metodo' },
  { label: 'Servizi', href: '#servizi' },
  { label: 'Perché noi', href: '#perche' },
] as const;
