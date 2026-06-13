// tools-v2-components.jsx — v3 rewrite: underline fields, wider layout

const RASI_GRID = [
  { rasi:'Meenam',     row:1, col:1 },
  { rasi:'Mesham',     row:1, col:2 },
  { rasi:'Rishabam',   row:1, col:3 },
  { rasi:'Mithunam',   row:1, col:4 },
  { rasi:'Kumbam',     row:2, col:1 },
  { rasi:'Kadagam',    row:2, col:4 },
  { rasi:'Magaram',    row:3, col:1 },
  { rasi:'Simmam',     row:3, col:4 },
  { rasi:'Dhanusu',    row:4, col:1 },
  { rasi:'Viruchigam', row:4, col:2 },
  { rasi:'Thulam',     row:4, col:3 },
  { rasi:'Kanni',      row:4, col:4 },
];

const V2_PLANETS = {
  senthil: { 'Mesham':['La'], 'Rishabam':['Ra','Gu'], 'Mithunam':['Ma'], 'Kumbam':['Sa','Ke'], 'Dhanusu':['Su','Bu'] },
  kaviya:  { 'Rishabam':['La'], 'Mesham':['Gu','Ra'], 'Kumbam':['Bu'], 'Magaram':['Sa','Ma'], 'Viruchigam':['Su'] },
};

const V2_PLANET_CLR = {
  La:'var(--accent)', Su:'#9A7020', Bu:'var(--sage)',
  Gu:'#7A5EA8', Ma:'var(--caution)', Sa:'var(--muted)',
  Ra:'var(--muted-2)', Ke:'var(--muted-2)',
};

// ── NAV ──────────────────────────────────────────────────────────────────
function V2Nav() {
  const tabs = ['Personal','Calendar','Family','Life Area','Plan','Transits','Journal','Tools','Settings','QA'];
  return (
    <header style={{ background:'var(--surface)', borderBottom:'1px solid var(--border)', position:'sticky', top:0, zIndex:100 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0 48px', height:44, borderBottom:'1px solid var(--border)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:16 }}>
          <div style={{ display:'flex', alignItems:'center', gap:9 }}>
            <svg width="17" height="17" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="14" stroke="var(--accent)" strokeWidth="1.4"/>
              <circle cx="16" cy="16" r="4" fill="var(--accent)"/>
              <line x1="16" y1="2" x2="16" y2="7" stroke="var(--accent)" strokeWidth="1.5"/>
              <line x1="16" y1="25" x2="16" y2="30" stroke="var(--accent)" strokeWidth="1.5"/>
              <line x1="2" y1="16" x2="7" y2="16" stroke="var(--accent)" strokeWidth="1.5"/>
              <line x1="25" y1="16" x2="30" y2="16" stroke="var(--accent)" strokeWidth="1.5"/>
            </svg>
            <span style={{ fontFamily:'var(--font-display)', fontSize:15, color:'var(--ink)' }}>Vinaadi</span>
          </div>
          <span style={{ color:'var(--border-2)' }}>|</span>
          <span style={{ fontSize:11, color:'var(--muted)', letterSpacing:'0.07em', textTransform:'uppercase' }}>
            Senthilkumar Sivaraman · Mesham Lagna
          </span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, color:'var(--muted)' }}>
            <span style={{ width:6, height:6, borderRadius:'50%', background:'var(--sage)', display:'inline-block' }}/>
            Family data refreshed.
          </div>
          <span style={{ fontSize:12, color:'var(--ink-2)' }}>Senthil's Family</span>
          <div style={{ width:27, height:27, borderRadius:'50%', background:'var(--ink)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, color:'var(--bg)', fontWeight:600 }}>S</div>
        </div>
      </div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 48px' }}>
        <nav style={{ display:'flex' }}>
          {tabs.map(tab => {
            const active = tab === 'Tools';
            return (
              <a key={tab} href="#" onClick={e => e.preventDefault()} style={{
                display:'block', padding:'10px 13px',
                fontSize:13, fontWeight: active ? 600 : 400,
                color: active ? 'var(--ink)' : 'var(--muted)',
                textDecoration:'none',
                borderBottom: active ? '2px solid var(--ink)' : '2px solid transparent',
                marginBottom:-1, transition:'color 0.15s',
              }}>{tab}</a>
            );
          })}
        </nav>
        <div style={{ display:'flex', alignItems:'center', gap:6, padding:'4px 10px', border:'1px solid var(--border)', borderRadius:6, fontSize:12, color:'var(--ink-2)' }}>
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="var(--muted)" strokeWidth="1.2" strokeLinecap="round">
            <rect x="1" y="2" width="10" height="9" rx="1.5"/><line x1="4" y1="1" x2="4" y2="3.5"/><line x1="8" y1="1" x2="8" y2="3.5"/><line x1="1" y1="5" x2="11" y2="5"/>
          </svg>
          10-Jun-2026
        </div>
      </div>
    </header>
  );
}

// ── FOOTER ───────────────────────────────────────────────────────────────
function V2Footer() {
  return (
    <footer style={{ borderTop:'1px solid var(--border)', padding:'44px 48px 32px', marginTop:100 }}>
      <div style={{ maxWidth:1300, margin:'0 auto', display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <div>
          <div style={{ fontFamily:'var(--font-display)', fontSize:17, color:'var(--ink)', marginBottom:4 }}>Vinaadi</div>
          <div style={{ fontSize:13, color:'var(--muted)', fontStyle:'italic' }}>Jyotish guidance · every morning</div>
        </div>
        <p style={{ fontSize:11, color:'var(--muted-2)', maxWidth:420, lineHeight:1.65, textAlign:'right' }}>
          Astrology is a traditional belief system. For medical, legal, or financial decisions, consult a qualified professional. © 2026 Vinaadi
        </p>
      </div>
    </footer>
  );
}

// ── UNDERLINE FIELD ───────────────────────────────────────────────────────
function UField({ label, defaultValue, type='text', helpText, required, mono, half }) {
  const [foc, setFoc] = React.useState(false);
  return (
    <div style={{ flex: half ? '1 1 calc(50% - 10px)' : '1 1 100%', minWidth:0 }}>
      <label style={{
        display:'block', fontSize:10, letterSpacing:'0.12em',
        textTransform:'uppercase', fontWeight:600,
        color: foc ? 'var(--accent)' : 'var(--muted-2)',
        marginBottom:6, transition:'color 0.15s',
      }}>
        {label}{required && <span style={{ color:'var(--accent)', marginLeft:2 }}>*</span>}
      </label>
      <input type={type} defaultValue={defaultValue}
        onFocus={() => setFoc(true)} onBlur={() => setFoc(false)}
        style={{
          width:'100%', padding:'0 0 8px',
          border:'none', borderBottom:`1.5px solid ${foc ? 'var(--accent)' : 'var(--border-2)'}`,
          background:'transparent', fontSize:14, color:'var(--ink)', outline:'none',
          fontFamily: mono ? 'var(--font-mono)' : 'inherit',
          transition:'border-color 0.15s',
        }}
      />
      {helpText && <div style={{ fontSize:11, color:'var(--accent)', marginTop:5, lineHeight:1.4 }}>{helpText}</div>}
    </div>
  );
}

function USelect({ label, defaultValue, options }) {
  const [foc, setFoc] = React.useState(false);
  return (
    <div style={{ flex:'1 1 calc(50% - 10px)', minWidth:0 }}>
      <label style={{ display:'block', fontSize:10, letterSpacing:'0.12em', textTransform:'uppercase', fontWeight:600, color:'var(--muted-2)', marginBottom:6 }}>
        {label}
      </label>
      <select defaultValue={defaultValue}
        onFocus={() => setFoc(true)} onBlur={() => setFoc(false)}
        style={{
          width:'100%', padding:'0 0 8px', border:'none',
          borderBottom:`1.5px solid ${foc ? 'var(--accent)' : 'var(--border-2)'}`,
          background:'transparent', fontSize:14, color:'var(--ink)',
          outline:'none', fontFamily:'inherit', appearance:'none', cursor:'pointer',
          transition:'border-color 0.15s',
        }}>
        {options.map(o => <option key={o.value||o} value={o.value||o}>{o.label||o}</option>)}
      </select>
    </div>
  );
}

function UTextarea({ label, defaultValue, rows=3 }) {
  const [foc, setFoc] = React.useState(false);
  return (
    <div style={{ flex:'1 1 100%' }}>
      <label style={{ display:'block', fontSize:10, letterSpacing:'0.12em', textTransform:'uppercase', fontWeight:600, color: foc ? 'var(--accent)' : 'var(--muted-2)', marginBottom:6, transition:'color 0.15s' }}>
        {label}
      </label>
      <textarea defaultValue={defaultValue} rows={rows}
        onFocus={() => setFoc(true)} onBlur={() => setFoc(false)}
        style={{
          width:'100%', padding:'10px 12px',
          border:`1px solid ${foc ? 'var(--accent)' : 'var(--border)'}`,
          borderRadius:8, background: foc ? 'var(--surface)' : 'var(--surface-2)',
          fontSize:14, color:'var(--ink)', outline:'none',
          fontFamily:'inherit', resize:'vertical', lineHeight:1.6,
          transition:'all 0.15s',
        }}
      />
    </div>
  );
}

// ── BUTTON ────────────────────────────────────────────────────────────────
function V2Btn({ children, primary, ghost, small, wide, onClick, style }) {
  const [hov, setHov] = React.useState(false);
  const base = {
    display:'inline-flex', alignItems:'center', justifyContent:'center', gap:7,
    padding: small ? '7px 16px' : '11px 24px',
    borderRadius:999, fontSize: small ? 12 : 13, fontWeight:500,
    cursor:'pointer', fontFamily:'inherit', transition:'all 0.15s',
    border:'1px solid var(--border-2)', background: hov ? 'var(--bg-2)' : 'var(--surface)',
    color:'var(--ink-2)', width: wide ? '100%' : 'auto', ...style,
  };
  if (primary) Object.assign(base, { background: hov ? '#9C4D24' : 'var(--accent)', border:'none', color:'#fff' });
  if (ghost)   Object.assign(base, { background: hov ? 'var(--surface-2)' : 'transparent', border:'1px solid var(--border)', color:'var(--muted)' });
  return <button onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={base}>{children}</button>;
}

// ── PERSON FORM ───────────────────────────────────────────────────────────
function PersonSection({ num, data, accentColor }) {
  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:28, height:28, borderRadius:'50%', background: accentColor === 'var(--accent)' ? 'var(--accent-soft)' : 'var(--bg-2)', border:`1px solid ${accentColor === 'var(--accent)' ? 'var(--accent)' : 'var(--border)'}44`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color: accentColor || 'var(--muted)', fontFamily:'var(--font-display)' }}>{num}</div>
          <span style={{ fontSize:13, fontWeight:600, color:'var(--ink-2)', letterSpacing:'0.01em' }}>
            {num === 1 ? data.name || 'Person 1' : data.name || 'Person 2'}
          </span>
        </div>
        <select defaultValue="" style={{
          fontSize:11, color:'var(--accent)', border:'none',
          background:'transparent', fontFamily:'inherit', cursor:'pointer', fontWeight:500,
        }}>
          <option value="">↓ Load from family</option>
          <option>Senthilkumar</option><option>Kaviya</option>
        </select>
      </div>
      <div style={{ display:'flex', flexWrap:'wrap', gap:'20px 20px' }}>
        <UField label="Name" defaultValue={data.name} required/>
        <UField label="Birth Date" defaultValue={data.dob} half/>
        <UField label="Birth Time" defaultValue={data.time} half/>
        <UField label="Birth Place" defaultValue={data.place} helpText="Select a city to auto-fill lat/lng" required/>
        <UField label="Timezone" defaultValue={data.tz} required/>
        <UField label="Latitude" defaultValue={data.lat} mono half/>
        <UField label="Longitude" defaultValue={data.lng} mono half/>
      </div>
    </div>
  );
}

// ── KUTA ROW ─────────────────────────────────────────────────────────────
function V2KutaRow({ name, score, max }) {
  const pct = max > 0 ? score / max : 0;
  const clr = pct === 1 ? 'var(--sage)' : pct === 0 ? 'var(--caution)' : 'var(--accent)';
  return (
    <div style={{ display:'flex', alignItems:'center', gap:20, padding:'12px 0', borderBottom:'1px solid var(--border)' }}>
      <div style={{ width:110, fontSize:13, color:'var(--ink-2)', flexShrink:0 }}>{name}</div>
      <div style={{ flex:1, height:4, background:'var(--border)', borderRadius:2, overflow:'hidden' }}>
        <div style={{ width:`${pct*100}%`, height:'100%', background:clr, borderRadius:2, transition:'width 1s cubic-bezier(.4,0,.2,1)' }}/>
      </div>
      <div style={{ width:38, textAlign:'right', fontSize:12, fontWeight:600, color:clr, fontFamily:'var(--font-mono)', flexShrink:0 }}>{score}/{max}</div>
    </div>
  );
}

// ── SCORE ARC ─────────────────────────────────────────────────────────────
function V2ScoreArc({ score, max }) {
  const pct = score / max;
  const clr = pct >= 0.6 ? 'var(--sage)' : pct >= 0.4 ? 'var(--accent)' : 'var(--caution)';
  const softBg = pct >= 0.6 ? 'var(--sage-soft)' : pct >= 0.4 ? 'var(--accent-soft)' : 'var(--caution-soft)';
  const label = pct >= 0.6 ? 'GOOD' : pct >= 0.4 ? 'FAIR' : 'CHALLENGING';
  const desc = pct >= 0.6 ? 'Traditionally considered suitable with a mindful approach.' : pct >= 0.4 ? 'Moderate — approach with awareness and openness.' : 'Significant differences; proceed with full awareness.';
  const R = 64, sz = 168, cx = sz/2, cy = sz/2;
  const C = 2*Math.PI*R;
  return (
    <div style={{ display:'flex', alignItems:'center', gap:36 }}>
      <div style={{ position:'relative', width:sz, height:sz, flexShrink:0 }}>
        <svg width={sz} height={sz} viewBox={`0 0 ${sz} ${sz}`}>
          <circle cx={cx} cy={cy} r={R} fill="none" stroke="var(--border)" strokeWidth="10"
            strokeDasharray={`${C*0.75} ${C}`} strokeLinecap="round" transform={`rotate(135 ${cx} ${cy})`}/>
          <circle cx={cx} cy={cy} r={R} fill="none" stroke={clr} strokeWidth="10"
            strokeDasharray={`${C*0.75*pct} ${C}`} strokeLinecap="round" transform={`rotate(135 ${cx} ${cy})`}/>
        </svg>
        <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:2 }}>
          <div style={{ fontFamily:'var(--font-display)', fontSize:52, lineHeight:1, color:'var(--ink)', letterSpacing:'-0.03em' }}>{score}</div>
          <div style={{ fontSize:11, color:'var(--muted)', letterSpacing:'0.06em' }}>of {max}</div>
        </div>
      </div>
      <div>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
          <span style={{ fontFamily:'var(--font-display)', fontSize:28, color:clr, letterSpacing:'-0.02em' }}>{Math.round(pct*100)}%</span>
          <span style={{ fontSize:10, letterSpacing:'0.14em', textTransform:'uppercase', color:clr, fontWeight:700, background:softBg, padding:'3px 10px', borderRadius:999 }}>{label}</span>
        </div>
        <p style={{ fontSize:14, color:'var(--ink-2)', lineHeight:1.7, maxWidth:280, marginBottom:8 }}>
          Porutham score {score}/{max}. {desc}
        </p>
        <p style={{ fontSize:12, color:'var(--muted)', lineHeight:1.5 }}>
          Marriage context: Sthira kuta (stability) and Raju dosha carry most weight.
        </p>
      </div>
    </div>
  );
}

// ── BIRTH CHART ───────────────────────────────────────────────────────────
function V2BirthChart({ lagna='Mesham', name, planetsMap={}, cellSize=64 }) {
  return (
    <div>
      {name && <div style={{ fontFamily:'var(--font-display)', fontSize:16, color:'var(--accent)', marginBottom:10 }}>{name}</div>}
      <div style={{ display:'inline-grid', gridTemplateColumns:`repeat(4, ${cellSize}px)`, gridTemplateRows:`repeat(4, ${cellSize}px)`, border:'1px solid var(--border-2)', borderRadius:10, overflow:'hidden' }}>
        <div style={{ gridRow:'2/4', gridColumn:'2/4', background:'var(--surface-2)', border:'1px solid var(--border)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center', padding:6 }}>
          {name && <div style={{ fontSize:10, fontWeight:600, color:'var(--ink-2)', lineHeight:1.3 }}>{name.split(' ')[0]}</div>}
          <div style={{ fontSize:9, color:'var(--muted)', marginTop:2 }}>{lagna} La</div>
        </div>
        {RASI_GRID.map(({ rasi, row, col }) => {
          const isLagna = rasi === lagna;
          const planets = planetsMap[rasi] || [];
          return (
            <div key={rasi} style={{ gridRow:row, gridColumn:col, background: isLagna ? 'var(--accent-soft)' : 'var(--surface)', border:'1px solid var(--border)', padding:'5px 6px', display:'flex', flexDirection:'column', gap:3 }}>
              <div style={{ fontSize:8, color: isLagna ? 'var(--accent)' : 'var(--muted-2)', fontWeight: isLagna ? 700 : 400, lineHeight:1, letterSpacing:'0.02em' }}>
                {rasi.slice(0,3)}
              </div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:2 }}>
                {planets.map(p => (
                  <span key={p} style={{ fontSize:9, fontWeight:700, color: V2_PLANET_CLR[p]||'var(--ink-2)', lineHeight:1.2 }}>{p}</span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── RESULTS EMPTY STATE ────────────────────────────────────────────────────
function EmptyResults({ symbol, text }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:400, textAlign:'center', gap:16 }}>
      <div style={{ fontFamily:'var(--font-display)', fontSize:64, color:'var(--border)', lineHeight:1 }}>{symbol}</div>
      <p style={{ fontSize:14, color:'var(--muted)', lineHeight:1.7, maxWidth:300 }}>{text}</p>
    </div>
  );
}

// ── RESULTS SECTION HEADER ─────────────────────────────────────────────────
function ResultsHeader({ children }) {
  return (
    <div style={{ fontSize:10, letterSpacing:'0.14em', textTransform:'uppercase', fontWeight:700, color:'var(--muted)', marginBottom:16 }}>
      {children}
    </div>
  );
}

Object.assign(window, {
  RASI_GRID, V2_PLANETS, V2_PLANET_CLR,
  V2Nav, V2Footer, UField, USelect, UTextarea, V2Btn,
  PersonSection, V2KutaRow, V2ScoreArc, V2BirthChart,
  EmptyResults, ResultsHeader,
});
