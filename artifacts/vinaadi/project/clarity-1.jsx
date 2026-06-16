// CLARITY — Light editorial direction.
// Warm cream, ink-on-paper, big serif numerals, generous whitespace.
// Feels like a calm journal that happens to do Jyotish.

const C = { theme: 'clarity' };

// ──────────────────────────────────────────────────────────────
// 1. LANDING
function ClarityLanding() {
  const t = useLang();
  return (
    <div className="frame theme-clarity grain">
      <div style={{ padding: '32px 56px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <Mark size={28} />
          <div className="display" style={{ fontSize: 22 }}>Vinaadi</div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button className="btn btn-ghost">How it works</button>
          <button className="btn btn-ghost">Family</button>
          <button className="btn btn-ghost">Pricing</button>
          <button className="btn">{t.signIn}</button>
        </div>
      </div>

      <div style={{ padding: '32px 56px 0', display: 'grid', gridTemplateColumns: '1.05fr 1fr', gap: 64 }}>
        <div>
          <div className="eyebrow" style={{ color: 'var(--accent)' }}>Daily Jyotish · for calm planning</div>
          <h1 className="display" style={{ fontSize: 88, margin: '20px 0 24px', lineHeight: 0.98, letterSpacing: '-0.035em' }}>
            One quiet<br/>reading.<br/>
            <span style={{ fontStyle: 'italic', color: 'var(--muted)' }}>Every morning.</span>
          </h1>
          <p style={{ fontSize: 18, lineHeight: 1.5, color: 'var(--ink-2)', maxWidth: 460, marginBottom: 32 }}>
            Vinaadi turns Thirukanitham — your chart, dasa, transit and panchangam — into a single, balanced
            answer for today, and for the people you plan with.
          </p>
          <div style={{ display:'flex', gap:12, marginBottom: 56 }}>
            <button className="btn btn-primary" style={{ padding: '14px 22px', fontSize: 14 }}>
              {t.open} →
            </button>
            <button className="btn" style={{ padding: '14px 22px', fontSize: 14 }}>
              See a sample reading
            </button>
          </div>
          <div style={{ display:'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
            {[
              ['Calm', 'No fear-language. Just signal.'],
              ['Whole-family', 'Shared vault, decisions in one place.'],
              ['Thirukanitham', 'Tamil calendar, exact panchangam.'],
            ].map(([k, v]) => (
              <div key={k}>
                <div className="display" style={{ fontSize: 24, marginBottom: 4 }}>{k}</div>
                <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.5 }}>{v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: floating "today" preview card */}
        <div style={{ position: 'relative', paddingTop: 8 }}>
          <div className="card" style={{ padding: 28, boxShadow: '0 30px 80px -30px rgba(60,40,20,0.18)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom: 20 }}>
              <div>
                <div className="eyebrow">Tuesday, 26 May</div>
                <div className="display" style={{ fontSize: 32, marginTop: 4 }}>Senthil's day</div>
              </div>
              <Dial value={64} size={84} stroke={6} tone="ink" />
            </div>
            <p style={{ fontSize: 15, lineHeight: 1.55, color: 'var(--ink-2)', marginBottom: 18 }}>
              A balanced day under <em>Moon Dasa · Moon Bhukti</em>. Saturn refines home and inner stability.
            </p>
            <DayArc width={400} height={88} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 16 }}>
              <div className="card-flat" style={{ padding: 14, background: 'var(--sage-soft)', border: 'none' }}>
                <div className="eyebrow" style={{ color: 'var(--sage)' }}>Best window</div>
                <div className="display tnum" style={{ fontSize: 20, marginTop: 2, color: 'var(--sage)' }}>11:53 – 12:41</div>
              </div>
              <div className="card-flat" style={{ padding: 14, background: 'var(--caution-soft)', border: 'none' }}>
                <div className="eyebrow" style={{ color: 'var(--caution)' }}>Hold</div>
                <div className="display tnum" style={{ fontSize: 20, marginTop: 2, color: 'var(--caution)' }}>3:28 – 5:03</div>
              </div>
            </div>
            <hr className="hr" style={{ margin: '18px 0' }} />
            <div style={{ display:'flex', justifyContent:'space-between', fontSize: 12, color: 'var(--muted)' }}>
              <span>Mesham Lagna · Moolam ☉ Dhanusu</span>
              <span>D1 · D9 ready</span>
            </div>
          </div>

          {/* sticker note */}
          <div style={{ position: 'absolute', right: -8, top: -16, transform: 'rotate(4deg)',
            background: 'var(--accent)', color: '#fff',
            padding: '6px 12px', borderRadius: 999, fontSize: 11, letterSpacing: '0.1em',
            textTransform: 'uppercase', fontWeight: 600 }}>
            today's reading
          </div>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// 2. LOGIN
function ClarityLogin() {
  const t = useLang();
  return (
    <div className="frame theme-clarity grain" style={{ display: 'grid', placeItems: 'center' }}>
      <div style={{ position: 'absolute', top: 32, left: 32, display:'flex', alignItems:'center', gap:10 }}>
        <Mark size={22} /><span className="display" style={{ fontSize: 18 }}>Vinaadi</span>
      </div>
      <div style={{ width: 420 }}>
        <div className="eyebrow" style={{ marginBottom: 8, color: 'var(--accent)' }}>Welcome back</div>
        <h2 className="display" style={{ fontSize: 44, margin: '0 0 8px', letterSpacing: '-0.025em' }}>
          Sign in to<br/>your <em style={{ color: 'var(--muted)' }}>quiet</em> reading.
        </h2>
        <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 28 }}>
          Continue with your Vinaadi account.
        </p>

        <div style={{ display:'flex', background: 'var(--surface-2)', borderRadius: 999, padding: 4, marginBottom: 24, border: '1px solid var(--border)' }}>
          <div style={{ flex: 1, padding: '8px 0', background: 'var(--surface)',
            borderRadius: 999, textAlign:'center', fontSize: 13, fontWeight: 500,
            boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>Sign in</div>
          <div style={{ flex: 1, padding: '8px 0', textAlign:'center', fontSize: 13, color: 'var(--muted)' }}>Sign up</div>
        </div>

        <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Email</label>
        <input placeholder="you@example.com"
          style={{ width: '100%', padding: '14px 16px', border: '1px solid var(--border)',
            borderRadius: 12, background: 'var(--surface)', fontSize: 14, marginBottom: 16,
            fontFamily: 'inherit' }} />

        <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Password</label>
        <input type="password" placeholder="••••••••"
          style={{ width: '100%', padding: '14px 16px', border: '1px solid var(--border)',
            borderRadius: 12, background: 'var(--surface)', fontSize: 14, marginBottom: 8,
            fontFamily: 'inherit' }} />
        <div style={{ textAlign: 'right', fontSize: 12, color: 'var(--accent)', marginBottom: 24 }}>
          Forgot password?
        </div>

        <button className="btn btn-primary"
          style={{ width: '100%', padding: 14, fontSize: 14, justifyContent: 'center' }}>
          Continue
        </button>
        <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--muted)', marginTop: 20 }}>
          By signing in you agree to our <span style={{ textDecoration: 'underline' }}>terms</span>.
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// 3. TODAY (Personal dashboard)
function ClarityToday() {
  const t = useLang();
  const u = VINAADI.user, today = VINAADI.today;
  return (
    <div className="frame theme-clarity">
      {/* Top chrome */}
      <div style={{ padding: '20px 32px 14px', display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display:'flex', alignItems:'center', gap: 14 }}>
          <Mark size={22} />
          <div>
            <div className="display" style={{ fontSize: 17 }}>Vinaadi</div>
            <div className="eyebrow">{u.name} · {u.lagna} Lagna</div>
          </div>
        </div>
        <div style={{ display:'flex', alignItems: 'center', gap: 10 }}>
          <span className="tag tag-sage">●&nbsp; Refreshed 2m ago</span>
          <span className="tag">Senthils family</span>
          <span style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--ink)', color: '#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize: 12, fontWeight: 600 }}>S</span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ padding: '0 32px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display:'flex', gap: 4 }}>
          {['personal','lifeAreas','family','calendar','settings','qa'].map((k, i) => (
            <div key={k} className={`tab ${i === 0 ? 'active' : ''}`}>{t[k]}</div>
          ))}
        </div>
      </div>

      {/* Hero */}
      <div style={{ padding: '32px 32px 24px', display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 28 }}>
        <div>
          <div className="eyebrow" style={{ color: 'var(--accent)' }}>{today.date}</div>
          <h1 className="display" style={{ fontSize: 56, margin: '8px 0 16px', letterSpacing: '-0.03em', lineHeight: 1.0 }}>
            Today is <em style={{ color: 'var(--muted)' }}>balanced.</em><br/>
            Move step by step.
          </h1>
          <p style={{ fontSize: 16, color: 'var(--ink-2)', maxWidth: 540, lineHeight: 1.55, marginBottom: 24 }}>
            {today.blurb} Best progress sits in the late morning window. Avoid major commitments during Rahu Kalam in the afternoon.
          </p>
          <DayArc width={620} height={120} />
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display:'flex', justifyContent: 'space-between', alignItems:'flex-start' }}>
            <div>
              <div className="eyebrow">{t.score}</div>
              <div className="display tnum" style={{ fontSize: 72, lineHeight: 1, marginTop: 4 }}>{today.score}<span style={{ fontSize: 22, color: 'var(--muted)' }}>/100</span></div>
              <div style={{ marginTop: 8 }}>
                <span className="tag tag-accent">{today.tone}</span>
              </div>
            </div>
            <Dial value={today.score} size={100} stroke={6} tone="accent" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 18 }}>
            <div className="card-flat" style={{ background:'var(--sage-soft)', border:'none', padding: 12 }}>
              <div className="eyebrow" style={{ color: 'var(--sage)' }}>{t.bestWindow}</div>
              <div className="tnum" style={{ fontSize: 15, fontWeight: 500, marginTop: 2 }}>{today.bestWindow}</div>
            </div>
            <div className="card-flat" style={{ background:'var(--caution-soft)', border:'none', padding: 12 }}>
              <div className="eyebrow" style={{ color: 'var(--caution)' }}>{t.caution}</div>
              <div className="tnum" style={{ fontSize: 15, fontWeight: 500, marginTop: 2 }}>{today.caution}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Bento row */}
      <div style={{ padding: '0 32px 32px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
        <div className="card">
          <div className="eyebrow">{t.dasa}</div>
          <div className="display" style={{ fontSize: 26, margin: '4px 0' }}>{today.dasa}</div>
          <div style={{ fontSize: 13, color: 'var(--muted)' }}>{today.bhukti} · 2026-03-13 → 2027-03-12</div>
          <hr className="hr" style={{ margin: '14px 0' }} />
          <div style={{ display:'flex', justifyContent:'space-between', fontSize: 12 }}>
            <span style={{ color: 'var(--muted)' }}>Theme</span>
            <span>Mind · Mother · Emotions</span>
          </div>
        </div>

        <div className="card">
          <div className="eyebrow">{t.nakshatra}</div>
          <div className="display" style={{ fontSize: 26, margin: '4px 0' }}>Moolam <span style={{ fontSize: 14, color: 'var(--muted)', fontStyle: 'italic' }}>· root</span></div>
          <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.5 }}>
            Investigative mind. Drawn to finding root causes.
          </div>
          <div style={{ display:'flex', gap: 6, marginTop: 12, flexWrap: 'wrap' }}>
            <span className="tag tag-sage">Research</span>
            <span className="tag tag-sage">Depth</span>
            <span className="tag">Ketu ruled</span>
          </div>
        </div>

        <div className="card">
          <div className="eyebrow">Week ahead</div>
          <Sparkline width={260} height={48} />
          <div style={{ display:'flex', justifyContent:'space-between', fontSize: 11, color: 'var(--muted)', marginTop: 6 }}>
            {VINAADI.weekScores.map(d => <span key={d.n}>{d.d}</span>)}
          </div>
          <hr className="hr" style={{ margin: '14px 0' }} />
          <div style={{ fontSize: 13 }}>
            Best day <span className="tnum" style={{ fontWeight: 500 }}>Tue</span> ·
            Easiest evening <span className="tnum" style={{ fontWeight: 500 }}>Sun</span>
          </div>
        </div>
      </div>

      {/* Remedy strip */}
      <div style={{ padding: '0 32px 32px' }}>
        <div className="card" style={{ background: 'var(--accent-soft)', borderColor: 'transparent', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 22px' }}>
          <div>
            <div className="eyebrow" style={{ color: 'var(--accent)' }}>{t.remedy} · today</div>
            <div className="display" style={{ fontSize: 20, marginTop: 4 }}>Light a sesame oil lamp this Saturday. Avoid harsh speech.</div>
          </div>
          <button className="btn">Save reminder →</button>
        </div>
      </div>
    </div>
  );
}

window.Clarity = { ClarityLanding, ClarityLogin, ClarityToday };
