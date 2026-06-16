// tools-v3-panels.jsx

// ── COMPATIBILITY ─────────────────────────────────────────────────────────
function V3CompatibilityPanel() {
  const [ctx, setCtx] = React.useState('Marriage');
  const [generated, setGenerated] = React.useState(false);
  const contexts = ['General','Marriage','Friendship','Business','Family'];

  const person1 = { name:'Kaviya', dob:'22-Feb-2002', time:'01:10 PM', place:'Erode, Tamil Nadu, India', tz:'Asia/Kolkata', lat:'11.3333', lng:'77.7667' };
  const person2 = { name:'Senthilkumar', dob:'15-Mar-1993', time:'08:15 AM', place:'Coimbatore, Tamil Nadu, India', tz:'Asia/Kolkata', lat:'11.0000', lng:'77.0000' };

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
    <div>
      {/* Context */}
      <div style={{ marginBottom:32 }}>
        <div className="eyebrow" style={{ marginBottom:12 }}>Context</div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
          {contexts.map(c => (
            <button key={c} onClick={() => setCtx(c)} style={{
              padding:'7px 20px', borderRadius:999,
              border:`1px solid ${c===ctx ? 'var(--accent)' : 'var(--border)'}`,
              background: c===ctx ? 'var(--accent-soft)' : 'transparent',
              color: c===ctx ? 'var(--accent)' : 'var(--muted)',
              fontSize:13, fontWeight: c===ctx ? 600 : 400,
              cursor:'pointer', fontFamily:'inherit', transition:'all 0.15s',
            }}>{c}</button>
          ))}
        </div>
      </div>

      {/* Two-person forms */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:28 }}>
        <V3PersonCard num={1} data={person1} primary/>
        <V3PersonCard num={2} data={person2}/>
      </div>

      <V3Btn primary wide onClick={() => setGenerated(true)}>Check Compatibility →</V3Btn>

      {/* ── RESULTS ── */}
      {generated && (
        <div style={{ marginTop:60, animation:'fadeUp 0.4s ease' }}>
          <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:52 }}>
            <div style={{ flex:1, height:1, background:'var(--border)' }}/>
            <span style={{ fontSize:11, letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--muted-2)', fontWeight:600 }}>Results</span>
            <div style={{ flex:1, height:1, background:'var(--border)' }}/>
          </div>

          {/* Score */}
          <div style={{ marginBottom:52 }}>
            <div className="eyebrow" style={{ marginBottom:20 }}>Total Score</div>
            <V3ScoreArc score={19} max={36}/>
          </div>

          {/* Kuta breakdown */}
          <div style={{ marginBottom:52 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:4 }}>
              <div className="eyebrow">Kuta Breakdown</div>
              <V3Btn small>↓ Download PDF</V3Btn>
            </div>
            <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:16, padding:'4px 24px', marginTop:16 }}>
              {kutas.map(k => <V3KutaRow key={k.name} {...k}/>)}
            </div>
          </div>

          {/* Birth charts */}
          <div style={{ marginBottom:32 }}>
            <div className="eyebrow" style={{ marginBottom:20 }}>Birth Charts — D1</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:40 }}>
              <V3BirthChart lagna="Rishabam" name="Kaviya" planetsMap={V3_PLANETS.kaviya} cellSize={64}/>
              <V3BirthChart lagna="Mesham" name="Senthilkumar" planetsMap={V3_PLANETS.senthil} cellSize={64}/>
            </div>
          </div>
          <p style={{ fontSize:11, color:'var(--muted-2)', fontStyle:'italic', marginTop:8 }}>
            Temporary charts — auto-deleted when you leave this session.
          </p>
        </div>
      )}
    </div>
  );
}

// ── GENERATE CHART ────────────────────────────────────────────────────────
function V3GenerateChartPanel() {
  const [generated, setGenerated] = React.useState(false);
  const [view, setView] = React.useState('D1 — Birth chart');
  const views = ['Print Jathagam','D1 — Birth chart','D9 — Navamsa'];

  return (
    <div style={{ maxWidth:620 }}>
      {/* Info notice */}
      <div style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'8px 16px', background:'var(--accent-soft)', borderRadius:10, fontSize:12, color:'var(--accent)', marginBottom:28, border:'1px solid rgba(184,90,44,0.15)' }}>
        <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
          <circle cx="7" cy="7" r="6" stroke="var(--accent)" strokeWidth="1.2"/>
          <line x1="7" y1="4" x2="7" y2="7.5" stroke="var(--accent)" strokeWidth="1.4" strokeLinecap="round"/>
          <circle cx="7" cy="9.5" r="0.8" fill="var(--accent)"/>
        </svg>
        Temporary chart — auto-deleted when you leave this session.
      </div>

      {/* Form */}
      <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:16, padding:'28px 28px 24px', marginBottom:24 }}>
        <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
          <UField label="Name" defaultValue="Senthilkumar" required/>
          <div style={{ display:'flex', gap:20 }}>
            <UField label="Birth Date" defaultValue="15-Mar-1993" half/>
            <UField label="Birth Time" defaultValue="08:15 AM" half/>
          </div>
          <UField label="Birth Place" defaultValue="Coimbatore, Tamil Nadu, India" helpText="Select a city to auto-fill lat/lng" required/>
          <UField label="Timezone" defaultValue="Asia/Kolkata" required/>
          <div style={{ display:'flex', gap:20 }}>
            <UField label="Latitude" defaultValue="11.0000" mono half/>
            <UField label="Longitude" defaultValue="77.0000" mono half/>
          </div>
        </div>
      </div>

      <V3Btn primary wide onClick={() => setGenerated(true)}>Generate Chart →</V3Btn>

      {/* ── CHART OUTPUT ── */}
      {generated && (
        <div style={{ marginTop:60 }}>
          <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:52 }}>
            <div style={{ flex:1, height:1, background:'var(--border)' }}/>
            <span style={{ fontSize:11, letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--muted-2)', fontWeight:600 }}>Chart Output</span>
            <div style={{ flex:1, height:1, background:'var(--border)' }}/>
          </div>

          {/* Person header */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:28 }}>
            <div>
              <div style={{ fontFamily:'var(--font-display)', fontSize:34, color:'var(--sage)', letterSpacing:'-0.025em', lineHeight:1, marginBottom:6 }}>
                Senthilkumar
              </div>
              <div style={{ fontSize:13, color:'var(--muted)' }}>Born 15 March 1993 · Coimbatore, Tamil Nadu</div>
            </div>
            <span style={{ fontSize:10, letterSpacing:'0.12em', textTransform:'uppercase', fontWeight:700, color:'var(--sage)', background:'var(--sage-soft)', padding:'5px 14px', borderRadius:999, marginTop:4, border:'1px solid rgba(92,118,84,0.2)' }}>
              D1 Ready
            </span>
          </div>

          {/* View selector */}
          <div style={{ display:'flex', gap:6, marginBottom:28 }}>
            {views.map(v => {
              const act = v === view;
              return (
                <button key={v} onClick={() => setView(v)} style={{
                  padding:'7px 18px', borderRadius:999, fontSize:12, fontWeight: act ? 600 : 400,
                  border:`1px solid ${act ? 'var(--sage)' : 'var(--border)'}`,
                  background: act ? 'var(--sage-soft)' : 'transparent',
                  color: act ? 'var(--sage)' : 'var(--muted)',
                  cursor:'pointer', fontFamily:'inherit', transition:'all 0.15s',
                }}>{v}</button>
              );
            })}
          </div>

          {/* Stats grid */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:10, marginBottom:24 }}>
            {[['Name','Senthilkumar'],['Age','33'],['Rasi','Dhanusu'],['Lagnam','Mesham'],['Nakshathiram','Moolam (Pada 1)'],['Current Dasha','Moon / Moon']].map(([l,v]) => (
              <div key={l} style={{ background:'var(--surface-2)', borderRadius:12, padding:'13px 16px', border:'1px solid var(--border)' }}>
                <div style={{ fontSize:9, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--muted)', marginBottom:5, fontWeight:700 }}>{l}</div>
                <div style={{ fontSize:13, fontWeight:600, color:'var(--ink)' }}>{v}</div>
              </div>
            ))}
          </div>

          {/* Calculation method */}
          <div style={{ background:'var(--bg-2)', borderRadius:12, padding:'14px 18px', fontSize:12, color:'var(--muted)', lineHeight:1.8, marginBottom:28, border:'1px solid var(--border)' }}>
            <div style={{ fontSize:9, letterSpacing:'0.12em', textTransform:'uppercase', fontWeight:700, color:'var(--muted-2)', marginBottom:6 }}>Calculation Method</div>
            Version: <strong style={{ color:'var(--ink-2)' }}>thirukanitham-2026-v1</strong>&nbsp;·&nbsp;
            Ayanamsa: <strong style={{ color:'var(--ink-2)' }}>LAHIRI</strong>&nbsp;·&nbsp;
            Ephemeris: <strong style={{ color:'var(--ink-2)' }}>swisseph-ffi</strong><br/>
            House style: Whole-sign from Lagna · Dasha: Vimshottari from Moon longitude.
          </div>

          {/* Birth chart */}
          <div className="eyebrow" style={{ marginBottom:20 }}>D1 — Birth Chart</div>
          <div style={{ display:'flex', gap:28, alignItems:'flex-start', flexWrap:'wrap' }}>
            <V3BirthChart lagna="Mesham" name="Senthilkumar" planetsMap={V3_PLANETS.senthil} cellSize={68}/>
            <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:14, padding:'20px 22px', flex:1, minWidth:180 }}>
              <div style={{ fontSize:9, letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--sage)', fontWeight:700, marginBottom:14 }}>Tap to explain</div>
              <div style={{ fontSize:15, fontWeight:600, color:'var(--ink-2)', marginBottom:5 }}>Mesham (Rasi 1) · Lagna</div>
              <div style={{ fontSize:12, color:'var(--muted)', marginBottom:14 }}>From D1 Lagna: House 1</div>
              <span style={{ fontSize:11, letterSpacing:'0.08em', textTransform:'uppercase', fontWeight:700, color:'var(--sage)', background:'var(--sage-soft)', padding:'4px 12px', borderRadius:999 }}>Lagna 0.90°</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── RETROSPECTIVE ─────────────────────────────────────────────────────────
function V3RetrospectivePanel() {
  const [generated, setGenerated] = React.useState(false);

  const recurrences = [
    { date:'Late Jun 2026', intensity:'Milder',  desc:'Sensitive-house signature for family re-activates (score 5/10 across Moon/Lagna references).' },
    { date:'Late Jul 2026', intensity:'Milder',  desc:'Sensitive-house signature for family re-activates (score 5/10 across Moon/Lagna references).' },
    { date:'Late Sep 2026', intensity:'Similar', desc:'Sensitive-house signature for family re-activates (score 6/10 across Moon/Lagna references).' },
  ];

  return (
    <div style={{ maxWidth:640 }}>
      <p style={{ fontSize:14, color:'var(--accent)', fontStyle:'italic', lineHeight:1.7, marginBottom:28 }}>
        Enter a past event to see its astrological correlation and future recurrence patterns.
      </p>

      {/* Form card */}
      <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:16, padding:'28px 28px 24px', marginBottom:24 }}>
        <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
          <div style={{ display:'flex', gap:20 }}>
            <UField label="Event Date" defaultValue="25-Nov-2025" required half/>
            <USelect label="Event Type" defaultValue="Family" options={['Relationship','Career','Health','Finance','Education','Travel','Family','Other']} half/>
          </div>
          <UTextarea label="Event Description" defaultValue="daughter born" rows={3}/>
        </div>
      </div>

      <div style={{ display:'flex', gap:10 }}>
        <V3Btn primary onClick={() => setGenerated(true)}>Analyse Event →</V3Btn>
        <V3Btn ghost>History</V3Btn>
      </div>

      {/* ── RESULTS ── */}
      {generated && (
        <div style={{ marginTop:60 }}>
          <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:52 }}>
            <div style={{ flex:1, height:1, background:'var(--border)' }}/>
            <span style={{ fontSize:11, letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--muted-2)', fontWeight:600 }}>Analysis</span>
            <div style={{ flex:1, height:1, background:'var(--border)' }}/>
          </div>

          {/* Active Dasha */}
          <div style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 20px', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, marginBottom:32 }}>
            <div style={{ fontSize:10, letterSpacing:'0.12em', textTransform:'uppercase', fontWeight:700, color:'var(--muted-2)', flexShrink:0 }}>Active Dasha</div>
            <div style={{ width:1, height:14, background:'var(--border)', flexShrink:0 }}/>
            <span style={{ fontSize:13, color:'var(--accent)', fontWeight:500, flex:1 }}>SUN Maha Dasha / VENUS Antar Dasha / SATURN Pratyantar</span>
            <span style={{ fontSize:11, color:'var(--muted-2)', fontFamily:'var(--font-mono)', flexShrink:0 }}>2025-11-25</span>
          </div>

          {/* Astrological Correlation */}
          <div style={{ marginBottom:32 }}>
            <div className="eyebrow" style={{ marginBottom:14 }}>Astrological Correlation</div>
            <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:14, padding:'20px 24px' }}>
              <p style={{ fontSize:14, color:'var(--ink-2)', lineHeight:1.8, margin:0 }}>
                At the time of <em>'daughter born'</em>, SUN Maha Dasha / VENUS Antar Dasha / SATURN Pratyantar was active.
                SATURN was in house 4 from Moon and house 12 from Lagna. In Tamil Jyothidam, this pattern is
                traditionally associated with family-linked phases.
              </p>
            </div>
          </div>

          {/* Key Transits */}
          <div style={{ marginBottom:32 }}>
            <div className="eyebrow" style={{ marginBottom:14 }}>Key Transits</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
              {['Saturn H4L12 SATURN conjunct natal SUN','Mars H12L8 MARS conjunct natal RAHU','Jupiter H8L4','Sun H12L8'].map(t => (
                <span key={t} style={{ padding:'6px 15px', borderRadius:999, fontSize:12, background:'var(--surface)', border:'1px solid var(--border)', color:'var(--ink-2)' }}>{t}</span>
              ))}
            </div>
          </div>

          {/* Future Recurrences */}
          <div style={{ marginBottom:32 }}>
            <div className="eyebrow" style={{ marginBottom:14 }}>Future Recurrences</div>
            <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:14, overflow:'hidden' }}>
              {recurrences.map((r, i) => (
                <div key={i} style={{
                  display:'grid', gridTemplateColumns:'150px 1fr', gap:16,
                  padding:'16px 22px',
                  borderBottom: i < recurrences.length-1 ? '1px solid var(--border)' : 'none',
                  alignItems:'start',
                }}>
                  <div>
                    <div style={{ fontSize:13, fontWeight:600, color:'var(--ink-2)', marginBottom:7 }}>{r.date}</div>
                    <span style={{
                      fontSize:10, letterSpacing:'0.08em', textTransform:'uppercase', fontWeight:700,
                      color: r.intensity === 'Similar' ? 'var(--accent)' : 'var(--sage)',
                      background: r.intensity === 'Similar' ? 'var(--accent-soft)' : 'var(--sage-soft)',
                      padding:'3px 10px', borderRadius:999,
                    }}>{r.intensity}</span>
                  </div>
                  <div style={{ fontSize:13, color:'var(--muted)', lineHeight:1.65 }}>{r.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Caution */}
          <div style={{ background:'var(--caution-soft)', borderRadius:12, padding:'16px 20px', display:'flex', gap:14, alignItems:'flex-start', border:'1px solid rgba(168,72,47,0.15)' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink:0, marginTop:1 }}>
              <path d="M8 2L14.5 13H1.5L8 2Z" stroke="var(--caution)" strokeWidth="1.2" fill="none" strokeLinejoin="round"/>
              <line x1="8" y1="6.5" x2="8" y2="10" stroke="var(--caution)" strokeWidth="1.4" strokeLinecap="round"/>
              <circle cx="8" cy="11.5" r="0.75" fill="var(--caution)"/>
            </svg>
            <div>
              <div style={{ fontSize:10, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--caution)', fontWeight:700, marginBottom:5 }}>Caution</div>
              <div style={{ fontSize:13, color:'var(--caution)', lineHeight:1.65 }}>
                This does not mean the same event repeats; it indicates a similar quality window for mindful planning.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── ANNUAL WRAPPED ─────────────────────────────────────────────────────────
function V3AnnualWrappedPanel() {
  const years = ['2026','2025','2024','2023'];
  const [yr, setYr] = React.useState('2025');
  const [generated, setGenerated] = React.useState(false);

  const summaries = [
    { label:'Year Theme',     val:'Home & Foundations',  note:'Saturn 4th / Rahu 10th axis — focus on roots, property, stability.' },
    { label:'Dominant Dasha', val:'Moon Maha Dasha',     note:'Began Mar 2024 · 10-year cycle · emotional intelligence front and centre.' },
    { label:'Best Period',    val:'Feb – May 2025',      note:'Jupiter transiting 1st house — expansion, optimism, new beginnings.' },
    { label:'Caution Period', val:'Aug – Oct 2025',      note:'Saturn retrograde over natal 4th lord — revisit home or family matters.' },
    { label:'Eclipse Axis',   val:'Mesham – Thulam',     note:'Solar eclipses activating Lagna / 7th house — identity and partnerships.' },
  ];

  return (
    <div style={{ maxWidth:640 }}>
      {/* Hero year display */}
      <div style={{ marginBottom:36, paddingBottom:36, borderBottom:'1px solid var(--border)' }}>
        <div style={{ fontFamily:'var(--font-display)', fontSize:80, color:'var(--ink)', letterSpacing:'-0.04em', lineHeight:0.9, marginBottom:6 }}>
          {yr}
        </div>
        <div style={{ fontFamily:'var(--font-display)', fontSize:26, color:'var(--muted)', fontStyle:'italic', marginBottom:16 }}>
          in review.
        </div>
        <p style={{ fontSize:14, color:'var(--muted)', lineHeight:1.7, margin:0 }}>
          Key dasha transitions, planetary periods, and Jyotish themes that shaped {yr}.
        </p>
      </div>

      {/* Year selector */}
      <div style={{ marginBottom:32 }}>
        <div className="eyebrow" style={{ marginBottom:14 }}>Select Year</div>
        <div style={{ display:'flex', gap:8 }}>
          {years.map(y => (
            <button key={y} onClick={() => { setYr(y); setGenerated(false); }} style={{
              padding:'9px 26px', borderRadius:999,
              border:`1px solid ${y===yr ? 'var(--info)' : 'var(--border)'}`,
              background: y===yr ? 'var(--info-soft)' : 'transparent',
              color: y===yr ? 'var(--info)' : 'var(--muted)',
              fontFamily:'var(--font-display)', fontSize:17,
              fontWeight: y===yr ? 600 : 400,
              cursor:'pointer', transition:'all 0.15s',
            }}>{y}</button>
          ))}
        </div>
      </div>

      <V3Btn primary onClick={() => setGenerated(true)}>Generate {yr} Report →</V3Btn>
      <div style={{ fontSize:11, color:'var(--muted-2)', marginTop:10 }}>Available for all years you've used Vinaadi</div>

      {/* ── RESULTS ── */}
      {generated && (
        <div style={{ marginTop:56 }}>
          <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:40 }}>
            <div style={{ flex:1, height:1, background:'var(--border)' }}/>
            <span style={{ fontSize:11, letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--muted-2)', fontWeight:600 }}>{yr} Summary</span>
            <div style={{ flex:1, height:1, background:'var(--border)' }}/>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {summaries.map((r, i) => (
              <div key={r.label} style={{
                background:'var(--surface)', border:'1px solid var(--border)',
                borderRadius:14, padding:'20px 24px',
                display:'grid', gridTemplateColumns:'190px 1fr', gap:20, alignItems:'start',
              }}>
                <div>
                  <div style={{ fontSize:9, letterSpacing:'0.1em', textTransform:'uppercase', fontWeight:700, color:'var(--muted)', marginBottom:7 }}>{r.label}</div>
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
  V3CompatibilityPanel, V3GenerateChartPanel,
  V3RetrospectivePanel, V3AnnualWrappedPanel,
});
