// CALENDAR · FAMILY — Clarity direction.

function ClarityCalFamily() {
  const t = useLang();
  const days = [
    { d: 'FRI', n: 29, s: 70 }, { d: 'SAT', n: 30, s: 58 }, { d: 'SUN', n: 31, s: 63 },
    { d: 'MON', n: 1, s: 60 }, { d: 'TUE', n: 2, s: 58 }, { d: 'WED', n: 3, s: 58 }, { d: 'THU', n: 4, s: 53 },
  ];
  return (
    <div className="frame theme-clarity" style={{ overflow: 'visible' }}>
      <ClarityChrome active="calendar" />

      <div style={{ padding: '28px 32px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div className="eyebrow" style={{ color: 'var(--accent)' }}>Transits & Events</div>
          <h1 className="display" style={{ fontSize: 40, margin: '8px 0 4px', letterSpacing: '-0.025em' }}>
            29 May 2026 — Transits, Dasha & Events
          </h1>
          <p style={{ fontSize: 14, color: 'var(--muted)' }}>Friday · Tithi Shukla 13 · Swathi Nakshatra</p>
        </div>
        <CalToggle active="family" />
      </div>

      {/* Family summary banner */}
      <div style={{ padding: '24px 32px 0' }}>
        <div className="card" style={{ padding: 24, display: 'grid', gridTemplateColumns: '1fr auto', gap: 24,
          background: 'var(--accent-soft)', borderColor: 'transparent' }}>
          <div>
            <div className="eyebrow" style={{ color: 'var(--accent)' }}>Senthils family · 29 May 2026</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, margin: '6px 0 6px' }}>
              <span className="display tnum" style={{ fontSize: 56, lineHeight: 1 }}>70</span>
              <span style={{ fontSize: 16, color: 'var(--muted)' }}>/100</span>
              <span className="tag tag-sage">Supportive</span>
            </div>
            <p style={{ fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.55, maxWidth: 620, margin: 0 }}>
              The family day is supportive but mixed. Keep decisions simple and support the member who needs a gentler pace.
              Best shared window 07:01–08:04. Avoid beginning important new work during Rahu Kalam.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, justifyContent: 'center' }}>
            <div className="tag tag-sage" style={{ padding: '8px 14px' }}>☉ Venus Hora 5:57 – 7:01 am</div>
            <div className="tag tag-caution" style={{ padding: '8px 14px' }}>⚠ Avoid 10:44 am – 12:19 pm</div>
          </div>
        </div>
      </div>

      {/* Score breakdown */}
      <div style={{ padding: '20px 32px 0' }}>
        <Panel title="Family score breakdown">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
            {[['Mean score', 65, '/100'], ['Support need', 8, '0–100'], ['Decision readiness', 64, '0–100'], ['Members', 2, 'in vault']].map(([k, v, sub]) => (
              <div key={k} className="card-flat" style={{ padding: 18 }}>
                <div className="eyebrow">{k}</div>
                <div className="display tnum" style={{ fontSize: 40, lineHeight: 1, margin: '6px 0 2px' }}>{v}</div>
                <div className="mono" style={{ fontSize: 11, color: 'var(--muted)' }}>{sub}</div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {/* Member scores */}
      <div style={{ padding: '20px 32px 0' }}>
        <Panel title="Member scores">
          <div style={{ display: 'grid', gap: 16 }}>
            {[['Senthilkumar Sivaraman', 'Self', 64], ['Aadhinii Senthilkumar', 'Daughter', 70]].map(([name, rel, s]) => {
              const tone = scoreTone(s);
              return (
                <div key={name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ width: 26, height: 26, borderRadius: 26, background: 'var(--accent-soft)', color: 'var(--accent)',
                        display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 700 }}>{name.charAt(0)}</span>
                      <span style={{ fontSize: 14, fontWeight: 500 }}>{name}</span>
                      <span className="eyebrow">{rel}</span>
                    </div>
                    <span className="tnum" style={{ fontSize: 14, fontWeight: 600, color: `var(--${tone})` }}>{s}/100</span>
                  </div>
                  <Meter value={s} tone={tone} height={6} />
                </div>
              );
            })}
          </div>
        </Panel>
      </div>

      {/* 7-day family fortune */}
      <div style={{ padding: '20px 32px 36px' }}>
        <Panel title="7-day family fortune calendar">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 12 }}>
            {days.map((day, i) => {
              const tone = scoreTone(day.s);
              return (
                <div key={i} className="card-flat" style={{ padding: 16, textAlign: 'center',
                  border: i === 0 ? '1px solid var(--accent)' : '1px solid var(--border)' }}>
                  <div className="eyebrow">{day.d}</div>
                  <div className="display tnum" style={{ fontSize: 22, margin: '2px 0 10px' }}>{day.n}</div>
                  <div style={{ margin: '0 auto 10px', width: 'fit-content' }}>
                    <Dial value={day.s} size={56} stroke={5} tone={tone} />
                  </div>
                  <div className="eyebrow" style={{ fontSize: 9, color: `var(--${tone})` }}>Supportive</div>
                  <div style={{ fontSize: 10.5, color: 'var(--muted)', marginTop: 4 }}>Best 5:57 am</div>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>
    </div>
  );
}

window.ClarityCalFamily = ClarityCalFamily;
