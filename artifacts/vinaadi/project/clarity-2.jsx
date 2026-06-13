// CLARITY — part 2: Life Areas, Family, Calendar, Setup
// Same warm cream + ink direction.

// ──────────────────────────────────────────────────────────────
// 4. LIFE AREAS — overview cards
function ClarityLifeAreas() {
  const t = useLang();
  const areas = VINAADI.lifeAreas;
  return (
    <div className="frame theme-clarity">
      <div style={{ padding: '20px 32px 14px', display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display:'flex', alignItems:'center', gap: 14 }}>
          <Mark size={22} />
          <div>
            <div className="display" style={{ fontSize: 17 }}>Vinaadi</div>
            <div className="eyebrow">{VINAADI.user.name}</div>
          </div>
        </div>
        <span className="tag">26 May 2026</span>
      </div>

      <div style={{ padding: '0 32px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display:'flex', gap: 4 }}>
          {['personal','lifeAreas','family','calendar','settings','qa'].map((k, i) => (
            <div key={k} className={`tab ${i === 1 ? 'active' : ''}`}>{t[k]}</div>
          ))}
        </div>
      </div>

      <div style={{ padding: '36px 32px 16px' }}>
        <div className="eyebrow" style={{ color: 'var(--accent)' }}>Life Areas · age 33</div>
        <h1 className="display" style={{ fontSize: 48, margin: '8px 0 12px', letterSpacing: '-0.025em' }}>
          Where you stand,<br/>area by area.
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: 15, maxWidth: 560, marginBottom: 20 }}>
          Each score reads support under your current Moon Dasa and active transits.
          Career, marriage and wealth foundation are this year's themes.
        </p>
        <div style={{ display:'flex', gap: 8 }}>
          <span className="tag tag-accent">● {VINAADI.user.short}</span>
          <span className="tag">Aadhinii</span>
          <span style={{ marginLeft: 'auto' }} />
          {['Overview','Predictions','Yogas & Doshams','Full report'].map((s, i) => (
            <span key={s} className={`tag ${i === 0 ? 'tag-accent' : ''}`}>{s}</span>
          ))}
        </div>
      </div>

      <div style={{ padding: '12px 32px 32px',
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {areas.map(a => {
          const tone = a.score >= 60 ? 'sage' : a.score >= 45 ? 'accent' : 'caution';
          const dotColor = tone === 'sage' ? 'var(--sage)' : tone === 'caution' ? 'var(--caution)' : 'var(--accent)';
          return (
            <div key={a.key} className="card" style={{ padding: 22 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                <div>
                  <div className="eyebrow">{a.label}</div>
                  <div className="display tnum" style={{ fontSize: 56, lineHeight: 1, marginTop: 6 }}>
                    {a.score}<span style={{ fontSize: 14, color: 'var(--muted)' }}>/100</span>
                  </div>
                </div>
                <span style={{ fontSize: 11, color: dotColor, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  {a.trend === 'down' ? '↓' : a.trend === 'up' ? '↑' : '–'} {a.trend}
                </span>
              </div>
              <Meter value={a.score} tone={tone} height={3} />
              <p style={{ fontSize: 13.5, color: 'var(--ink-2)', marginTop: 14, lineHeight: 1.5 }}>
                {a.note}
              </p>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop: 14, fontSize: 12, color: 'var(--muted)' }}>
                <span>Karaka · house</span>
                <span className="mono">H {(a.score % 9) + 1}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// 5. PREDICTIONS (drill-down)
function ClarityPredictions() {
  const t = useLang();
  return (
    <div className="frame theme-clarity">
      <div style={{ padding: '20px 32px 14px', borderBottom: '1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div style={{ display:'flex', alignItems:'center', gap: 14 }}>
          <Mark size={22} /><div className="display" style={{ fontSize: 17 }}>Vinaadi</div>
        </div>
        <span className="tag">Predictions · 6 months</span>
      </div>

      <div style={{ padding: '32px 32px 16px' }}>
        <div className="eyebrow" style={{ color: 'var(--accent)' }}>Predictions</div>
        <h1 className="display" style={{ fontSize: 44, margin: '8px 0 24px', letterSpacing: '-0.025em' }}>
          What the months ahead are saying.
        </h1>
      </div>

      <div style={{ padding: '0 32px 32px', display:'grid', gap: 16 }}>
        {/* Headline card: Marriage */}
        <div className="card" style={{ padding: 24, display: 'grid', gridTemplateColumns: '1fr 280px', gap: 28 }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap: 10, marginBottom: 10 }}>
              <span className="eyebrow">Marriage</span>
              <span className="tag tag-accent">Medium signal</span>
            </div>
            <div className="display" style={{ fontSize: 28, lineHeight: 1.15, marginBottom: 12, maxWidth: 520 }}>
              Indicators are mixed. A planned, paced approach will land you well.
            </div>
            <p style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.55, maxWidth: 540 }}>
              Venus offers support and the age phase is favourable, but 7th lord placement asks for patience.
              Window opens late this year.
            </p>

            <div style={{ marginTop: 20, display:'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              <div>
                <div className="eyebrow" style={{ color: 'var(--sage)', marginBottom: 8 }}>Supporting</div>
                {['Venus offers support','Transit support present','Age phase supportive'].map(s => (
                  <div key={s} style={{ display:'flex', alignItems:'center', gap: 8, fontSize: 13.5, marginBottom: 6 }}>
                    <span style={{ width: 5, height: 5, borderRadius: 5, background: 'var(--sage)' }} />
                    {s}
                  </div>
                ))}
              </div>
              <div>
                <div className="eyebrow" style={{ color: 'var(--caution)', marginBottom: 8 }}>Watch</div>
                {['7th lord in challenging house','Dasha timing moderate','Sevvai dosham — caution','Rahu–Ketu calls patience'].map(s => (
                  <div key={s} style={{ display:'flex', alignItems:'center', gap: 8, fontSize: 13.5, marginBottom: 6 }}>
                    <span style={{ width: 5, height: 5, borderRadius: 5, background: 'var(--caution)' }} />
                    {s}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div>
            <div className="eyebrow">Window</div>
            <div className="display tnum" style={{ fontSize: 22, lineHeight: 1.2, marginTop: 6 }}>
              May 2026 →<br/>Dec 2026
            </div>
            <hr className="hr" style={{ margin: '16px 0' }} />
            <div style={{ display:'flex', justifyContent:'space-between', fontSize: 12, marginBottom: 6 }}>
              <span style={{ color: 'var(--muted)' }}>Dasha</span>
              <span style={{ color: 'var(--caution)' }}>Weak</span>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize: 12, marginBottom: 6 }}>
              <span style={{ color: 'var(--muted)' }}>Transit</span>
              <span style={{ color: 'var(--sage)' }}>Strong</span>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize: 12 }}>
              <span style={{ color: 'var(--muted)' }}>Age phase</span>
              <span style={{ color: 'var(--sage)' }}>Strong</span>
            </div>
          </div>
        </div>

        {/* Compact predictions */}
        {[
          ['Career','Favourable phase for growth and added responsibility.','High','sage'],
          ['Wealth','Avoid high-risk exposure; prioritise stability.','Low','caution'],
          ['Health','Do not ignore symptoms; preventive care first.','Low','caution'],
        ].map(([k, v, sig, tone]) => (
          <div key={k} className="card-flat" style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding: '18px 22px' }}>
            <div>
              <div className="eyebrow" style={{ color: `var(--${tone})` }}>{k}</div>
              <div style={{ fontSize: 15, color: 'var(--ink)', marginTop: 4 }}>{v}</div>
            </div>
            <span className={`tag tag-${tone}`}>{sig}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// 6. FAMILY VAULT
function ClarityFamily() {
  const t = useLang();
  return (
    <div className="frame theme-clarity">
      <div style={{ padding: '20px 32px 14px', borderBottom: '1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div style={{ display:'flex', alignItems:'center', gap: 14 }}>
          <Mark size={22} />
          <div>
            <div className="display" style={{ fontSize: 17 }}>Vinaadi</div>
            <div className="eyebrow">Family</div>
          </div>
        </div>
        <div style={{ display:'flex', gap: 8 }}>
          <button className="btn">Refresh</button>
          <button className="btn btn-primary">+ Add member</button>
        </div>
      </div>

      <div style={{ padding: '0 32px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display:'flex', gap: 4 }}>
          {['personal','lifeAreas','family','calendar','settings','qa'].map((k, i) => (
            <div key={k} className={`tab ${i === 2 ? 'active' : ''}`}>{t[k]}</div>
          ))}
        </div>
      </div>

      <div style={{ padding: '32px 32px 0' }}>
        <div className="eyebrow" style={{ color: 'var(--accent)' }}>Senthils family · 2 members</div>
        <h1 className="display" style={{ fontSize: 48, margin: '8px 0 8px', letterSpacing: '-0.025em' }}>
          A shared, <em style={{ color: 'var(--muted)' }}>supportive</em> day.
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: 15, maxWidth: 600, marginBottom: 28 }}>
          Family score blends each member's chart, weighted by relationship. Plans land best in the morning window.
        </p>
      </div>

      <div style={{ padding: '0 32px 32px', display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 24 }}>
        {/* Aggregate */}
        <div className="card" style={{ padding: 26 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom: 18 }}>
            <div>
              <div className="eyebrow">Family today</div>
              <div className="display tnum" style={{ fontSize: 72, lineHeight: 1, marginTop: 6 }}>
                70<span style={{ fontSize: 18, color: 'var(--muted)' }}>/100</span>
              </div>
              <span className="tag tag-sage" style={{ marginTop: 8, display: 'inline-flex' }}>Supportive</span>
            </div>
            <Dial value={70} size={92} stroke={6} tone="sage" />
          </div>

          <div style={{ display:'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div className="card-flat" style={{ background:'var(--sage-soft)', border:'none', padding: 12 }}>
              <div className="eyebrow" style={{ color: 'var(--sage)' }}>Best shared</div>
              <div className="tnum" style={{ fontSize: 14, fontWeight: 500, marginTop: 2 }}>{VINAADI.family.bestShared}</div>
            </div>
            <div className="card-flat" style={{ background:'var(--caution-soft)', border:'none', padding: 12 }}>
              <div className="eyebrow" style={{ color: 'var(--caution)' }}>Avoid</div>
              <div className="tnum" style={{ fontSize: 14, fontWeight: 500, marginTop: 2 }}>{VINAADI.family.avoid}</div>
            </div>
          </div>

          <hr className="hr" style={{ margin: '20px 0' }} />
          <div className="eyebrow" style={{ marginBottom: 10 }}>7-day outlook</div>
          <div style={{ display:'flex', gap: 4 }}>
            {VINAADI.weekScores.map(d => (
              <div key={d.n} style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: 'var(--muted)' }}>{d.d}</div>
                <div style={{ height: 60, display:'flex', alignItems:'flex-end', marginTop: 4 }}>
                  <div style={{ width: '100%', height: `${d.s}%`,
                    background: d.s >= 65 ? 'var(--sage)' : 'var(--accent)',
                    opacity: 0.85, borderRadius: 3 }} />
                </div>
                <div className="tnum" style={{ fontSize: 11, marginTop: 4 }}>{d.s}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Members */}
        <div style={{ display:'grid', gap: 16 }}>
          {[
            { name: 'Senthilkumar Sivaraman', rel: 'Self', score: 64, lagna: 'Mesham', nak: 'Moolam', dasa: 'Moon Dasa · Moon Bhukti' },
            { name: 'Aadhinii Senthilkumar', rel: 'Daughter', score: 70, lagna: 'Mesham', nak: 'Uthiradam', dasa: 'Sun Dasa · Rahu Bhukti' },
          ].map(m => (
            <div key={m.name} className="card" style={{ padding: 22 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                <div>
                  <div className="eyebrow">{m.rel}</div>
                  <div className="display" style={{ fontSize: 24, marginTop: 4 }}>{m.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
                    {m.lagna} Lagna · {m.nak} ☉ · {m.dasa}
                  </div>
                </div>
                <Dial value={m.score} size={70} stroke={5} tone={m.score >= 65 ? 'sage' : 'accent'} />
              </div>
              <div style={{ display:'flex', gap: 6, marginTop: 14, flexWrap: 'wrap' }}>
                <span className="tag tag-sage">Today supportive</span>
                <span className="tag">Best 7:01 – 8:04 AM</span>
                <span className="tag tag-caution">Avoid 3:29 – 5:04 PM</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// 7. CALENDAR · PANCHANGAM
function ClarityCalendar() {
  const t = useLang();
  const today = VINAADI.today;
  return (
    <div className="frame theme-clarity">
      <div style={{ padding: '20px 32px 14px', borderBottom: '1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div style={{ display:'flex', alignItems:'center', gap: 14 }}>
          <Mark size={22} />
          <div className="display" style={{ fontSize: 17 }}>Vinaadi · Calendar</div>
        </div>
        <div style={{ display:'flex', gap: 6 }}>
          <span className="tag tag-accent">{t.panchangam}</span>
          <span className="tag">{t.personal}</span>
          <span className="tag">{t.family}</span>
        </div>
      </div>

      <div style={{ padding: '32px 32px 0' }}>
        <div className="eyebrow" style={{ color: 'var(--accent)' }}>Tuesday · 26 May 2026</div>
        <h1 className="display" style={{ fontSize: 56, margin: '8px 0 8px', letterSpacing: '-0.025em' }}>
          <em style={{ color: 'var(--muted)' }}>Ekadasi.</em> Hastham. Siddhi yoga.
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: 15 }}>
          Sunrise <span className="tnum" style={{ color: 'var(--ink)' }}>5:56</span>, sunset <span className="tnum" style={{ color: 'var(--ink)' }}>6:38</span>.
        </p>
      </div>

      <div style={{ padding: '32px', display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24 }}>
        {/* Day arc with windows table */}
        <div className="card" style={{ padding: 26 }}>
          <div className="eyebrow" style={{ marginBottom: 12 }}>Day at a glance</div>
          <DayArc width={520} height={120} />
          <hr className="hr" style={{ margin: '20px 0' }} />
          <div style={{ display:'grid', gap: 8 }}>
            {VINAADI.windows.map((w, i) => {
              const tone = w.tone === 'best' ? 'sage' : w.tone === 'avoid' ? 'caution' : w.tone === 'good' ? 'sage' : 'accent';
              return (
                <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding: '8px 12px',
                  background: `var(--${tone}-soft)`, borderRadius: 10 }}>
                  <div style={{ display:'flex', alignItems:'center', gap: 10 }}>
                    <span style={{ width: 6, height: 6, borderRadius: 6, background: `var(--${tone})` }} />
                    <span style={{ fontSize: 13.5, fontWeight: 500 }}>{w.label}</span>
                  </div>
                  <span className="tnum" style={{ fontSize: 13, color: `var(--${tone})`, fontWeight: 500 }}>{w.time}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Panchangam five limbs */}
        <div style={{ display:'grid', gap: 12 }}>
          <div className="eyebrow">Panchangam · five limbs</div>
          {[
            ['Vara', 'Tuesday', 'Mars lord'],
            ['Tithi', 'Ekadasi', 'Shukla 11 · 6:22 AM until'],
            ['Nakshatra', 'Hastham', 'Pada 1 · 5:56 AM until'],
            ['Yoga', 'Siddhi', 'Yoga 16'],
            ['Karana', 'Vanija', '—'],
          ].map(([k, v, sub]) => (
            <div key={k} className="card-flat" style={{ padding: 14, display:'grid', gridTemplateColumns: '90px 1fr auto', gap: 12, alignItems:'center' }}>
              <div className="eyebrow">{k}</div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 500 }}>{v}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>{sub}</div>
              </div>
              <span className="mono" style={{ fontSize: 11, color: 'var(--muted)' }}>5L</span>
            </div>
          ))}

          <div className="card-flat" style={{ padding: 16, background: 'var(--accent-soft)', border: 'none', marginTop: 4 }}>
            <div className="eyebrow" style={{ color: 'var(--accent)' }}>Today's significance</div>
            <div style={{ fontSize: 14, marginTop: 4, lineHeight: 1.55 }}>
              Ekadasi — a sacred day for Thirumal (Vishnu). Fasting brings spiritual merit. Visit a Perumal temple and offer tulasi.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// 8. SETUP / SETTINGS
function ClaritySetup() {
  const t = useLang();
  return (
    <div className="frame theme-clarity">
      <div style={{ padding: '20px 32px 14px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style={{ display:'flex', alignItems:'center', gap: 14 }}>
            <Mark size={22} /><div className="display" style={{ fontSize: 17 }}>Vinaadi · Setup</div>
          </div>
          <span className="tag tag-sage">● Setup complete</span>
        </div>
      </div>

      <div style={{ padding: '32px 32px 24px' }}>
        <div className="eyebrow" style={{ color: 'var(--accent)' }}>Settings · onboarding</div>
        <h1 className="display" style={{ fontSize: 44, margin: '8px 0 8px', letterSpacing: '-0.025em' }}>
          Three quiet steps. Then we read for you.
        </h1>
      </div>

      {/* Stepper */}
      <div style={{ padding: '0 32px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, position: 'relative' }}>
          {/* line */}
          <div style={{ position:'absolute', top: 16, left: '17%', right: '17%', height: 1, background: 'var(--sage)', zIndex: 0 }} />
          {[
            { n: 1, k: 'Your chart', s: 'Birth details and place', done: true },
            { n: 2, k: 'Family vault', s: 'Group members under one roof', done: true },
            { n: 3, k: 'Add member', s: 'Add chart for spouse, child…', done: true },
          ].map((s, i) => (
            <div key={i} style={{ position:'relative', zIndex: 1, background: 'var(--bg)' }}>
              <div style={{ width: 32, height: 32, borderRadius: 32,
                background: 'var(--sage)', color: 'white',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize: 14, fontWeight: 500, margin: '0 auto 10px' }}>✓</div>
              <div style={{ textAlign:'center' }}>
                <div className="display" style={{ fontSize: 18 }}>{s.k}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{s.s}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '0 32px 32px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
            <div>
              <span className="tag tag-sage">✓ Created</span>
              <div className="display" style={{ fontSize: 22, margin: '10px 0 4px' }}>Your birth details</div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>Name, date, time and place</div>
            </div>
            <button className="btn">Edit</button>
          </div>
          <hr className="hr" style={{ margin: '18px 0' }} />
          <div style={{ display:'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {[
              ['Name','Senthilkumar Sivaraman'],
              ['Relationship','Self'],
              ['Birth date','15 Mar 1993'],
              ['Birth time','08:15 AM'],
              ['Birth place','Tirupur, Tamil Nadu'],
              ['Timezone','Asia / Kolkata'],
            ].map(([k, v]) => (
              <div key={k}>
                <div className="eyebrow">{k}</div>
                <div style={{ fontSize: 14, marginTop: 2 }}>{v}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card" style={{ padding: 24 }}>
          <span className="tag tag-sage">✓ Vault exists</span>
          <div className="display" style={{ fontSize: 22, margin: '10px 0 4px' }}>Senthils family vault</div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 14 }}>2 members · Tamil + English</div>

          <div style={{ display:'grid', gap: 10 }}>
            {['Senthilkumar Sivaraman','Aadhinii Senthilkumar'].map(n => (
              <div key={n} className="card-flat" style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding: 12 }}>
                <div style={{ display:'flex', alignItems:'center', gap: 10 }}>
                  <span style={{ width: 28, height: 28, borderRadius: 28, background: 'var(--accent-soft)', color: 'var(--accent)',
                    display:'flex', alignItems:'center', justifyContent:'center', fontSize: 12, fontWeight: 600 }}>
                    {n.charAt(0)}
                  </span>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 500 }}>{n}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>{n.startsWith('S') ? 'Self · weight 1.00' : 'Daughter · weight 0.75'}</div>
                  </div>
                </div>
                <span className="tag">Edit</span>
              </div>
            ))}
          </div>

          <button className="btn" style={{ marginTop: 14, width: '100%', justifyContent: 'center' }}>+ Add a member</button>
        </div>
      </div>
    </div>
  );
}

window.Clarity2 = { ClarityLifeAreas, ClarityPredictions, ClarityFamily, ClarityCalendar, ClaritySetup };
