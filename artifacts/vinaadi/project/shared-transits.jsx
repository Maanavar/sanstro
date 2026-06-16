// Shared data + helpers for the Transits & Calendar pages.
// Extends the global VINAADI object and adds reusable UI primitives.

Object.assign(VINAADI, {
  // Vimshottari mahadasha ribbon for Senthil (Moon Dasa 2026–2036)
  dashaPeriods: [
    { p: 'Ketu',    from: 1993, to: 2000 },
    { p: 'Venus',   from: 2000, to: 2020 },
    { p: 'Sun',     from: 2020, to: 2026 },
    { p: 'Moon',    from: 2026, to: 2036, current: true },
    { p: 'Mars',    from: 2036, to: 2043 },
    { p: 'Rahu',    from: 2043, to: 2061 },
    { p: 'Jupiter', from: 2061, to: 2077 },
    { p: 'Saturn',  from: 2077, to: 2096 },
    { p: 'Mercury', from: 2096, to: 2113 },
  ],
  // Bhukti within the current Moon mahadasha
  bhuktis: [
    { p: 'Moon',    span: '2026-03-13 → 2027-01-11', yr: '32y', score: 32, now: true,
      antaram: { p: 'Rahu', span: '2026-04-25 → 2026-06-09' } },
    { p: 'Mars',    span: '2027-01-11 → 2027-08-12', yr: '33y', score: 52 },
    { p: 'Rahu',    span: '2027-08-12 → 2029-02-10', yr: '34y', score: 44 },
    { p: 'Jupiter', span: '2029-02-10 → 2030-06-12', yr: '35y', score: 78 },
    { p: 'Saturn',  span: '2030-06-12 → 2032-01-11', yr: '37y', score: 48 },
    { p: 'Mercury', span: '2032-01-11 → 2033-06-12', yr: '38y', score: 65 },
    { p: 'Ketu',    span: '2033-06-12 → 2034-01-11', yr: '40y', score: 42 },
    { p: 'Venus',   span: '2034-01-11 → 2035-09-12', yr: '40y', score: 72 },
    { p: 'Sun',     span: '2035-09-12 → 2036-03-12', yr: '42y', score: 58 },
  ],
  planets: [
    { p: 'Sun',     sign: 'Rishabam', h: 6,  l: 2  },
    { p: 'Moon',    sign: 'Thulam',   h: 11, l: 7  },
    { p: 'Mars',    sign: 'Mesham',   h: 5,  l: 1  },
    { p: 'Mercury', sign: 'Mithunam', h: 7,  l: 3, flag: 'Sandhi' },
    { p: 'Jupiter', sign: 'Mithunam', h: 7,  l: 3, flag: 'Sandhi' },
    { p: 'Venus',   sign: 'Mithunam', h: 7,  l: 3  },
    { p: 'Sani',    sign: 'Meenam',   h: 4,  l: 12 },
    { p: 'Rahu',    sign: 'Kumbam',   h: 3,  l: 11, flag: 'Retro' },
    { p: 'Ketu',    sign: 'Simmam',   h: 9,  l: 5,  flag: 'Retro' },
  ],
  lifeWindows: {
    high: [
      { kind: 'health', label: 'Period requiring careful attention to health', span: 'Jul 2030 – Dec 2030' },
      { kind: 'health', label: 'Period requiring careful attention to health', span: 'Jul 2031 – Dec 2031' },
    ],
    medium: [
      { kind: 'career',   label: 'Career growth is possible during this window',  span: 'Jul 2026 – Dec 2026', conf: 'Moderate' },
      { kind: 'health',   label: 'Moderate health caution advised',               span: 'Jul 2026 – Dec 2026', conf: 'Moderate' },
      { kind: 'marriage', label: 'Period worth watching for marriage discussions', span: 'Jul 2026 – Dec 2026', conf: 'Indicative' },
      { kind: 'study',    label: 'Good support for educational progress',          span: 'Jul 2026 – Dec 2026', conf: 'Moderate' },
      { kind: 'career',   label: 'Career growth is possible during this window',  span: 'Jul 2027 – Dec 2027', conf: 'Moderate' },
      { kind: 'marriage', label: 'Moderate marriage opportunity window',          span: 'Jul 2027 – Dec 2027', conf: 'Moderate' },
    ],
  },
  hora: [
    { p: 'Venus',   t: '5:57 – 7:01 am' },
    { p: 'Mercury', t: '7:01 – 8:05 am' },
    { p: 'Moon',    t: '8:05 – 9:08 am' },
    { p: 'Saturn',  t: '9:08 – 10:12 am' },
    { p: 'Jupiter', t: '10:12 – 11:15 am' },
    { p: 'Mars',    t: '11:15 – 12:19 pm' },
    { p: 'Sun',     t: '12:19 – 1:23 pm' },
    { p: 'Venus',   t: '1:23 – 2:26 pm' },
    { p: 'Mercury', t: '2:26 – 3:30 pm' },
  ],
});

// Per-planet hues (work on both light & dark themes)
const PLANET_HUE = {
  Ketu: '#9C8B7A', Venus: '#C49BB0', Sun: '#D89A57', Moon: '#6E92B6',
  Mars: '#C45A48', Rahu: '#A99BC4', Jupiter: '#8C9C66', Saturn: '#62708A',
  Mercury: '#A89A6E', Sani: '#62708A',
};

function scoreTone(s) { return s >= 65 ? 'sage' : s >= 45 ? 'accent' : 'caution'; }

// Titled panel — matches the product's section cards
function Panel({ title, sub, right, children, pad = 24, style }) {
  return (
    <div className="card" style={{ padding: pad, ...style }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: sub ? 8 : 16 }}>
        <div className="eyebrow">{title}</div>
        {right}
      </div>
      {sub && <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.55, margin: '0 0 16px', maxWidth: 760 }}>{sub}</p>}
      {children}
    </div>
  );
}

// Mahadasha ribbon — proportional segments with "you are here" marker
function DashaRibbon({ periods = VINAADI.dashaPeriods, height = 64 }) {
  const start = periods[0].from, end = periods[periods.length - 1].to;
  const span = end - start;
  const current = periods.find(p => p.current);
  return (
    <div>
      <div style={{ display: 'flex', height, borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)' }}>
        {periods.map((p, i) => {
          const w = ((p.to - p.from) / span) * 100;
          const hue = PLANET_HUE[p.p];
          return (
            <div key={i} style={{ width: `${w}%`, background: p.current ? hue : `${hue}66`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRight: i < periods.length - 1 ? '1px solid var(--bg)' : 'none', position: 'relative' }}>
              {w > 6 && <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.08em',
                color: p.current ? '#fff' : 'var(--ink-2)', textTransform: 'uppercase' }}>{p.p}</span>}
            </div>
          );
        })}
      </div>
      <div style={{ position: 'relative', height: 18, marginTop: 4 }}>
        {periods.map((p, i) => {
          const left = ((p.from - start) / span) * 100;
          return <span key={i} className="mono" style={{ position: 'absolute', left: `${left}%`,
            fontSize: 9.5, color: 'var(--muted)', transform: 'translateX(-2px)' }}>{p.from}</span>;
        })}
      </div>
      {current && (
        <div style={{ position: 'relative', marginTop: 2 }}>
          <div className="eyebrow" style={{ color: 'var(--accent)', textAlign: 'center' }}>
            ▲ You are here — {current.p} ({current.from}–{current.to})
          </div>
        </div>
      )}
    </div>
  );
}

// One planet position card
function PlanetCard({ planet }) {
  const hue = PLANET_HUE[planet.p];
  const flagged = !!planet.flag;
  return (
    <div className="card-flat" style={{ padding: 16, border: flagged ? `1px solid ${hue}` : '1px solid var(--border)',
      background: flagged ? 'var(--surface)' : 'var(--surface-2)' }}>
      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', color: hue, marginBottom: 2 }}>{planet.p}</div>
      <div className="display" style={{ fontSize: 19, lineHeight: 1.1 }}>{planet.sign}</div>
      <div className="mono" style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>H{planet.h} · L{planet.l}</div>
      {planet.flag && (
        <span className="tag" style={{ marginTop: 8, fontSize: 10, padding: '2px 8px',
          background: planet.flag === 'Retro' ? 'var(--accent-soft)' : 'var(--sage-soft)',
          color: planet.flag === 'Retro' ? 'var(--accent)' : 'var(--sage)', border: 'none' }}>
          {planet.flag === 'Retro' ? '℞ Retro' : planet.flag}
        </span>
      )}
    </div>
  );
}

// Full top chrome for Clarity pages (cream header + product nav)
function ClarityChrome({ active }) {
  const t = useLang();
  const nav = [
    ['personal', 'Personal'], ['family', 'Family'], ['lifeAreas', 'Life Areas'],
    ['plan', 'Plan'], ['transits', 'Transits'], ['journal', 'Journal'],
    ['calendar', 'Calendar'], ['tools', 'Tools'], ['settings', 'Settings'], ['qa', 'QA'],
  ];
  return (
    <div style={{ borderBottom: '1px solid var(--border)' }}>
      <div style={{ padding: '18px 32px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Mark size={22} />
          <div className="display" style={{ fontSize: 18 }}>Vinaadi</div>
          <span className="eyebrow" style={{ borderLeft: '1px solid var(--border)', paddingLeft: 14 }}>
            Senthil · Dhanusu Lagna · Moolam ☉
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="tag tag-sage">●&nbsp; Data refreshed</span>
          <span className="tag">Senthils family</span>
          <span style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--ink)', color: '#fff',
            display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 600 }}>S</span>
        </div>
      </div>
      <div style={{ padding: '0 32px', display: 'flex', gap: 2 }}>
        {nav.map(([k, label]) => (
          <div key={k} className={`tab ${active === k ? 'active' : ''}`} style={{ padding: '10px 12px', fontSize: 12.5 }}>
            {(t[k] && t[k].length < 16) ? t[k] : label}
          </div>
        ))}
      </div>
    </div>
  );
}

// Calendar view toggle (Panchangam / Personal / Family)
function CalToggle({ active }) {
  const t = useLang();
  const opts = [['panchangam', t.panchangam], ['personal', t.personal], ['family', t.family]];
  return (
    <div style={{ display: 'flex', gap: 4, background: 'var(--surface-2)', padding: 4, borderRadius: 999, border: '1px solid var(--border)' }}>
      {opts.map(([k, label]) => (
        <div key={k} style={{ padding: '7px 16px', borderRadius: 999, fontSize: 12.5, fontWeight: 500, cursor: 'pointer',
          background: active === k ? 'var(--surface)' : 'transparent',
          color: active === k ? 'var(--ink)' : 'var(--muted)',
          boxShadow: active === k ? '0 1px 2px rgba(0,0,0,0.05)' : 'none' }}>
          {(label && label.length < 18) ? label : k}
        </div>
      ))}
    </div>
  );
}

Object.assign(window, { PLANET_HUE, scoreTone, Panel, DashaRibbon, PlanetCard, ClarityChrome, CalToggle });
