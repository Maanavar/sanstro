// TWILIGHT — refined dark direction.
// Night-sky warmth, glassy surfaces, gold accent. Structurally distinct from
// Clarity: a left rail instead of top tabs, gauge-forward bento dashboards.

// Left navigation rail shared by twilight dashboards
function Rail({ active }) {
  const t = useLang();
  const items = [
    ['personal', 'M3 12l9-9 9 9M5 10v10h14V10'],
    ['lifeAreas', 'M4 18V8M9 18V4M14 18v-7M19 18v-12'],
    ['transits', 'M12 3a9 9 0 100 18 9 9 0 000-18zM12 7v5l3 2'],
    ['family', 'M9 11a3 3 0 100-6 3 3 0 000 6zM3 20c0-3 3-5 6-5s6 2 6 5M17 11a3 3 0 100-6'],
    ['calendar', 'M4 7h16M4 7v13h16V7M4 7l1-3h14l1 3M8 2v4M16 2v4'],
    ['settings', 'M12 15a3 3 0 100-6 3 3 0 000 6zM19 12l2-1-1-3-2 .5M5 12l-2-1 1-3 2 .5'],
  ];
  return (
    <div style={{ width: 84, borderRight: '1px solid var(--border)', background: 'var(--bg-2)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '22px 0', flexShrink: 0 }}>
      <Mark size={28} theme="twilight" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 32, flex: 1 }}>
        {items.map(([k, d]) => (
          <div key={k} title={t[k]} style={{ width: 52, height: 52, borderRadius: 14,
            display: 'grid', placeItems: 'center', cursor: 'pointer',
            background: active === k ? 'var(--accent-soft)' : 'transparent',
            color: active === k ? 'var(--accent)' : 'var(--muted)' }}>
            <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
          </div>
        ))}
      </div>
      <span style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--accent)', color: '#1A1410',
        display: 'grid', placeItems: 'center', fontSize: 13, fontWeight: 700 }}>S</span>
    </div>
  );
}

function TopBar({ title, sub }) {
  const t = useLang();
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '22px 32px', borderBottom: '1px solid var(--border)' }}>
      <div>
        <div className="eyebrow" style={{ color: 'var(--accent)' }}>{sub}</div>
        <div className="display" style={{ fontSize: 24, marginTop: 3 }}>{title}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span className="tag tag-sage">●&nbsp; Live</span>
        <span className="tnum" style={{ fontSize: 13, color: 'var(--ink-2)' }}>{VINAADI.today.date}</span>
        <button className="btn" style={{ padding: '8px 14px' }}>Refresh</button>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// 1. LANDING
function TwilightLanding() {
  const t = useLang();
  return (
    <div className="frame theme-twilight" style={{ background:
      'radial-gradient(1200px 500px at 80% -10%, rgba(212,165,116,0.10), transparent 60%), radial-gradient(900px 600px at 10% 110%, rgba(143,166,138,0.06), transparent 60%), var(--bg)' }}>
      <div style={{ padding: '32px 56px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Mark size={28} theme="twilight" />
          <div className="display" style={{ fontSize: 22 }}>Vinaadi</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className="btn btn-ghost">Product</button>
          <button className="btn btn-ghost">Family</button>
          <button className="btn btn-ghost">Pricing</button>
          <button className="btn btn-primary">{t.open}</button>
        </div>
      </div>

      <div style={{ padding: '60px 56px 0', textAlign: 'center' }}>
        <span className="tag tag-accent" style={{ marginBottom: 24 }}>Thirukanitham · daily guidance</span>
        <h1 className="display" style={{ fontSize: 96, margin: '0 auto 22px', lineHeight: 0.98, letterSpacing: '-0.04em', maxWidth: 900 }}>
          Calm astrology for the day <span style={{ fontStyle: 'italic', color: 'var(--accent)' }}>ahead.</span>
        </h1>
        <p style={{ fontSize: 19, color: 'var(--ink-2)', maxWidth: 560, margin: '0 auto 32px', lineHeight: 1.5 }}>
          Your chart, dasa, transit and panchangam distilled into one balanced reading — for you, and the family you plan with.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button className="btn btn-primary" style={{ padding: '14px 24px', fontSize: 14 }}>{t.open} →</button>
          <button className="btn" style={{ padding: '14px 24px', fontSize: 14 }}>See a sample reading</button>
        </div>
      </div>

      {/* Floating preview bento */}
      <div style={{ padding: '52px 56px 0', display: 'grid', gridTemplateColumns: '1.3fr 1fr 1fr', gap: 16, maxWidth: 1040, margin: '0 auto' }}>
        <div className="card" style={{ padding: 24, gridRow: 'span 2', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div className="eyebrow">Tuesday, 26 May</div>
              <div className="display" style={{ fontSize: 26, marginTop: 4 }}>Senthil's day</div>
            </div>
            <Dial value={64} size={80} stroke={6} tone="accent" />
          </div>
          <DayArc width={320} height={92} />
        </div>
        <div className="card" style={{ background: 'var(--sage-soft)', borderColor: 'transparent', padding: 20 }}>
          <div className="eyebrow" style={{ color: 'var(--sage)' }}>Best window</div>
          <div className="display tnum" style={{ fontSize: 24, marginTop: 6, color: 'var(--sage)' }}>11:53</div>
          <div style={{ fontSize: 12, color: 'var(--sage)' }}>– 12:41 PM · Abhijit</div>
        </div>
        <div className="card" style={{ padding: 20 }}>
          <div className="eyebrow">Dasa</div>
          <div className="display" style={{ fontSize: 22, marginTop: 6 }}>Moon</div>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>Moon Bhukti</div>
        </div>
        <div className="card" style={{ background: 'var(--caution-soft)', borderColor: 'transparent', padding: 20 }}>
          <div className="eyebrow" style={{ color: 'var(--caution)' }}>Hold</div>
          <div className="display tnum" style={{ fontSize: 24, marginTop: 6, color: 'var(--caution)' }}>3:28</div>
          <div style={{ fontSize: 12, color: 'var(--caution)' }}>– 5:03 PM · Rahu</div>
        </div>
        <div className="card" style={{ padding: 20 }}>
          <div className="eyebrow">Nakshatra</div>
          <div className="display" style={{ fontSize: 22, marginTop: 6 }}>Moolam</div>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>Pada 1 · root</div>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// 2. LOGIN
function TwilightLogin() {
  const t = useLang();
  return (
    <div className="frame theme-twilight" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
      {/* left brand panel */}
      <div style={{ padding: 48, display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        background: 'radial-gradient(700px 400px at 30% 20%, rgba(212,165,116,0.12), transparent 60%), var(--bg-2)',
        borderRight: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Mark size={24} theme="twilight" /><span className="display" style={{ fontSize: 18 }}>Vinaadi</span>
        </div>
        <div>
          <h2 className="display" style={{ fontSize: 46, lineHeight: 1.05, letterSpacing: '-0.025em', marginBottom: 16 }}>
            The sky, read<br/>for <em style={{ color: 'var(--accent)' }}>your</em> day.
          </h2>
          <p style={{ color: 'var(--muted)', fontSize: 14, maxWidth: 320, lineHeight: 1.6 }}>
            One calm reading every morning — and a shared view for the people you plan with.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 20 }}>
          {[['64','today'],['70','family'],['7d','outlook']].map(([n, l]) => (
            <div key={l}>
              <div className="display tnum" style={{ fontSize: 28, color: 'var(--accent)' }}>{n}</div>
              <div className="eyebrow">{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* right form */}
      <div style={{ display: 'grid', placeItems: 'center', padding: 48 }}>
        <div style={{ width: 360 }}>
          <div className="eyebrow" style={{ color: 'var(--accent)', marginBottom: 8 }}>{t.welcomeBack}</div>
          <h2 className="display" style={{ fontSize: 34, margin: '0 0 24px' }}>Sign in</h2>

          <button className="btn" style={{ width: '100%', justifyContent: 'center', padding: 13, marginBottom: 10 }}>
            Continue with Google
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '18px 0', color: 'var(--muted-2)', fontSize: 11 }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} /> OR <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>

          <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Email</label>
          <input placeholder="you@example.com" style={{ width: '100%', padding: '13px 15px', border: '1px solid var(--border)',
            borderRadius: 12, background: 'var(--surface)', fontSize: 14, marginBottom: 14, fontFamily: 'inherit', color: 'var(--ink)' }} />
          <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Password</label>
          <input type="password" placeholder="••••••••" style={{ width: '100%', padding: '13px 15px', border: '1px solid var(--border)',
            borderRadius: 12, background: 'var(--surface)', fontSize: 14, marginBottom: 20, fontFamily: 'inherit', color: 'var(--ink)' }} />

          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: 14, fontSize: 14 }}>Continue →</button>
          <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--muted)', marginTop: 18 }}>
            New here? <span style={{ color: 'var(--accent)' }}>Create an account</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// 3. TODAY
function TwilightToday() {
  const t = useLang();
  const today = VINAADI.today;
  return (
    <div className="frame theme-twilight" style={{ display: 'flex' }}>
      <Rail active="personal" />
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <TopBar title="Senthilkumar Sivaraman" sub="Personal · Mesham Lagna · Moolam ☉" />

        <div style={{ padding: 24, display: 'grid', gridTemplateColumns: '300px 1fr', gap: 20, flex: 1 }}>
          {/* Gauge column */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 28,
            background: 'radial-gradient(300px 200px at 50% 0%, var(--accent-soft), var(--surface))' }}>
            <div className="eyebrow" style={{ marginBottom: 16 }}>{t.score}</div>
            <Dial value={today.score} size={180} stroke={10} tone="accent" label="/ 100" />
            <span className="tag tag-accent" style={{ marginTop: 16 }}>{today.tone}</span>
            <p style={{ fontSize: 13, color: 'var(--ink-2)', textAlign: 'center', marginTop: 18, lineHeight: 1.55 }}>
              A steady day under Moon Dasa. Move step by step.
            </p>
            <div style={{ width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 18 }}>
              <div style={{ padding: 10, borderRadius: 10, background: 'var(--sage-soft)', textAlign: 'center' }}>
                <div className="eyebrow" style={{ color: 'var(--sage)' }}>Best</div>
                <div className="tnum" style={{ fontSize: 12, fontWeight: 600, color: 'var(--sage)' }}>11:53</div>
              </div>
              <div style={{ padding: 10, borderRadius: 10, background: 'var(--caution-soft)', textAlign: 'center' }}>
                <div className="eyebrow" style={{ color: 'var(--caution)' }}>Hold</div>
                <div className="tnum" style={{ fontSize: 12, fontWeight: 600, color: 'var(--caution)' }}>3:28</div>
              </div>
            </div>
          </div>

          {/* Right bento */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: 'auto 1fr', gap: 16 }}>
            <div className="card" style={{ gridColumn: 'span 2' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div className="eyebrow">Day timeline</div>
                <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--muted)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 7, height: 7, borderRadius: 7, background: 'var(--sage)' }} />Auspicious</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 7, height: 7, borderRadius: 7, background: 'var(--caution)' }} />Avoid</span>
                </div>
              </div>
              <DayArc width={560} height={104} />
            </div>

            <div className="card">
              <div className="eyebrow">{t.dasa} · {t.bhukti}</div>
              <div className="display" style={{ fontSize: 24, margin: '6px 0 2px' }}>Moon · Moon</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>Mind, mother, emotions</div>
              <Meter value={30} tone="accent" />
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6 }}>2026-03-13 → 2027-03-12 · 30/100</div>
            </div>

            <div className="card">
              <div className="eyebrow">Week ahead</div>
              <div style={{ marginTop: 10 }}><Sparkline width={230} height={44} /></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--muted)', marginTop: 6 }}>
                {VINAADI.weekScores.map(d => <span key={d.n}>{d.d}</span>)}
              </div>
            </div>

            <div className="card" style={{ gridColumn: 'span 2', background: 'var(--accent-soft)', borderColor: 'transparent',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div className="eyebrow" style={{ color: 'var(--accent)' }}>{t.remedy}</div>
                <div className="display" style={{ fontSize: 18, marginTop: 4 }}>Light a sesame oil lamp Saturday. Avoid harsh speech.</div>
              </div>
              <button className="btn" style={{ flexShrink: 0 }}>Remind me</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

window.Twilight = { TwilightLanding, TwilightLogin, TwilightToday, Rail, TopBar };
