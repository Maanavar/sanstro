// CALENDAR · PERSONAL — Clarity direction. The dense forecast view.

function LifeWindowRow({ w }) {
  const icon = { career: '💼', health: '🌿', marriage: '💍', study: '🎓' }[w.kind] || '•';
  const confTone = w.conf === 'High confidence' ? 'sage' : w.conf === 'Indicative' ? 'info' : 'accent';
  const hue = { career: 'var(--info)', health: 'var(--sage)', marriage: 'var(--accent)', study: 'var(--sage)' }[w.kind];
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 16px', borderLeft: `3px solid ${hue}`, background: 'var(--surface-2)',
      borderRadius: '0 10px 10px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 15 }}>{icon}</span>
        <div>
          <div style={{ fontSize: 13.5, fontWeight: 500 }}>{w.label}</div>
          <div className="mono" style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>{w.span}</div>
        </div>
      </div>
      <span style={{ fontSize: 11.5, color: `var(--${confTone})`, fontWeight: 500 }}>
        {w.confDot} {w.conf}
      </span>
    </div>
  );
}

function ClarityCalPersonal() {
  const t = useLang();
  const week = [
    { d: 'Fri', n: 29, s: 62 }, { d: 'Sat', n: 30, s: 59 }, { d: 'Sun', n: 31, s: 65, best: true },
    { d: 'Mon', n: 1, s: 60 }, { d: 'Tue', n: 2, s: 58 }, { d: 'Wed', n: 3, s: 58 }, { d: 'Thu', n: 4, s: 53 },
  ];
  const high = VINAADI.lifeWindows.high.map(w => ({ ...w, conf: 'High confidence', confDot: '●●●' }));
  const med = VINAADI.lifeWindows.medium.map(w => ({ ...w, confDot: w.conf === 'Indicative' ? '●○○' : '●●○' }));

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
        <CalToggle active="personal" />
      </div>

      {/* Week ahead */}
      <div style={{ padding: '24px 32px 0' }}>
        <Panel title="Week ahead"
          right={<span style={{ fontSize: 12, color: 'var(--muted)' }}>Best day <strong style={{ color: 'var(--sage)' }}>31 May · 65</strong></span>}>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: -8, marginBottom: 14 }}>
            Dasha theme: Discipline, responsibility, service, longevity.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 10 }}>
            {week.map((d, i) => {
              const tone = scoreTone(d.s);
              return (
                <div key={i} className="card-flat" style={{ padding: 14, textAlign: 'center',
                  border: d.best ? '1px solid var(--sage)' : '1px solid var(--border)',
                  background: d.best ? 'var(--sage-soft)' : 'var(--surface-2)' }}>
                  <div className="eyebrow">{d.d}</div>
                  <div className="display tnum" style={{ fontSize: 18, margin: '2px 0 8px' }}>{d.n}</div>
                  <Dial value={d.s} size={48} stroke={5} tone={tone} />
                </div>
              );
            })}
          </div>
        </Panel>
      </div>

      {/* Dasha timeline ribbon */}
      <div style={{ padding: '20px 32px 0' }}>
        <Panel title="Dasha timeline"><DashaRibbon /></Panel>
      </div>

      {/* Dasa bhukti antaram (compact) */}
      <div style={{ padding: '20px 32px 0' }}>
        <Panel title="Dasa · Bhukti · Antaram">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '12px 16px', background: 'var(--surface-2)', borderRadius: 12, marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ width: 9, height: 9, borderRadius: 9, background: PLANET_HUE.Moon }} />
              <span style={{ fontWeight: 600, fontSize: 15 }}>Moon Dasa</span>
              <span className="mono" style={{ fontSize: 12, color: 'var(--muted)' }}>2026-03-13 → 2036-03-12</span>
            </div>
            <span className="display tnum" style={{ fontSize: 18, color: 'var(--accent)' }}>35/100</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {VINAADI.bhuktis.slice(0, 8).map((b, i) => {
              const tone = scoreTone(b.score);
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '8px 12px', borderRadius: 9,
                  background: b.now ? 'var(--sage-soft)' : 'transparent', border: b.now ? 'none' : '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <span style={{ width: 6, height: 6, borderRadius: 6, background: PLANET_HUE[b.p] }} />
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{b.p}</span>
                    {b.now && <span className="tag tag-sage" style={{ fontSize: 9, padding: '1px 6px' }}>NOW</span>}
                  </div>
                  <span className="tnum" style={{ fontSize: 12, fontWeight: 600, color: `var(--${tone})` }}>{b.score}</span>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>

      {/* Life event windows */}
      <div style={{ padding: '20px 32px 0' }}>
        <Panel title="Life event windows" sub="5-year forward view. Confidence reflects how many independent signals align.">
          <div className="eyebrow" style={{ color: 'var(--sage)', marginBottom: 8 }}>High confidence</div>
          <div style={{ display: 'grid', gap: 8, marginBottom: 18 }}>
            {high.map((w, i) => <LifeWindowRow key={i} w={w} />)}
          </div>
          <div className="eyebrow" style={{ color: 'var(--muted)', marginBottom: 8 }}>Medium / low confidence</div>
          <div style={{ display: 'grid', gap: 8 }}>
            {med.map((w, i) => <LifeWindowRow key={i} w={w} />)}
          </div>
        </Panel>
      </div>

      {/* Today summary + score breakdown */}
      <div style={{ padding: '20px 32px 0', display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: 16 }}>
        <div className="card" style={{ padding: 24, background: 'var(--accent-soft)', borderColor: 'transparent' }}>
          <div className="eyebrow" style={{ color: 'var(--accent)' }}>Senthil · 29 May 2026</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, margin: '6px 0 4px' }}>
            <span className="display tnum" style={{ fontSize: 52, lineHeight: 1 }}>62</span>
            <span style={{ fontSize: 15, color: 'var(--muted)' }}>/100</span>
          </div>
          <span className="tag tag-accent">Balanced</span>
          <p style={{ fontSize: 13.5, color: 'var(--ink-2)', lineHeight: 1.55, marginTop: 14, marginBottom: 0 }}>
            Today 62/100 — a steady day. Moon dasa is active. Move step by step and keep decisions simple.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
            <div className="tag tag-sage" style={{ padding: '7px 12px', justifyContent: 'flex-start' }}>☼ Best 11:55 am – 12:43 pm</div>
            <div className="tag tag-sage" style={{ padding: '7px 12px', justifyContent: 'flex-start' }}>☼ Best 5:57 am – 7:01 am</div>
            <div className="tag tag-caution" style={{ padding: '7px 12px', justifyContent: 'flex-start' }}>⚠ Caution 10:44 am – 12:19 pm</div>
          </div>
        </div>

        <Panel title="Score breakdown">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 16 }}>
            {[['Moon transit', 21], ['Dasa support', 7], ['Panchangam', 10], ['Transit positions', 12]].map(([k, v]) => (
              <div key={k} className="card-flat" style={{ padding: 14 }}>
                <div className="eyebrow">{k}</div>
                <div className="display tnum" style={{ fontSize: 28, marginTop: 4 }}>{v}</div>
              </div>
            ))}
          </div>
          <div className="eyebrow" style={{ marginBottom: 6 }}>Action suggestion</div>
          <p style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.55, margin: '0 0 10px' }}>
            Begin your most important task during the best window 11:55–12:43. Consistent effort under Moon dasa yields good results.
          </p>
          <div className="eyebrow" style={{ color: 'var(--caution)', marginBottom: 6 }}>Caution</div>
          <p style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.55, margin: 0 }}>
            Avoid Rahu Kalam 10:44–12:19 for new starts. Prevent rushed decisions.
          </p>
        </Panel>
      </div>

      {/* Why this prediction */}
      <div style={{ padding: '20px 32px 0' }}>
        <Panel title="Why this prediction">
          <div style={{ display: 'grid', gap: 2 }}>
            {[
              ['Moon transit', 'Moon is in Thulam (Libra) — house 5 from birth sign. Mental state is supportive.'],
              ['Dasa support', 'Moon dasa — mind, emotions. Rahu antaram — favourable for learning, negotiation. Dasa provides reduced support (35/100).'],
              ['Panchangam', 'Tithi 13 — favourable · Yoga: Parigha — ordinary day · Nakshatra: Swathi (score 70/100).'],
              ['Gochar', 'Jupiter in house 1 (neutral) · Saturn in house 4 (neutral). Gochar score 48/100.'],
              ['Personal caution', 'Ardhashtama Sani (from Moon) — structural restructuring and inner stability cycle.'],
            ].map(([k, v], i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 16,
                padding: '12px 0', borderBottom: i < 4 ? '1px solid var(--border)' : 'none' }}>
                <div className="eyebrow" style={{ paddingTop: 2 }}>{k}</div>
                <div style={{ fontSize: 13.5, color: 'var(--ink-2)', lineHeight: 1.5 }}>{v}</div>
              </div>
            ))}
          </div>
          <div className="card-flat" style={{ marginTop: 16, padding: 16, background: 'var(--accent-soft)', border: 'none' }}>
            <div className="eyebrow" style={{ color: 'var(--accent)' }}>Remedy / worship</div>
            <p style={{ fontSize: 13.5, color: 'var(--ink-2)', lineHeight: 1.55, margin: '6px 0 0' }}>
              Sun appears weak: perform 12 rounds of Surya Namaskar facing east at sunrise; recite Aditya Hridayam or Gayatri;
              offer Arghyam to the rising Sun; consider visiting a Suryanar temple.
            </p>
          </div>
        </Panel>
      </div>

      {/* Next 3 days */}
      <div style={{ padding: '20px 32px 36px' }}>
        <Panel title="Next 3 days · fortune score">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            {[['29 May 2026', 62, 'Balanced', 'accent'], ['30 May 2026', 59, 'Balanced', 'accent'], ['31 May 2026', 65, 'Good', 'sage']].map(([date, s, label, tone]) => (
              <div key={date} className="card-flat" style={{ padding: 18,
                background: tone === 'sage' ? 'var(--sage-soft)' : 'var(--surface-2)',
                border: tone === 'sage' ? 'none' : '1px solid var(--border)' }}>
                <div className="eyebrow">{date}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, margin: '6px 0 2px' }}>
                  <span className="display tnum" style={{ fontSize: 34, lineHeight: 1 }}>{s}</span>
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>/100</span>
                </div>
                <div className="eyebrow" style={{ color: `var(--${tone})` }}>{label}</div>
                <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 8 }}>Best 11:55 am – 12:43 pm</div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

window.ClarityCalPersonal = ClarityCalPersonal;
