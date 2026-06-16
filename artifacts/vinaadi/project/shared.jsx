// Shared sample content + helper UI primitives used by both directions.
// All data here is illustrative / from the screenshots provided.

const VINAADI = {
  user: {
    name: 'Senthilkumar Sivaraman',
    short: 'Senthil',
    lagna: 'Mesham',
    sign: 'Dhanusu',
    nakshatra: 'Moolam',
    pada: 1,
    age: 33,
  },
  today: {
    date: 'Tue, 26 May 2026',
    short: '26 May',
    tithi: 'Shukla 11 · Ekadasi',
    nakshatra: 'Hastham · Pada 1',
    yoga: 'Siddhi',
    karana: 'Vanija',
    sunrise: '5:56 AM',
    sunset: '6:38 PM',
    score: 64,
    tone: 'Balanced',
    dasa: 'Moon Dasa',
    bhukti: 'Moon Bhukti',
    bestWindow: '11:53 AM – 12:41 PM',
    bestWindow2: '7:00 AM – 8:03 AM',
    caution: '3:28 PM – 5:03 PM',
    blurb: 'A steady day. Move step by step. Saturn refines home and inner stability — keep decisions simple.',
  },
  family: {
    name: 'Senthils family',
    score: 70,
    members: 2,
    bestShared: '07:01 – 08:04 AM',
    avoid: '03:29 – 05:04 PM',
  },
  windows: [
    { label: 'Brahma Muhurtam', time: '4:18 – 5:06', tone: 'best' },
    { label: 'Abhijit', time: '11:53 – 12:41', tone: 'best' },
    { label: 'Nalla Neram', time: '10:42 – 12:17', tone: 'good' },
    { label: 'Yamagandam', time: '9:07 – 10:42', tone: 'avoid' },
    { label: 'Kuligai', time: '12:17 – 1:53', tone: 'caution' },
    { label: 'Rahu Kalam', time: '3:28 – 5:03', tone: 'avoid' },
  ],
  weekScores: [
    { d: 'Tue', n: 26, s: 64, t: 'balanced' },
    { d: 'Wed', n: 27, s: 60, t: 'balanced' },
    { d: 'Thu', n: 28, s: 63, t: 'balanced' },
    { d: 'Fri', n: 29, s: 60, t: 'balanced' },
    { d: 'Sat', n: 30, s: 58, t: 'mixed' },
    { d: 'Sun', n: 31, s: 63, t: 'balanced' },
    { d: 'Mon', n: 1,  s: 61, t: 'balanced' },
  ],
  lifeAreas: [
    { key:'career', label:'Career', score:33, trend:'down', note:'Practise patience. Sign important contracts on auspicious days.' },
    { key:'money', label:'Money', score:52, trend:'flat', note:'Steady progress expected. Maintain regular discipline.' },
    { key:'health', label:'Health', score:40, trend:'down', note:'Plan medical check-ups carefully. Rest well.' },
    { key:'love', label:'Relationships', score:57, trend:'flat', note:'Open conversations are supported now.' },
    { key:'study', label:'Education', score:48, trend:'flat', note:'Concentration needs effort. Plan exams calmly.' },
    { key:'spirit', label:'Spiritual', score:67, trend:'flat', note:'A nourishing window for practice.' },
  ],
  yogas: [
    { name:'Gaja Kesari Yoga', strength:'Strong', state:'Active' },
    { name:'Raja Yoga', strength:'Strong', state:'Active' },
    { name:'Dhana Yoga', strength:'—', state:'Absent' },
    { name:'Neecha Bhanga Raja Yoga', strength:'—', state:'Absent' },
  ],
  doshams: [
    { name:'Sevvai Dosham', state:'Active' },
    { name:'Rahu–Ketu Dosham', state:'Active' },
    { name:'Pitru Dosham', state:'Absent' },
    { name:'Kalasarpa Yoga', state:'Absent' },
  ],
};

// I18N — only English / Tamil+English / Tamil are wired (Tweak request)
const L10N = {
  en: {
    today: 'Today',
    home: 'Home',
    open: 'Open dashboard',
    signIn: 'Sign in',
    welcomeBack: 'Welcome back',
    welcome: 'Welcome to Vinaadi',
    personal: 'Personal',
    lifeAreas: 'Life Areas',
    family: 'Family',
    calendar: 'Calendar',
    settings: 'Settings',
    qa: 'QA',
    transits: 'Transits',
    plan: 'Plan',
    journal: 'Journal',
    tools: 'Tools',
    bestWindow: 'Best window',
    caution: 'Caution',
    score: 'Today',
    dasa: 'Dasa',
    nakshatra: 'Nakshatra',
    panchangam: 'Panchangam',
    bhukti: 'Bhukti',
    remedy: 'Remedy',
    yogas: 'Yogas',
    doshams: 'Doshams',
    fortune: 'Fortune',
  },
  ta_en: {
    today: 'இன்று · Today',
    home: 'முகப்பு · Home',
    open: 'Open dashboard',
    signIn: 'Sign in',
    welcomeBack: 'மீண்டும் வரவேற்கிறோம்',
    welcome: 'Welcome to Vinaadi',
    personal: 'என் · Personal',
    lifeAreas: 'வாழ்க்கை · Life',
    family: 'குடும்பம் · Family',
    calendar: 'காலண்டர் · Calendar',
    settings: 'அமைப்பு · Settings',
    qa: 'QA',
    transits: 'கோசாரம் · Transits',
    plan: 'திட்டம் · Plan',
    journal: 'நாட்குறிப்பு · Journal',
    tools: 'கருவிகள் · Tools',
    bestWindow: 'நல்ல நேரம் · Best',
    caution: 'எச்சரிக்கை · Caution',
    score: 'இன்றைய மதிப்பு',
    dasa: 'திசை · Dasa',
    nakshatra: 'நட்சத்திரம்',
    panchangam: 'பஞ்சாங்கம்',
    bhukti: 'புக்தி',
    remedy: 'பரிகாரம் · Remedy',
    yogas: 'யோகங்கள்',
    doshams: 'தோஷங்கள்',
    fortune: 'அதிர்ஷ்டம் · Fortune',
  },
  ta: {
    today: 'இன்று',
    home: 'முகப்பு',
    open: 'டாஷ்போர்டு திற',
    signIn: 'உள்நுழை',
    welcomeBack: 'மீண்டும் வரவேற்கிறோம்',
    welcome: 'வினாடி வரவேற்கிறோம்',
    personal: 'என்',
    lifeAreas: 'வாழ்க்கை',
    transits: 'கோசாரம்',
    plan: 'திட்டம்',
    journal: 'நாட்குறிப்பு',
    tools: 'கருவிகள்',
    family: 'குடும்பம்',
    calendar: 'காலண்டர்',
    settings: 'அமைப்பு',
    qa: 'சோதனை',
    bestWindow: 'நல்ல நேரம்',
    caution: 'எச்சரிக்கை',
    score: 'இன்றைய மதிப்பு',
    dasa: 'திசை',
    nakshatra: 'நட்சத்திரம்',
    panchangam: 'பஞ்சாங்கம்',
    bhukti: 'புக்தி',
    remedy: 'பரிகாரம்',
    yogas: 'யோகங்கள்',
    doshams: 'தோஷங்கள்',
    fortune: 'அதிர்ஷ்டம்',
  },
};

// Live language read from window (set by Tweaks panel)
function useLang() {
  const [lang, setLang] = React.useState(window.__vinaadiLang || 'en');
  React.useEffect(() => {
    const handler = (e) => setLang(e.detail || 'en');
    window.addEventListener('vinaadi-lang', handler);
    return () => window.removeEventListener('vinaadi-lang', handler);
  }, []);
  return L10N[lang] || L10N.en;
}

// ── Helper components ──────────────────────────────────────────────

// Score dial — themed by parent's CSS vars
function Dial({ value, size = 120, stroke = 8, tone = 'ink', label }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  const color = {
    ink: 'var(--ink)',
    sage: 'var(--sage)',
    accent: 'var(--accent)',
    caution: 'var(--caution)',
  }[tone] || 'var(--ink)';
  return (
    <div className="dial" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size/2} cy={size/2} r={r}
          stroke="var(--border)" strokeWidth={stroke} fill="none" />
        <circle cx={size/2} cy={size/2} r={r}
          stroke={color} strokeWidth={stroke} fill="none"
          strokeDasharray={c} strokeDashoffset={offset}
          strokeLinecap="round" />
      </svg>
      <div className="dial-num">
        <div className="display tnum" style={{ fontSize: size * 0.32, color: color }}>{value}</div>
        {label && <div className="eyebrow" style={{ marginTop: 2 }}>{label}</div>}
      </div>
    </div>
  );
}

// Linear meter — used in compact rows
function Meter({ value, tone = 'ink', height = 4 }) {
  const color = {
    ink: 'var(--ink)',
    sage: 'var(--sage)',
    accent: 'var(--accent)',
    caution: 'var(--caution)',
  }[tone] || 'var(--ink)';
  return (
    <div style={{ width: '100%', height, background: 'var(--border)', borderRadius: 999, overflow: 'hidden' }}>
      <div style={{ width: `${value}%`, height: '100%', background: color, borderRadius: 999 }} />
    </div>
  );
}

// Day arc — sunrise to sunset with windows highlighted
function DayArc({ windows = VINAADI.windows, height = 100, width = 360 }) {
  // Map 5:00 AM (300m) → 8:00 PM (1200m) → 0..1
  const dayStart = 5 * 60;     // 5:00 AM
  const dayEnd = 20 * 60;      // 8:00 PM
  const range = dayEnd - dayStart;
  const toX = (m) => ((m - dayStart) / range) * width;
  const parse = (s) => {
    // "11:53 – 12:41" simple parser, AM/PM via context
    const [a, b] = s.split('–').map(x => x.trim());
    const toM = (str, assume) => {
      const [h, m] = str.split(':').map(Number);
      // crude: hours 1..5 assume PM
      const isPM = assume === 'pm' || (h >= 1 && h <= 7 && !str.includes('AM'));
      return (isPM && h !== 12 ? h + 12 : h) * 60 + (m || 0);
    };
    return [toM(a), toM(b)];
  };
  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      {/* arc line */}
      <path d={`M 0 ${height-12} Q ${width/2} ${-height*0.3}, ${width} ${height-12}`}
        stroke="var(--border)" strokeWidth="1.5" fill="none" />
      {/* sun marker at midpoint roughly */}
      <circle cx={toX(12 * 60 + 17)} cy={height*0.18} r="6"
        fill="var(--accent)" />
      {/* window bars at bottom */}
      {windows.map((w, i) => {
        let [a, b] = parse(w.time);
        if (a > b) b = a + 60; // safety
        const color = w.tone === 'best' ? 'var(--sage)'
          : w.tone === 'good' ? 'var(--sage)'
          : w.tone === 'avoid' ? 'var(--caution)'
          : 'var(--accent)';
        const op = w.tone === 'good' ? 0.55 : 0.9;
        return (
          <rect key={i} x={toX(a)} y={height-8} width={Math.max(toX(b)-toX(a), 4)} height="4"
            fill={color} opacity={op} rx="2" />
        );
      })}
      {/* hour ticks */}
      {[6, 9, 12, 15, 18].map(h => (
        <g key={h}>
          <line x1={toX(h*60)} x2={toX(h*60)} y1={height-12} y2={height-15}
            stroke="var(--muted-2)" strokeWidth="1" />
          <text x={toX(h*60)} y={height-20} fontSize="9" fill="var(--muted)"
            textAnchor="middle" fontFamily="var(--font-mono)">{h>12?h-12:h}{h>=12?'p':'a'}</text>
        </g>
      ))}
    </svg>
  );
}

// Sparkline for the week
function Sparkline({ data = VINAADI.weekScores, width = 220, height = 50 }) {
  const max = 100, min = 30;
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((d.s - min) / (max - min)) * height;
    return [x, y];
  });
  const path = pts.map((p, i) => `${i ? 'L' : 'M'} ${p[0]} ${p[1]}`).join(' ');
  return (
    <svg width={width} height={height} style={{ display: 'block', overflow: 'visible' }}>
      <path d={path} stroke="var(--ink)" strokeWidth="1.5" fill="none" />
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i === 0 ? 3 : 2.2}
          fill={i === 0 ? 'var(--accent)' : 'var(--ink)'} />
      ))}
    </svg>
  );
}

// Mini Rasi chart (south-Indian style 4x4 with center blank).
// chartA: position labels by sign abbreviation
function RasiChart({ size = 220, planets = {}, accentSign = 'Mes', subtle = false }) {
  // 4x4 grid, center is 2x2 occupied by name. South Indian fixed-house order.
  const cells = [
    'Pis','Ari','Tau','Gem',
    'Aqu',null,null,'Can',
    'Cap',null,null,'Leo',
    'Sag','Sco','Lib','Vir',
  ];
  const s = size / 4;
  return (
    <svg width={size} height={size} style={{ display: 'block' }}>
      <rect x="0.5" y="0.5" width={size-1} height={size-1}
        stroke={subtle ? 'var(--border)' : 'var(--ink-2)'} strokeWidth="1" fill="var(--surface-2)" rx="6" />
      {[1,2,3].map(i => (
        <g key={i}>
          <line x1={i*s} y1="0" x2={i*s} y2={size}
            stroke="var(--border)" strokeWidth="1" />
          <line x1="0" y1={i*s} x2={size} y2={i*s}
            stroke="var(--border)" strokeWidth="1" />
        </g>
      ))}
      {cells.map((c, idx) => {
        if (!c) return null;
        const col = idx % 4, row = Math.floor(idx / 4);
        const cx = col * s + s/2;
        const cy = row * s + s/2;
        const isAccent = c.startsWith(accentSign.slice(0,3));
        return (
          <g key={idx}>
            {isAccent && <rect x={col*s+1} y={row*s+1} width={s-2} height={s-2}
              fill="var(--accent-soft)" rx="3" />}
            <text x={col*s + 6} y={row*s + 14} fontSize="9"
              fill="var(--muted)" fontFamily="var(--font-mono)"
              textTransform="uppercase">{c}</text>
            {planets[c] && <text x={cx} y={cy + 4} fontSize="13"
              fill="var(--ink)" fontFamily="var(--font-sans)" fontWeight="500"
              textAnchor="middle">{planets[c]}</text>}
          </g>
        );
      })}
      <text x={size/2} y={size/2 - 6} fontSize="9" fill="var(--muted)"
        fontFamily="var(--font-mono)" textAnchor="middle"
        style={{ textTransform: 'uppercase', letterSpacing: '0.1em' }}>D1</text>
      <text x={size/2} y={size/2 + 14} fontSize="11" fill="var(--ink)"
        fontFamily="var(--font-sans)" textAnchor="middle">Rasi · Mesham</text>
    </svg>
  );
}

// Brand mark
function Mark({ size = 28, theme = 'clarity' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32">
      <circle cx="16" cy="16" r="15" fill="none" stroke="var(--ink)" strokeWidth="1.2" />
      <circle cx="16" cy="16" r="3" fill="var(--accent)" />
      <line x1="16" y1="2" x2="16" y2="7" stroke="var(--ink)" strokeWidth="1.2" />
      <line x1="16" y1="25" x2="16" y2="30" stroke="var(--ink)" strokeWidth="1.2" />
      <line x1="2" y1="16" x2="7" y2="16" stroke="var(--ink)" strokeWidth="1.2" />
      <line x1="25" y1="16" x2="30" y2="16" stroke="var(--ink)" strokeWidth="1.2" />
    </svg>
  );
}

// Shared screen header (used inside dashboards)
function DashHeader({ tab, setTab, theme = 'clarity' }) {
  const t = useLang();
  const tabs = ['personal','lifeAreas','family','calendar','settings','qa'];
  return (
    <div style={{ padding: '20px 32px 0', borderBottom: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display:'flex', alignItems:'center', gap: 12 }}>
          <Mark size={24} theme={theme} />
          <div>
            <div className="display" style={{ fontSize: 20 }}>Vinaadi</div>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap: 10 }}>
          <span className="eyebrow">{t.today}</span>
          <span className="tnum" style={{ fontSize: 13, color: 'var(--ink-2)' }}>{VINAADI.today.date}</span>
          <span style={{ width: 28, height: 28, borderRadius: '50%',
            background: 'var(--accent)', color: '#fff',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize: 12, fontWeight: 600 }}>S</span>
        </div>
      </div>
      <div style={{ display:'flex', gap: 4 }}>
        {tabs.map(k => (
          <div key={k} className={`tab ${tab === k ? 'active' : ''}`}
            onClick={() => setTab && setTab(k)}>{t[k]}</div>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { VINAADI, L10N, useLang, Dial, Meter, DayArc, Sparkline, RasiChart, Mark, DashHeader });
