// tools-v2-panels.jsx — v4: vertical form, results below on generation

// ── COMPATIBILITY ──────────────────────────────────────────────────────────
function V2CompatibilityPanel() {
  const [ctx, setCtx] = React.useState('Marriage');
  const [generated, setGenerated] = React.useState(false);
  const contexts = ['General','Marriage','Friendship','Business','Family'];

  const kutas = [
    { name:'Dinam',        score:3, max:3 },
    { name:'Ganam',        score:0, max:6 },
    { name:'Yoni',         score:2, max:4 },
    { name:'Rasi',         score:7, max:7 },
    { name:'Graha Maitri', score:3, max:5 },
    { name:'Vasya',        score:2, max:2 },
    { name:'Mahendra',     score:0, max:4 },
    { name:'Stree Dirgha', score:5, max:5 },
  ];

  return (
    <div style={{ maxWidth:680 }}>

      {/* Context */}
      <div style={{ marginBottom:32 }}>
        <div className="eyebrow" style={{ marginBottom:12 }}>Context</div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
          {contexts.map(c => (
            <button key={c} onClick={() => setCtx(c)} style={{
              padding:'6px 18px', borderRadius:999,
              border:`1px solid ${c===ctx ? 'var(--accent)' : 'var(--border)'}`,
              background: c===ctx ? 'var(--accent-soft)' : 'transparent',
              color: c===ctx ? 'var(--accent)' : 'var(--muted)',
              fontSize:13, fontWeight: c===ctx ? 600 : 400,
              cursor:'pointer', fontFamily:'inherit', transition:'all 0.15s',
            }}>{c}</button>
          ))}
        </div>
      </div>

      {/* Person 1 */}
      <div style={{ marginBottom:28 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:28, height:28, borderRadius:'50%', background:'var(--accent-soft)', border:'1px solid var(--accent)33', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color:'var(--accent)', fontFamily:'var(--font-display)' }}>1</div>
            <span style={{ fontSize:14, fontWeight:600, color:'var(--ink-2)' }}>Person 1</span>
          </div>
          <select defaultValue="" style={{ fontSize:12, color:'var(--accent)', border:'none', background:'transparent', fontFamily:'inherit', cursor:'pointer', fontWeight:500 }}>
            <option value="">↓ Load from family</option>
            <option>Kaviya</option><option>Senthilkumar</option>
          </select>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
          <UField label="Name" defaultValue="Kaviya" required/>
          <div style={{ display:'flex', gap:24 }}>
            <UField label="Birth Date" defaultValue="22-Feb-2002" half/>
            <UField label="Birth Time" defaultValue="01:10 PM" half/>
          </div>
          <UField label="Birth Place" defaultValue="Coimbatore, Tamil Nadu, India" helpText="Select a city to auto-fill lat/lng" required/>
          <UField label="Timezone" defaultValue="Asia/Kolkata" required/>
          <div style={{ display:'flex', gap:24 }}>
            <UField label="Latitude" defaultValue="11.0000" mono half/>
            <UField label="Longitude" defaultValue="77.0000" mono half/>
          </div>
        </div>
      </div>

      {/* VS divider */}
      <div style={{ display:'flex', alignItems:'center', gap:16, margin:'32px 0' }}>
        <div style={{ flex:1, height:1, background:'var(--border)' }}/>
        <span style={{ fontFamily:'var(--font-display)', fontSize:16, color:'var(--muted-2)', fontStyle:'italic' }}>vs</span>
        <div style={{ flex:1, height:1, background:'var(--border)' }}/>
      </div>

      {/* Person 2 */}
      <div style={{ marginBottom:36 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:28, height:28, borderRadius:'50%', background:'var(--bg-2)', border:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color:'var(--muted)', fontFamily:'var(--font-display)' }}>2</div>
            <span style={{ fontSize:14, fontWeight:600, color:'var(--ink-2)' }}>Person 2</span>
          </div>
          <select defaultValue="" style={{ fontSize:12, color:'var(--accent)', border:'none', background:'transparent', fontFamily:'inherit', cursor:'pointer', fontWeight:500 }}>
            <option value="">↓ Load from family</option>
            <option>Senthilkumar</option><option>Kaviya</option>
          </select>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
          <UField label="Name" defaultValue="Senthilkumar" required/>
          <div style={{ display:'flex', gap:24 }}>
            <UField label="Birth Date" defaultValue="15-Mar-1993" half/>
            <UField label="Birth Time" defaultValue="08:15 AM" half/>
          </div>
          <UField label="Birth Place" defaultValue="Coimbatore, Tamil Nadu, India" helpText="Select a city to auto-fill lat/lng" required/>
          <UField label="Timezone" defaultValue="Asia/Kolkata" required/>
          <div style={{ display:'flex', gap:24 }}>
            <UField label="Latitude" defaultValue="11.0000" mono half/>
            <UField label="Longitude" defaultValue="77.0000" mono half/>
          </div>
        </div>
      </div>

      <V2Btn primary onClick={() => setGenerated(true)}>Check Compatibility →</V2Btn>

      {/* ── RESULTS ── */}
      {generated && (
        <div style={{ marginTop:56 }}>
          <div style={{ height:1, background:'var(--border)', marginBottom:48 }}/>

          {/* Score */}
          <div style={{ marginBottom:48 }}>
            <div className="eyebrow" style={{ marginBottom:20 }}>Total Score</div>
            <V2ScoreArc score={22} max={36}/>
          </div>

          {/* Kuta breakdown */}
          <div style={{ marginBottom:48 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:4 }}>
              <div className="eyebrow">Kuta Breakdown</div>
              <V2Btn small>↓ Download PDF</V2Btn>
            </div>
            {kutas.map(k => <V2KutaRow key={k.name} {...k}/>)}
          </div>

          {/* Birth charts */}
          <div style={{ marginBottom:24 }}>
            <div className="eyebrow" style={{ marginBottom:20 }}>Birth Charts — D1</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:36 }}>
              <V2BirthChart lagna="Rishabam" name="Kaviya" planetsMap={V2_PLANETS.kaviya} cellSize={64}/>
              <V2BirthChart lagna="Mesham" name="Senthilkumar" planetsMap={V2_PLANETS.senthil} cellSize={64}/>
            </div>
          </div>

          <p style={{ fontSize:11, color:'var(--muted-2)', fontStyle:'italic', lineHeight:1.5 }}>
            Temporary charts — auto-deleted when you leave this session.
          </p>
        </div>
      )}
    </div>
  );
}

// ── GENERATE CHART ─────────────────────────────────────────────────────────
function V2GenerateChartPanel() {
  const [generated, setGenerated] = React.useState(false);
  const [view, setView] = React.useState('D1 — Birth chart');
  const views = ['Print Jathagam','D1 — Birth chart','D9 — Navamsa'];

  return (
    <div style={{ maxWidth:680 }}>

      {/* Notice */}
      <div style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'8px 14px', background:'var(--accent-soft)', borderRadius:8, fontSize:12, color:'var(--accent)', marginBottom:32, alignSelf:'flex-start' }}>
        <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
          <circle cx="7" cy="7" r="6" stroke="var(--accent)" strokeWidth="1.2"/>
          <line x1="7" y1="4" x2="7" y2="7.5" stroke="var(--accent)" strokeWidth="1.4" strokeLinecap="round"/>
          <circle cx="7" cy="9.5" r="0.8" fill="var(--accent)"/>
        </svg>
        Temporary chart — auto-deleted when you leave this session.
      </div>

      {/* Form */}
      <div style={{ display:'flex', flexDirection:'column', gap:24, marginBottom:36 }}>
        <UField label="Name" defaultValue="Senthilkumar" required/>
        <div style={{ display:'flex', gap:24 }}>
          <UField label="Birth Date" defaultValue="15-Mar-1993" half/>
          <UField label="Birth Time" defaultValue="08:15 AM" half/>
        </div>
        <UField label="Birth Place" defaultValue="Coimbatore, Tamil Nadu, India" helpText="Select a city to auto-fill lat/lng" required/>
        <UField label="Timezone" defaultValue="Asia/Kolkata" required/>
        <div style={{ display:'flex', gap:24 }}>
          <UField label="Latitude" defaultValue="11.0000" mono half/>
          <UField label="Longitude" defaultValue="77.0000" mono half/>
        </div>
      </div>

      <V2Btn primary onClick={() => setGenerated(true)}>Generate Chart →</V2Btn>

      {/* ── CHART OUTPUT ── */}
      {generated && (
        <div style={{ marginTop:56 }}>
          <div style={{ height:1, background:'var(--border)', marginBottom:48 }}/>

          {/* Header band */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:32 }}>
            <div>
              <div style={{ fontFamily:'var(--font-display)', fontSize:36, color:'var(--accent)', letterSpacing:'-0.025em', lineHeight:1 }}>Senthilkumar</div>
              <div style={{ fontSize:13, color:'var(--muted)', marginTop:6 }}>Born 15 March 1993 · Coimbatore, Tamil Nadu</div>
            </div>
            <span style={{ fontSize:10, letterSpacing:'0.12em', textTransform:'uppercase', fontWeight:700, color:'var(--sage)', background:'var(--sage-soft)', padding:'5px 13px', borderRadius:999, marginTop:4 }}>D1 Ready</span>
          </div>

          {/* View tabs */}
          <div style={{ display:'flex', gap:6, marginBottom:28 }}>
            {views.map(v => {
              const act = v === view;
              return (
                <button key={v} onClick={() => setView(v)} style={{
                  padding:'6px 16px', borderRadius:999, fontSize:12, fontWeight: act ? 600 : 400,
                  border:`1px solid ${act ? 'var(--accent)' : 'var(--border)'}`,
                  background: act ? 'var(--accent-soft)' : 'transparent',
                  color: act ? 'var(--accent)' : 'var(--muted)',
                  cursor:'pointer', fontFamily:'inherit', transition:'all 0.15s',
                }}>{v}</button>
              );
            })}
          </div>

          {/* Stats grid */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:12, marginBottom:28 }}>
            {[['NAME','Senthilkumar'],['AGE','33'],['RASI','Dhanusu'],['LAGNAM','Mesham'],['NAKSHATHIRAM','Moolam (Pada 1)'],['CURRENT DASHA','Moon / Moon']].map(([l,v]) => (
              <div key={l} style={{ background:'var(--surface-2)', borderRadius:10, padding:'12px 14px' }}>
                <div style={{ fontSize:9, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--muted)', marginBottom:5, fontWeight:700 }}>{l}</div>
                <div style={{ fontSize:13, fontWeight:600, color:'var(--ink)' }}>{v}</div>
              </div>
            ))}
          </div>

          {/* Calc method */}
          <div style={{ background:'var(--bg-2)', borderRadius:10, padding:'13px 18px', fontSize:12, color:'var(--muted)', lineHeight:1.75, marginBottom:32 }}>
            <div style={{ fontSize:9, letterSpacing:'0.12em', textTransform:'uppercase', fontWeight:700, color:'var(--muted)', marginBottom:6 }}>Calculation Method</div>
            Version: <strong style={{ color:'var(--ink-2)' }}>thirukanitham-2026-v1</strong> &nbsp;·&nbsp;
            Ayanamsa: <strong style={{ color:'var(--ink-2)' }}>LAHIRI</strong> &nbsp;·&nbsp;
            Ephemeris: <strong style={{ color:'var(--ink-2)' }}>swisseph-ffi</strong><br/>
            House style: Whole-sign from Lagna · Dasha: Vimshottari from Moon longitude.
          </div>

          {/* Chart + explain */}
          <div>
            <div className="eyebrow" style={{ marginBottom:20 }}>D1 — Birth Chart</div>
            <div style={{ display:'flex', gap:32, alignItems:'flex-start', flexWrap:'wrap' }}>
              <V2BirthChart lagna="Mesham" name="Senthilkumar" planetsMap={V2_PLANETS.senthil} cellSize={68}/>
              <div style={{ background:'var(--surface-2)', border:'1px solid var(--border)', borderRadius:12, padding:'20px 22px', flex:1, minWidth:180 }}>
                <div style={{ fontSize:9, letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--accent)', fontWeight:700, marginBottom:14 }}>Tap to explain</div>
                <div style={{ fontSize:15, fontWeight:600, color:'var(--ink-2)', marginBottom:4 }}>Mesham (Rasi 1) · Lagna</div>
                <div style={{ fontSize:12, color:'var(--muted)', marginBottom:14 }}>From D1 Lagna: House 1</div>
                <span style={{ fontSize:11, letterSpacing:'0.08em', textTransform:'uppercase', fontWeight:700, color:'var(--accent)', background:'var(--accent-soft)', padding:'3px 10px', borderRadius:999 }}>Lagna 0.90°</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── RETROSPECTIVE ──────────────────────────────────────────────────────────
function V2RetrospectivePanel() {
  const [generated, setGenerated] = React.useState(false);

  const recurrences = [
    { date:'Late Dec 2024', desc:'Sensitive-house signature for relationship re-activates across Moon/Lagna references.' },
    { date:'Late Apr 2025', desc:'Sensitive-house signature for relationship re-activates across Moon/Lagna references.' },
    { date:'Late Nov 2025', desc:'Sensitive-house signature for relationship re-activates across Moon/Lagna references.' },
  ];

  return (
    <div style={{ maxWidth:680 }}>
      <p style={{ fontSize:14, color:'var(--accent)', fontStyle:'italic', lineHeight:1.7, marginBottom:36 }}>
        Enter a past event to see its astrological correlation and future recurrence patterns.
      </p>

      <div style={{ display:'flex', flexDirection:'column', gap:24, marginBottom:36 }}>
        <UField label="Event Date" defaultValue="27-Nov-2024" required/>
        <USelect label="Event Type" defaultValue="Relationship" options={['Relationship','Career','Health','Finance','Education','Travel','Family','Other']}/>
        <UTextarea label="Event Description" defaultValue="got married"/>
      </div>

      <div style={{ display:'flex', gap:10 }}>
        <V2Btn primary onClick={() => setGenerated(true)}>Analyse Event →</V2Btn>
        <V2Btn ghost>History</V2Btn>
      </div>

      {generated && (
        <div style={{ marginTop:56 }}>
          <div style={{ height:1, background:'var(--border)', marginBottom:48 }}/>

          {/* Active dasha */}
          <div style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 20px', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, marginBottom:36 }}>
            <div style={{ fontSize:10, letterSpacing:'0.12em', textTransform:'uppercase', fontWeight:700, color:'var(--muted-2)', flexShrink:0 }}>Active Dasha</div>
            <div style={{ width:1, height:14, background:'var(--border)', flexShrink:0 }}/>
            <span style={{ fontSize:13, color:'var(--accent)', fontWeight:500, flex:1 }}>SUN Maha Dasha · KETU Antar Dasha · VENUS Pratyantar</span>
            <span style={{ fontSize:11, color:'var(--muted-2)', fontFamily:'var(--font-mono)', flexShrink:0 }}>2024-11-27</span>
          </div>

          {/* Correlation */}
          <div style={{ marginBottom:36 }}>
            <div className="eyebrow" style={{ marginBottom:14 }}>Astrological Correlation</div>
            <p style={{ fontSize:14, color:'var(--ink-2)', lineHeight:1.75, margin:0 }}>
              At the time of <em>'got married'</em>, SUN Maha Dasha / KETU Antar Dasha / VENUS Pratyantar was active.
              JUPITER was in house 6 from Moon and house 2 from Lagna. In Tamil Jyothidam, this pattern is traditionally associated with relationship-linked phases.
            </p>
          </div>

          {/* Transits */}
          <div style={{ marginBottom:36 }}>
            <div className="eyebrow" style={{ marginBottom:14 }}>Key Transits</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:7 }}>
              {['Jupiter H6L2 · conjunct natal KETU','Sun H12L8','Saturn H3L11 · conjunct natal MERCURY','Rahu H4L12'].map(t => (
                <span key={t} style={{ padding:'5px 13px', borderRadius:999, fontSize:12, background:'var(--surface-2)', border:'1px solid var(--border)', color:'var(--ink-2)' }}>{t}</span>
              ))}
            </div>
          </div>

          {/* Recurrences */}
          <div style={{ marginBottom:36 }}>
            <div className="eyebrow" style={{ marginBottom:14 }}>Future Recurrences</div>
            <div style={{ border:'1px solid var(--border)', borderRadius:12, overflow:'hidden' }}>
              {recurrences.map((r, i) => (
                <div key={i} style={{ display:'grid', gridTemplateColumns:'130px 1fr', gap:16, padding:'16px 22px', borderBottom: i < recurrences.length-1 ? '1px solid var(--border)' : 'none', alignItems:'start' }}>
                  <div>
                    <div style={{ fontSize:13, fontWeight:600, color:'var(--ink-2)', marginBottom:5 }}>{r.date}</div>
                    <span style={{ fontSize:10, letterSpacing:'0.08em', textTransform:'uppercase', fontWeight:700, color:'var(--sage)', background:'var(--sage-soft)', padding:'2px 9px', borderRadius:999 }}>Similar</span>
                  </div>
                  <div style={{ fontSize:13, color:'var(--muted)', lineHeight:1.65 }}>{r.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Caution */}
          <div style={{ background:'var(--caution-soft)', borderRadius:12, padding:'16px 20px', display:'flex', gap:12, alignItems:'flex-start' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink:0, marginTop:1 }}>
              <path d="M8 2L14.5 13H1.5L8 2Z" stroke="var(--caution)" strokeWidth="1.2" fill="none" strokeLinejoin="round"/>
              <line x1="8" y1="6.5" x2="8" y2="10" stroke="var(--caution)" strokeWidth="1.4" strokeLinecap="round"/>
              <circle cx="8" cy="11.5" r="0.75" fill="var(--caution)"/>
            </svg>
            <div>
              <div style={{ fontSize:10, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--caution)', fontWeight:700, marginBottom:6 }}>Caution</div>
              <div style={{ fontSize:13, color:'var(--caution)', lineHeight:1.65 }}>This does not mean the same event repeats; it indicates a similar quality window for mindful planning.</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── ANNUAL WRAPPED ─────────────────────────────────────────────────────────
function V2AnnualWrappedPanel() {
  const years = ['2026','2025','2024','2023'];
  const [yr, setYr] = React.useState('2025');
  const [generated, setGenerated] = React.useState(false);

  return (
    <div style={{ maxWidth:680 }}>
      <div style={{ marginBottom:28 }}>
        <div style={{ fontFamily:'var(--font-display)', fontSize:10, letterSpacing:'0.16em', textTransform:'uppercase', color:'var(--accent)', marginBottom:16 }}>Annual Wrapped</div>
        <div style={{ fontFamily:'var(--font-display)', fontSize:64, color:'var(--ink)', letterSpacing:'-0.04em', lineHeight:0.95, marginBottom:12 }}>
          {yr}
        </div>
        <div style={{ fontFamily:'var(--font-display)', fontSize:28, color:'var(--muted)', fontStyle:'italic' }}>in review.</div>
      </div>

      <p style={{ fontSize:14, color:'var(--muted)', lineHeight:1.7, marginBottom:32 }}>
        Your astrological year — key dasha transitions, planetary periods, and Jyotish themes that shaped {yr}.
      </p>

      <div style={{ marginBottom:36 }}>
        <div className="eyebrow" style={{ marginBottom:12 }}>Select Year</div>
        <div style={{ display:'flex', gap:6 }}>
          {years.map(y => (
            <button key={y} onClick={() => { setYr(y); setGenerated(false); }} style={{
              padding:'7px 20px', borderRadius:999,
              border:`1px solid ${y===yr ? 'var(--accent)' : 'var(--border)'}`,
              background: y===yr ? 'var(--accent-soft)' : 'transparent',
              color: y===yr ? 'var(--accent)' : 'var(--muted)',
              fontSize:13, fontWeight: y===yr ? 600 : 400,
              cursor:'pointer', fontFamily:'inherit', transition:'all 0.15s',
            }}>{y}</button>
          ))}
        </div>
      </div>

      <V2Btn primary onClick={() => setGenerated(true)}>Generate {yr} Report →</V2Btn>
      <div style={{ fontSize:11, color:'var(--muted-2)', marginTop:12 }}>Available for all years you've used Vinaadi</div>

      {generated && (
        <div style={{ marginTop:56 }}>
          <div style={{ height:1, background:'var(--border)', marginBottom:48 }}/>
          <div className="eyebrow" style={{ marginBottom:20 }}>{yr} Summary</div>
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {[
              { label:'Year Theme',     val:'Home & Foundations',  note:'Saturn 4th / Rahu 10th axis — focus on roots, property, stability.' },
              { label:'Dominant Dasha', val:'Moon Maha Dasha',     note:'Began Mar 2024 · 10-year cycle · emotional intelligence front and centre.' },
              { label:'Best Period',    val:'Feb – May 2025',      note:'Jupiter transiting 1st house — expansion, optimism, new beginnings.' },
              { label:'Caution Period', val:'Aug – Oct 2025',      note:'Saturn retrograde over natal 4th lord — revisit home or family matters.' },
              { label:'Eclipse Axis',   val:'Mesham – Thulam',     note:'Solar eclipses activating Lagna / 7th house — identity and partnerships.' },
            ].map(r => (
              <div key={r.label} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:'18px 24px', display:'grid', gridTemplateColumns:'170px 1fr', gap:16, alignItems:'start' }}>
                <div>
                  <div style={{ fontSize:9, letterSpacing:'0.1em', textTransform:'uppercase', fontWeight:700, color:'var(--muted)', marginBottom:5 }}>{r.label}</div>
                  <div style={{ fontFamily:'var(--font-display)', fontSize:18, color:'var(--ink)', lineHeight:1.2 }}>{r.val}</div>
                </div>
                <p style={{ fontSize:13, color:'var(--muted)', lineHeight:1.65, margin:0 }}>{r.note}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

Object.assign(window, {
  V2CompatibilityPanel, V2GenerateChartPanel, V2RetrospectivePanel, V2AnnualWrappedPanel,
});
