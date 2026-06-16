// tr-components.jsx — Vinaadi Tools Redesign: shared UI primitives

const T = {
  bg: '#F4EEE2', bg2: '#EDE5D4', bg3: '#E6DDD0',
  surface: '#FFFFFF', surface2: '#FAF5EA', surface3: '#F7F1E3',
  ink: '#1A1612', ink2: '#3D352B',
  muted: '#7A6F5E', muted2: '#A89D89',
  border: '#E4DBC8', border2: '#D4C8AE',
  accent: '#B85A2C', accentSoft: '#F0D9C4', accentMid: '#D4875A',
  sage: '#5C7654', sageSoft: '#DCE4D2',
  caution: '#A8482F', cautionSoft: '#F2D8CC',
  amber: '#9A7020', amberSoft: '#F5E9C0',
  info: '#4A6B8A', infoSoft: '#D6E2EE',
};

// ── NAV ──────────────────────────────────────────────────────────────────
function TopNav({ active = 'tools' }) {
  const tabs = ['Personal','Calendar','Family','Life Area','Plan','Transits','Journal','Tools','Settings','QA'];
  return (
    <header style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, position: 'sticky', top: 0, zIndex: 100 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0 40px', height:44, borderBottom:`1px solid ${T.border}` }}>
        <div style={{ display:'flex', alignItems:'center', gap:16 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="6.5" stroke={T.accent} strokeWidth="1.25"/>
              <circle cx="8" cy="8" r="2.5" fill={T.accent}/>
              <line x1="8" y1="1" x2="8" y2="3.5" stroke={T.accent} strokeWidth="1.25"/>
              <line x1="8" y1="12.5" x2="8" y2="15" stroke={T.accent} strokeWidth="1.25"/>
              <line x1="1" y1="8" x2="3.5" y2="8" stroke={T.accent} strokeWidth="1.25"/>
              <line x1="12.5" y1="8" x2="15" y2="8" stroke={T.accent} strokeWidth="1.25"/>
            </svg>
            <span style={{ fontFamily:'Fraunces, serif', fontSize:15, fontWeight:400, letterSpacing:'-0.01em', color:T.ink }}>Vinaadi</span>
          </div>
          <span style={{ color:T.border2 }}>|</span>
          <span style={{ fontSize:11, color:T.muted, letterSpacing:'0.08em', textTransform:'uppercase' }}>
            Senthilkumar Sivaraman · Mesham Lagna · Dhanusu Birth Sign
          </span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, color:T.muted }}>
            <span style={{ width:6, height:6, borderRadius:'50%', background:T.sage, display:'inline-block' }}/>
            Family data refreshed.
          </div>
          <span style={{ fontSize:12, color:T.ink2 }}>Senthil's Family</span>
          <div style={{ width:26, height:26, borderRadius:'50%', border:`1px solid ${T.border}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13 }}>🔔</div>
          <div style={{ width:26, height:26, borderRadius:'50%', border:`1px solid ${T.border}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, color:T.muted }}>ஜ</div>
          <div style={{ width:26, height:26, borderRadius:'50%', background:T.ink, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, color:'#FFF', fontWeight:600 }}>S</div>
        </div>
      </div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 40px' }}>
        <nav style={{ display:'flex' }}>
          {tabs.map(tab => {
            const isActive = tab.toLowerCase() === active;
            return (
              <a key={tab} href="#" onClick={e => e.preventDefault()} style={{
                display:'block', padding:'10px 12px',
                fontSize:13, fontWeight: isActive ? 600 : 400,
                color: isActive ? T.ink : T.muted,
                textDecoration:'none',
                borderBottom: isActive ? `2px solid ${T.ink}` : '2px solid transparent',
                marginBottom:-1,
              }}>{tab}</a>
            );
          })}
        </nav>
        <div style={{ display:'flex', alignItems:'center', gap:6, padding:'5px 10px', border:`1px solid ${T.border}`, borderRadius:6, fontSize:12, color:T.ink2 }}>
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke={T.muted} strokeWidth="1.2">
            <rect x="1" y="2" width="10" height="9" rx="1.5"/>
            <line x1="4" y1="1" x2="4" y2="3.5"/>
            <line x1="8" y1="1" x2="8" y2="3.5"/>
            <line x1="1" y1="5" x2="11" y2="5"/>
          </svg>
          06-Jun-2026
        </div>
      </div>
    </header>
  );
}

// ── FOOTER ───────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer style={{ borderTop:`1px solid ${T.border}`, padding:'48px 40px 36px', marginTop:80 }}>
      <div style={{ maxWidth:1280, margin:'0 auto' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:28 }}>
          <div>
            <div style={{ fontFamily:'Fraunces, serif', fontSize:18, marginBottom:4 }}>Vinaadi</div>
            <div style={{ fontSize:13, color:T.muted, fontStyle:'italic' }}>Jyotish guidance · every morning</div>
          </div>
          <div style={{ display:'flex', gap:28 }}>
            {['Personal','Life Areas','Calendar','Journal','Settings'].map(l => (
              <a key={l} href="#" style={{ fontSize:13, color:T.muted, textDecoration:'none' }}>{l}</a>
            ))}
          </div>
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', borderTop:`1px solid ${T.border}`, paddingTop:20 }}>
          <p style={{ fontSize:11, color:T.muted2, maxWidth:500, lineHeight:1.6 }}>
            Astrology is a traditional belief system, not a scientific fact. For medical, legal, or financial decisions, consult a qualified professional.
          </p>
          <span style={{ fontSize:11, color:T.muted2 }}>© 2026 Vinaadi</span>
        </div>
      </div>
    </footer>
  );
}

// ── FIELD ────────────────────────────────────────────────────────────────
function Field({ label, defaultValue, type='text', helpText, style }) {
  const [focused, setFocused] = React.useState(false);
  return (
    <div style={{ flex:1, minWidth:0, ...style }}>
      <label style={{ display:'block', fontSize:10, letterSpacing:'0.1em', textTransform:'uppercase', color: focused ? T.accent : T.muted, marginBottom:5, fontWeight:600, transition:'color 0.15s' }}>
        {label}
      </label>
      <input
        type={type} defaultValue={defaultValue}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{ width:'100%', padding:'8px 0', border:'none', borderBottom:`1.5px solid ${focused ? T.accent : T.border2}`, background:'transparent', fontSize:14, color:T.ink, outline:'none', fontFamily:'Inter, sans-serif', transition:'border-color 0.15s' }}
      />
      {helpText && <div style={{ fontSize:11, color:T.accent, marginTop:4 }}>{helpText}</div>}
    </div>
  );
}

function SelectField({ label, defaultValue, options, style }) {
  return (
    <div style={{ flex:1, minWidth:0, ...style }}>
      <label style={{ display:'block', fontSize:10, letterSpacing:'0.1em', textTransform:'uppercase', color:T.muted, marginBottom:5, fontWeight:600 }}>
        {label}
      </label>
      <select defaultValue={defaultValue} style={{ width:'100%', padding:'8px 0', border:'none', borderBottom:`1.5px solid ${T.border2}`, background:'transparent', fontSize:14, color:T.ink, outline:'none', fontFamily:'Inter, sans-serif', appearance:'none', cursor:'pointer' }}>
        {options.map(o => <option key={o.value||o} value={o.value||o}>{o.label||o}</option>)}
      </select>
    </div>
  );
}

function TextareaField({ label, defaultValue }) {
  const [focused, setFocused] = React.useState(false);
  return (
    <div>
      <label style={{ display:'block', fontSize:10, letterSpacing:'0.1em', textTransform:'uppercase', color: focused ? T.accent : T.muted, marginBottom:5, fontWeight:600, transition:'color 0.15s' }}>
        {label}
      </label>
      <textarea
        defaultValue={defaultValue} rows={3}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{ width:'100%', padding:'10px 12px', border:`1.5px solid ${focused ? T.accent : T.border}`, borderRadius:8, background: focused ? T.surface : T.surface2, fontSize:14, color:T.ink, outline:'none', fontFamily:'Inter, sans-serif', resize:'vertical', transition:'all 0.15s' }}
      />
    </div>
  );
}

// ── BTN ──────────────────────────────────────────────────────────────────
function Btn({ children, primary, ghost, small, onClick, style }) {
  const [hovered, setHovered] = React.useState(false);
  let bg = hovered ? T.bg2 : T.surface;
  let border = `1px solid ${T.border2}`;
  let color = T.ink2;
  if (primary) { bg = hovered ? '#9F4E26' : T.accent; border = 'none'; color = '#fff'; }
  if (ghost) { bg = hovered ? T.surface2 : 'transparent'; border = `1px solid ${T.border}`; color = T.muted; }
  return (
    <button onClick={onClick} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ display:'inline-flex', alignItems:'center', gap:6, padding: small ? '6px 14px' : '10px 22px', borderRadius:999, fontSize: small ? 12 : 13, fontWeight:500, cursor:'pointer', fontFamily:'Inter, sans-serif', transition:'all 0.15s', border, background:bg, color, ...style }}>
      {children}
    </button>
  );
}

// ── CHIP ─────────────────────────────────────────────────────────────────
function Chip({ children, variant='neutral' }) {
  const v = { sage:{bg:T.sageSoft,color:T.sage}, caution:{bg:T.cautionSoft,color:T.caution}, accent:{bg:T.accentSoft,color:T.accent}, amber:{bg:T.amberSoft,color:T.amber}, neutral:{bg:T.bg2,color:T.ink2} };
  const c = v[variant]||v.neutral;
  return <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'3px 10px', borderRadius:999, fontSize:11, fontWeight:500, background:c.bg, color:c.color }}>{children}</span>;
}

// ── KUTA ROW ─────────────────────────────────────────────────────────────
function KutaRow({ name, score, max }) {
  const pct = max > 0 ? score/max : 0;
  const color = pct === 1 ? T.sage : pct === 0 ? T.caution : T.amber;
  return (
    <div style={{ display:'flex', alignItems:'center', gap:14, padding:'9px 0', borderBottom:`1px solid ${T.border}` }}>
      <div style={{ width:110, fontSize:13, color:T.ink2, flexShrink:0 }}>{name}</div>
      <div style={{ flex:1, height:5, background:T.bg2, borderRadius:3, overflow:'hidden' }}>
        <div style={{ width:`${pct*100}%`, height:'100%', background:color, borderRadius:3, transition:'width 0.8s cubic-bezier(.4,0,.2,1)' }}/>
      </div>
      <div style={{ width:36, textAlign:'right', fontSize:12, fontWeight:700, color, flexShrink:0 }}>{score}/{max}</div>
    </div>
  );
}

// ── SCORE ARC ────────────────────────────────────────────────────────────
function ScoreArc({ score, max }) {
  const pct = score/max;
  const color = pct >= 0.6 ? T.sage : pct >= 0.4 ? T.amber : T.caution;
  const label = pct >= 0.6 ? 'GOOD' : pct >= 0.4 ? 'FAIR' : 'CHALLENGING';
  const R = 52, cx = 70, cy = 70, C = 2*Math.PI*R;
  const track = `${C*0.75} ${C}`;
  const fill = `${C*0.75*pct} ${C}`;
  return (
    <div style={{ display:'flex', alignItems:'center', gap:28 }}>
      <div style={{ position:'relative', width:140, height:140, flexShrink:0 }}>
        <svg width="140" height="140" viewBox="0 0 140 140">
          <circle cx={cx} cy={cy} r={R} fill="none" stroke={T.bg2} strokeWidth="9" strokeDasharray={track} strokeLinecap="round" transform={`rotate(135 ${cx} ${cy})`}/>
          <circle cx={cx} cy={cy} r={R} fill="none" stroke={color} strokeWidth="9" strokeDasharray={fill} strokeLinecap="round" transform={`rotate(135 ${cx} ${cy})`}/>
        </svg>
        <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:1 }}>
          <div style={{ fontFamily:'Fraunces, serif', fontSize:40, lineHeight:1, color:T.ink }}>{score}</div>
          <div style={{ fontSize:10, color:T.muted, letterSpacing:'0.08em', textTransform:'uppercase' }}>/ {max}</div>
        </div>
      </div>
      <div>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
          <span style={{ fontFamily:'Fraunces, serif', fontSize:22, color }}>{Math.round(pct*100)}%</span>
          <span style={{ fontSize:10, letterSpacing:'0.12em', textTransform:'uppercase', color, fontWeight:700, background: pct>=0.6?T.sageSoft:pct>=0.4?T.amberSoft:T.cautionSoft, padding:'2px 8px', borderRadius:999 }}>{label}</span>
        </div>
        <p style={{ fontSize:14, color:T.ink2, lineHeight:1.6, maxWidth:300 }}>
          Porutham score {score}/{max}. Good compatibility with minor differences — traditionally considered suitable with mindful approach.
        </p>
        <p style={{ fontSize:12, color:T.muted, marginTop:8, lineHeight:1.5 }}>
          Marriage context: Sthira kuta (stability) and Raju dosha are most significant.
        </p>
      </div>
    </div>
  );
}

// ── BIRTH CHART (South Indian) ────────────────────────────────────────────
const RASI_GRID = [
  { rasi:'Meenam',    row:1, col:1 },
  { rasi:'Mesham',    row:1, col:2 },
  { rasi:'Rishabam',  row:1, col:3 },
  { rasi:'Mithunam',  row:1, col:4 },
  { rasi:'Kumbam',    row:2, col:1 },
  { rasi:'Kadagam',   row:2, col:4 },
  { rasi:'Magaram',   row:3, col:1 },
  { rasi:'Simmam',    row:3, col:4 },
  { rasi:'Dhanusu',   row:4, col:1 },
  { rasi:'Viruchigam',row:4, col:2 },
  { rasi:'Thulam',    row:4, col:3 },
  { rasi:'Kanni',     row:4, col:4 },
];

const DEFAULT_PLANETS_SENTHIL = { 'Mesham':['La'], 'Rishabam':['Ra','Gu'], 'Mithunam':['Ma'], 'Kumbam':['Sa','Ke'], 'Dhanusu':['Su','Bu'] };
const DEFAULT_PLANETS_KAVIYA  = { 'Rishabam':['La'], 'Mesham':['Gu','Ra'], 'Kumbam':['Bu'], 'Magaram':['Sa','Ma'], 'Viruchigam':['Su'] };

const P_COLORS = { La:T.accent, Su:'#9A7020', Bu:T.sage, Gu:'#7A5EA8', Ma:T.caution, Sa:T.muted, Ra:T.muted2, Ke:T.muted2, Mo:'#4A6B8A' };

function BirthChart({ lagna='Mesham', name, planetsMap, compact }) {
  const pMap = planetsMap || DEFAULT_PLANETS_SENTHIL;
  const cell = compact ? 56 : 68;
  return (
    <div style={{ display:'grid', gridTemplateColumns:`repeat(4, ${cell}px)`, gridTemplateRows:`repeat(4, ${cell}px)`, border:`1px solid ${T.border2}`, borderRadius:10, overflow:'hidden' }}>
      {/* Center cell spanning 2×2 */}
      <div style={{ gridRow:'2/4', gridColumn:'2/4', background:T.surface2, border:`1px solid ${T.border}`, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center', padding:6 }}>
        {name && <div style={{ fontSize: compact ? 10 : 12, fontWeight:600, color:T.ink2, lineHeight:1.3 }}>{name}</div>}
        <div style={{ fontSize:9, color:T.muted, marginTop:2 }}>{lagna} La</div>
      </div>
      {/* Outer 12 rasi cells */}
      {RASI_GRID.map(({ rasi, row, col }) => {
        const isLagna = rasi === lagna;
        const planets = pMap[rasi] || [];
        return (
          <div key={rasi} style={{ gridRow:row, gridColumn:col, background: isLagna ? T.accentSoft : T.surface, border:`1px solid ${T.border}`, padding:'5px 6px', display:'flex', flexDirection:'column', gap:3 }}>
            <div style={{ fontSize:9, color: isLagna ? T.accent : T.muted2, fontWeight: isLagna ? 700 : 400, letterSpacing:'0.02em', lineHeight:1 }}>
              {rasi.slice(0,3)}
            </div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:2 }}>
              {planets.map(p => (
                <span key={p} style={{ fontSize: compact ? 9 : 10, fontWeight:700, color: P_COLORS[p]||T.ink2, lineHeight:1.2 }}>{p}</span>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── PERSON FORM ──────────────────────────────────────────────────────────
function PersonForm({ title, accentColor, data }) {
  return (
    <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:14, padding:24 }}>
      <div style={{ fontSize:10, letterSpacing:'0.14em', textTransform:'uppercase', color: accentColor || T.muted, fontWeight:700, marginBottom:16 }}>
        {title}
      </div>
      <select defaultValue="" style={{ width:'100%', padding:'8px 10px', borderRadius:8, border:`1px solid ${T.border}`, background:T.bg, fontSize:13, color:T.muted, marginBottom:20, fontFamily:'Inter, sans-serif' }}>
        <option value="">Load from family...</option>
        <option>Senthilkumar</option>
        <option>Kaviya</option>
      </select>
      <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
        <Field label="Name" defaultValue={data.name}/>
        <div style={{ display:'flex', gap:16 }}>
          <Field label="Birth Date" defaultValue={data.dob}/>
          <Field label="Birth Time" defaultValue={data.time}/>
        </div>
        <Field label="Birth Place" defaultValue={data.place} helpText="Select a city to auto-fill lat/lng"/>
        <Field label="Timezone" defaultValue={data.tz}/>
        <div style={{ display:'flex', gap:16 }}>
          <Field label="Latitude" defaultValue={data.lat}/>
          <Field label="Longitude" defaultValue={data.lng}/>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { T, TopNav, Footer, Field, SelectField, TextareaField, Btn, Chip, KutaRow, ScoreArc, BirthChart, PersonForm, DEFAULT_PLANETS_KAVIYA });
