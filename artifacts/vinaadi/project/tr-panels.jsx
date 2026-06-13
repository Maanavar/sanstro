// tr-panels.jsx — Vinaadi Tools Redesign: individual tool panels

// ── COMPATIBILITY PANEL ───────────────────────────────────────────────────
function CompatibilityPanel() {
  const [ctx, setCtx] = React.useState('Marriage');
  const [showResults, setShowResults] = React.useState(true);
  const contexts = ['General','Marriage','Friendship','Business','Family'];

  const kutas = [
    { name:'Dinam',       score:3, max:3 },
    { name:'Ganam',       score:0, max:6 },
    { name:'Yoni',        score:2, max:4 },
    { name:'Rasi',        score:7, max:7 },
    { name:'Graha Maitri',score:3, max:5 },
    { name:'Vasya',       score:2, max:2 },
    { name:'Mahendra',    score:0, max:4 },
    { name:'Stree Dirgha',score:5, max:5 },
  ];

  return (
    <div>
      {/* Context pill tabs */}
      <div style={{ display:'flex', gap:6, marginBottom:28, flexWrap:'wrap' }}>
        <span style={{ fontSize:11, color:T.muted, alignSelf:'center', marginRight:4, letterSpacing:'0.08em', textTransform:'uppercase', fontWeight:600 }}>Context</span>
        {contexts.map(c => (
          <button key={c} onClick={() => setCtx(c)} style={{
            padding:'6px 16px', borderRadius:999,
            border:`1px solid ${c===ctx ? T.accent : T.border}`,
            background: c===ctx ? T.accentSoft : 'transparent',
            color: c===ctx ? T.accent : T.muted,
            fontSize:13, fontWeight: c===ctx ? 600 : 400,
            cursor:'pointer', fontFamily:'Inter, sans-serif', transition:'all 0.15s',
          }}>{c}</button>
        ))}
      </div>

      {/* Two-person forms */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:28 }}>
        <PersonForm title="Person 1" accentColor={T.accent} data={{ name:'Kaviya', dob:'22-Feb-2002', time:'01:10 PM', place:'Coimbatore, Tamil Nadu, India', tz:'Asia/Kolkata', lat:'11.0000', lng:'77.0000' }}/>
        <PersonForm title="Person 2" accentColor={T.muted} data={{ name:'Senthilkumar', dob:'15-Mar-1993', time:'08:15 AM', place:'Coimbatore, Tamil Nadu, India', tz:'Asia/Kolkata', lat:'11.0000', lng:'77.0000' }}/>
      </div>

      <Btn primary onClick={() => setShowResults(true)}>Check Compatibility →</Btn>

      {showResults && (
        <div style={{ marginTop:40 }}>
          <div style={{ height:1, background:T.border, marginBottom:36 }}/>

          {/* Score arc */}
          <ScoreArc score={22} max={36}/>

          {/* Kuta breakdown */}
          <div style={{ marginTop:36 }}>
            <div style={{ fontSize:10, letterSpacing:'0.12em', textTransform:'uppercase', color:T.muted, fontWeight:700, marginBottom:6 }}>Kuta Breakdown</div>
            {kutas.map(k => <KutaRow key={k.name} {...k}/>)}
          </div>

          {/* Download */}
          <div style={{ marginTop:24 }}>
            <Btn>↓ Download PDF</Btn>
          </div>

          {/* Side-by-side birth charts */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginTop:40 }}>
            {[
              { name:'Kaviya',        lagna:'Rishabam', pm: DEFAULT_PLANETS_KAVIYA },
              { name:'Senthilkumar',  lagna:'Mesham',   pm: null },
            ].map(({ name, lagna, pm }) => (
              <div key={name} style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:14, padding:24 }}>
                <div style={{ fontFamily:'Fraunces, serif', fontSize:17, color:T.accent, marginBottom:2 }}>{name}</div>
                <div style={{ fontSize:11, color:T.muted, marginBottom:16 }}>D1 — Birth chart</div>
                <BirthChart lagna={lagna} name={name} planetsMap={pm} compact/>
              </div>
            ))}
          </div>
          <div style={{ fontSize:11, color:T.muted2, fontStyle:'italic', marginTop:12 }}>
            Temporary charts — auto-deleted when you leave this session.
          </div>
        </div>
      )}
    </div>
  );
}

// ── GENERATE CHART PANEL ─────────────────────────────────────────────────
function GenerateChartPanel() {
  const [chartView, setChartView] = React.useState('D1 — Birth chart');
  const [showChart, setShowChart] = React.useState(true);
  const views = ['Print Jathagam','D1 — Birth chart','D9 — Navamsa'];

  return (
    <div>
      {/* Temp notice */}
      <div style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'8px 14px', background:T.amberSoft, borderRadius:8, fontSize:12, color:T.amber, marginBottom:24 }}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke={T.amber} strokeWidth="1.2"/><line x1="7" y1="4" x2="7" y2="7.5" stroke={T.amber} strokeWidth="1.4" strokeLinecap="round"/><circle cx="7" cy="9.5" r="0.8" fill={T.amber}/></svg>
        Temporary chart — auto-deleted when you leave this session.
      </div>

      {/* Input form */}
      <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:14, padding:28, marginBottom:24 }}>
        <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
          <Field label="Name" defaultValue="Senthilkumar"/>
          <div style={{ display:'flex', gap:16 }}>
            <Field label="Birth Date" defaultValue="15-Mar-1993"/>
            <Field label="Birth Time" defaultValue="08:15 AM"/>
          </div>
          <Field label="Birth Place" defaultValue="Coimbatore, Tamil Nadu, India" helpText="Select a city to auto-fill lat/lng"/>
          <Field label="Timezone" defaultValue="Asia/Kolkata"/>
          <div style={{ display:'flex', gap:16 }}>
            <Field label="Latitude" defaultValue="11.0000"/>
            <Field label="Longitude" defaultValue="77.0000"/>
          </div>
        </div>
        <div style={{ marginTop:28 }}>
          <Btn primary onClick={() => setShowChart(true)}>Generate Chart →</Btn>
        </div>
      </div>

      {showChart && (
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:14, overflow:'hidden' }}>
          {/* Chart header */}
          <div style={{ padding:'22px 28px', borderBottom:`1px solid ${T.border}`, background:T.accentSoft, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>
              <div style={{ fontFamily:'Fraunces, serif', fontSize:22, color:T.accent, letterSpacing:'-0.02em' }}>Senthilkumar</div>
              <div style={{ fontSize:12, color:T.muted, marginTop:2 }}>Born 15 March 1993</div>
            </div>
            <Chip variant="accent">D1 Ready</Chip>
          </div>

          {/* View tabs */}
          <div style={{ display:'flex', gap:8, padding:'14px 28px', borderBottom:`1px solid ${T.border}` }}>
            {views.map(v => {
              const active = v === chartView;
              return (
                <button key={v} onClick={() => setChartView(v)} style={{
                  padding:'6px 14px', borderRadius:999,
                  border:`1px solid ${active ? T.accent : T.border}`,
                  background: active ? T.accentSoft : 'transparent',
                  color: active ? T.accent : T.muted,
                  fontSize:12, fontWeight: active ? 600 : 400,
                  cursor:'pointer', fontFamily:'Inter, sans-serif',
                }}>{v}</button>
              );
            })}
          </div>

          <div style={{ padding:28 }}>
            {/* Stats grid */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:10, marginBottom:24 }}>
              {[['NAME','Senthilkumar'],['AGE','33'],['RASI','DHANUSU'],['LAGNAM','MESHAM'],['NAKSHATHIRAM','MOOLAM (Pada 1)'],['CURRENT DASHA','MOON / MOON']].map(([lbl, val]) => (
                <div key={lbl} style={{ background:T.surface2, borderRadius:10, padding:'12px 14px' }}>
                  <div style={{ fontSize:9, letterSpacing:'0.1em', textTransform:'uppercase', color:T.muted, marginBottom:4, fontWeight:600 }}>{lbl}</div>
                  <div style={{ fontSize:14, fontWeight:600, color:T.ink }}>{val}</div>
                </div>
              ))}
            </div>

            {/* Calculation method */}
            <div style={{ background:T.bg2, borderRadius:10, padding:'12px 16px', marginBottom:28, fontSize:12, color:T.muted, lineHeight:1.7 }}>
              <span style={{ fontSize:9, letterSpacing:'0.12em', textTransform:'uppercase', color:T.muted, fontWeight:700, display:'block', marginBottom:4 }}>Calculation Method</span>
              Version: <strong style={{ color:T.ink2 }}>thirukanitham-2026-v1</strong> &nbsp;|&nbsp; Ayanamsa: <strong style={{ color:T.ink2 }}>LAHIRI</strong> &nbsp;|&nbsp; Ephemeris: <strong style={{ color:T.ink2 }}>swisseph-ffi</strong>
              <br/>House style: Whole-sign from Lagna. Dasha system: Vimshottari from Moon longitude.
            </div>

            {/* Chart */}
            <div>
              <div style={{ fontSize:11, letterSpacing:'0.1em', textTransform:'uppercase', color:T.muted, fontWeight:600, marginBottom:16 }}>D1 — Birth Chart</div>
              <div style={{ display:'flex', gap:32, alignItems:'flex-start' }}>
                <BirthChart lagna="Mesham" name="Senthilkumar"/>
                {/* Tap to explain panel */}
                <div style={{ background:T.surface2, border:`1px solid ${T.border}`, borderRadius:12, padding:'16px 20px', minWidth:220 }}>
                  <div style={{ fontSize:9, letterSpacing:'0.12em', textTransform:'uppercase', color:T.accent, fontWeight:700, marginBottom:10 }}>Tap to explain</div>
                  <div style={{ fontSize:14, fontWeight:600, color:T.ink2, marginBottom:4 }}>Mesham (Rasi 1) · Lagna</div>
                  <div style={{ fontSize:12, color:T.muted, marginBottom:12 }}>From D1 Lagna: House 1</div>
                  <Chip variant="accent">Lagna 0.90°</Chip>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── RETROSPECTIVE PANEL ───────────────────────────────────────────────────
function RetrospectivePanel() {
  const [showResults, setShowResults] = React.useState(true);

  const recurrences = [
    { date:'late Dec 2024', desc:'Sensitive-house signature for relationship re-activates (score 3/10 across Moon/Lagna references).' },
    { date:'late Apr 2025', desc:'Sensitive-house signature for relationship re-activates (score 4/10 across Moon/Lagna references).' },
    { date:'late Nov 2025', desc:'Sensitive-house signature for relationship re-activates (score 4/10 across Moon/Lagna references).' },
  ];

  return (
    <div>
      <p style={{ fontSize:15, color:T.accentMid, fontStyle:'italic', marginBottom:28, lineHeight:1.65 }}>
        Enter a past event to see its astrological correlation and future recurrence patterns.
      </p>

      {/* Input form */}
      <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:14, padding:28, marginBottom:28 }}>
        <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
          <div style={{ display:'flex', gap:16 }}>
            <Field label="Event Date" defaultValue="27-Nov-2024"/>
            <SelectField label="Event Type" defaultValue="Relationship" options={['Relationship','Career','Health','Finance','Education','Travel','Family','Other']}/>
          </div>
          <TextareaField label="Event Description" defaultValue="got married"/>
        </div>
        <div style={{ display:'flex', gap:10, marginTop:24 }}>
          <Btn primary onClick={() => setShowResults(true)}>Analyse Event →</Btn>
          <Btn ghost>History</Btn>
        </div>
      </div>

      {showResults && (
        <div>
          {/* Active dasha strip */}
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:28, padding:'12px 18px', background:T.surface, border:`1px solid ${T.border}`, borderRadius:10 }}>
            <span style={{ fontSize:10, letterSpacing:'0.1em', textTransform:'uppercase', color:T.muted, fontWeight:700, flexShrink:0 }}>Active Dasha</span>
            <span style={{ width:1, height:14, background:T.border, flexShrink:0 }}/>
            <span style={{ fontSize:13, color:T.accent, fontWeight:500 }}>SUN Maha Dasha / KETU Antar Dasha / VENUS Pratyantar</span>
            <span style={{ fontSize:11, color:T.muted2, marginLeft:'auto', flexShrink:0 }}>2024-11-27</span>
          </div>

          {/* Astrological correlation */}
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:14, padding:24, marginBottom:16 }}>
            <div style={{ fontSize:9, letterSpacing:'0.14em', textTransform:'uppercase', color:T.accent, fontWeight:700, marginBottom:12 }}>Astrological Correlation</div>
            <p style={{ fontSize:14, color:T.ink2, lineHeight:1.7 }}>
              At the time of 'got married', SUN Maha Dasha / KETU Antar Dasha / VENUS Pratyantar was active. JUPITER was in house 6 from Moon and house 2 from Lagna. In Tamil Jyothidam, this pattern is traditionally associated with relationship-linked phases.
            </p>
          </div>

          {/* Key transits */}
          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:10, letterSpacing:'0.1em', textTransform:'uppercase', color:T.muted, fontWeight:700, marginBottom:10 }}>Key Transits</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:7 }}>
              {['Jupiter H6L2 JUPITER conjunct natal KETU','Sun H12L8','Saturn H3L11 SATURN conjunct natal MERCURY','Rahu H4L12'].map(t => (
                <Chip key={t} variant="neutral">{t}</Chip>
              ))}
            </div>
          </div>

          {/* Future recurrences */}
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:14, overflow:'hidden', marginBottom:16 }}>
            <div style={{ padding:'12px 24px', borderBottom:`1px solid ${T.border}`, background:T.surface2 }}>
              <span style={{ fontSize:10, letterSpacing:'0.12em', textTransform:'uppercase', color:T.muted, fontWeight:700 }}>Future Recurrences</span>
            </div>
            {recurrences.map((r, i) => (
              <div key={i} style={{ display:'flex', gap:16, padding:'14px 24px', borderBottom: i < recurrences.length-1 ? `1px solid ${T.border}` : 'none', alignItems:'flex-start' }}>
                <Chip variant="sage">Similar</Chip>
                <div>
                  <div style={{ fontSize:13, fontWeight:600, color:T.ink2, marginBottom:3 }}>{r.date}</div>
                  <div style={{ fontSize:12, color:T.muted, lineHeight:1.55 }}>{r.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Caution */}
          <div style={{ background:T.cautionSoft, borderRadius:12, padding:'14px 20px', display:'flex', gap:10, alignItems:'flex-start' }}>
            <span style={{ fontSize:14, flexShrink:0 }}>⚠</span>
            <div>
              <div style={{ fontSize:10, letterSpacing:'0.1em', textTransform:'uppercase', color:T.caution, fontWeight:700, marginBottom:5 }}>Caution</div>
              <div style={{ fontSize:13, color:T.caution, lineHeight:1.6 }}>This does not mean the same event repeats; it indicates a similar quality window for mindful planning.</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── ANNUAL WRAPPED PANEL ─────────────────────────────────────────────────
function AnnualWrappedPanel() {
  return (
    <div style={{ padding:'48px 20px', textAlign:'center' }}>
      <div style={{ width:72, height:72, borderRadius:'50%', background:T.infoSoft, border:`1px solid ${T.border}`, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 24px', fontSize:28 }}>✦</div>
      <div style={{ fontFamily:'Fraunces, serif', fontSize:12, color:T.accent, letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:12 }}>Annual Wrapped</div>
      <div style={{ fontFamily:'Fraunces, serif', fontSize:44, color:T.ink, marginBottom:16, lineHeight:1, letterSpacing:'-0.03em' }}>2025 in Review</div>
      <p style={{ fontSize:14, color:T.muted, lineHeight:1.7, maxWidth:380, margin:'0 auto 32px' }}>
        Your astrological year in review — key periods, dasha transitions, and Jyotish themes from your chart.
      </p>
      <Btn primary>Generate Annual Report →</Btn>
      <div style={{ fontSize:11, color:T.muted2, marginTop:14 }}>Available for years you've been using Vinaadi</div>
    </div>
  );
}

Object.assign(window, { CompatibilityPanel, GenerateChartPanel, RetrospectivePanel, AnnualWrappedPanel });
