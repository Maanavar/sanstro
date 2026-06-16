// TRANSITS & DASHA — Clarity direction.

function ClarityTransits() {
  const t = useLang();
  return (
    <div className="frame theme-clarity" style={{ overflow: 'visible' }}>
      <ClarityChrome active="transits" />

      {/* Hero */}
      <div style={{ padding: '32px 32px 20px' }}>
        <div className="eyebrow" style={{ color: 'var(--accent)' }}>Transits & Dasha</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <h1 className="display" style={{ fontSize: 52, margin: '8px 0 0', letterSpacing: '-0.03em' }}>Transit intelligence</h1>
          <span className="tag">29 May 2026</span>
        </div>
        <p style={{ fontSize: 15, color: 'var(--muted)', margin: '10px 0 18px' }}>
          Vimshottari Dasa timeline, Gochar positions, journal correlations.
        </p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {[['Transits', '9'], ['Flagged', '4', 'accent'], ['Sani cycles', '1 active'], ['Dasa support', '35/100']].map(([k, v, tone]) => (
            <div key={k} className={`tag ${tone ? 'tag-' + tone : ''}`} style={{ padding: '7px 14px', fontSize: 12 }}>
              <span style={{ color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: 10.5 }}>{k}</span>
              <span style={{ fontWeight: 600, marginLeft: 4 }}>{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Planetary positions */}
      <div style={{ padding: '0 32px 20px' }}>
        <Panel title="Planetary Positions Today"
          sub="Your birth Rasi is Dhanusu. H = house from your Moon, L = house from Lagna.">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {VINAADI.planets.map((p, i) => <PlanetCard key={i} planet={p} />)}
          </div>
        </Panel>
      </div>

      {/* Saturn cycle */}
      <div style={{ padding: '0 32px 20px' }}>
        <Panel title="Saturn Cycle Status"
          sub="Saturn is currently in Meenam. These cycles track whether Saturn sits in a challenging position relative to your Moon or Lagna. Named cycles like Sadesati and Ashtama Sani traditionally ask for extra patience.">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="card-flat" style={{ padding: 18, background: 'var(--caution-soft)', border: 'none' }}>
              <div className="eyebrow" style={{ color: 'var(--caution)' }}>From Moon</div>
              <div className="display" style={{ fontSize: 22, margin: '6px 0 2px', color: 'var(--caution)' }}>Ardhashtama Sani</div>
              <div style={{ fontSize: 12.5, color: 'var(--ink-2)' }}>Home and inner stability refinement cycle</div>
            </div>
            <div className="card-flat" style={{ padding: 18, background: 'var(--sage-soft)', border: 'none' }}>
              <div className="eyebrow" style={{ color: 'var(--sage)' }}>From Lagna</div>
              <div className="display" style={{ fontSize: 22, margin: '6px 0 2px', color: 'var(--sage)' }}>Normal</div>
              <div style={{ fontSize: 12.5, color: 'var(--ink-2)' }}>No named Saturn-pressure cycle active</div>
            </div>
          </div>
          <p style={{ fontSize: 12.5, color: 'var(--muted)', fontStyle: 'italic', marginTop: 14, marginBottom: 0 }}>
            Saturn is in Meenam, which is 4th from Dhanusu Moon. This is Ardhashtama Sani, not Ezharai Sani.
          </p>
        </Panel>
      </div>

      {/* Dasa / Bhukti / Antaram */}
      <div style={{ padding: '0 32px 20px' }}>
        <Panel title="Dasa · Bhukti · Antaram"
          sub="The Vimshottari Dasa system divides your life into 120 years of planetary periods. Your current Mahadasha and Antardasha lords directly influence your daily score and the quality of outcomes across life areas.">
          <div style={{ marginBottom: 22 }}><DashaRibbon /></div>

          {/* Current mahadasha header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '14px 18px', background: 'var(--surface-2)', borderRadius: 12, marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ width: 9, height: 9, borderRadius: 9, background: PLANET_HUE.Moon }} />
              <span style={{ fontWeight: 600, fontSize: 15 }}>Moon Dasa</span>
              <span className="mono" style={{ fontSize: 12, color: 'var(--muted)' }}>2026-03-13 → 2036-03-12</span>
            </div>
            <span className="display tnum" style={{ fontSize: 18, color: 'var(--accent)' }}>35/100</span>
          </div>

          {/* Bhukti list */}
          <div className="eyebrow" style={{ marginBottom: 10 }}>{t.bhukti}</div>
          <div style={{ display: 'grid', gap: 6 }}>
            {VINAADI.bhuktis.map((b, i) => {
              const tone = scoreTone(b.score);
              return (
                <div key={i}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 14px', borderRadius: 10,
                    background: b.now ? 'var(--sage-soft)' : 'transparent',
                    border: b.now ? 'none' : '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ width: 7, height: 7, borderRadius: 7, background: PLANET_HUE[b.p] }} />
                      <span style={{ fontWeight: 500, fontSize: 14, minWidth: 64 }}>{b.p}</span>
                      <span className="mono" style={{ fontSize: 11.5, color: 'var(--muted)' }}>{b.span}</span>
                      <span className="mono" style={{ fontSize: 11, color: 'var(--muted-2)' }}>{b.yr}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {b.now && <span className="tag tag-sage" style={{ fontSize: 10 }}>● NOW</span>}
                      <span className="tnum" style={{ fontSize: 13, fontWeight: 600, color: `var(--${tone})` }}>{b.score}/100</span>
                    </div>
                  </div>
                  {b.antaram && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      margin: '6px 0 6px 28px', padding: '8px 14px', borderRadius: 10,
                      background: 'var(--accent-soft)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ width: 6, height: 6, borderRadius: 6, background: PLANET_HUE[b.antaram.p] }} />
                        <span style={{ fontWeight: 500, fontSize: 13 }}>{b.antaram.p} Antaram</span>
                        <span className="mono" style={{ fontSize: 11, color: 'var(--accent)' }}>{b.antaram.span}</span>
                      </div>
                      <span className="tag tag-accent" style={{ fontSize: 10 }}>◉ Active</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Callouts */}
          <div style={{ marginTop: 16, display: 'grid', gap: 8 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '12px 16px',
              background: 'var(--sage-soft)', borderRadius: 10, fontSize: 13.5, color: 'var(--ink-2)' }}>
              <span style={{ color: 'var(--sage)' }}>✓</span>
              Begin your most important task during the best window <strong>11:55–12:43</strong>. Consistent effort under Moon dasa yields good results.
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '12px 16px',
              background: 'var(--caution-soft)', borderRadius: 10, fontSize: 13.5, color: 'var(--ink-2)' }}>
              <span style={{ color: 'var(--caution)' }}>⚠</span>
              Ardhashtama Sani — sudden difficulties possible. Avoid Rahu Kalam <strong>10:44–12:19</strong>.
            </div>
          </div>
        </Panel>
      </div>

      {/* Journal patterns */}
      <div style={{ padding: '0 32px 36px' }}>
        <Panel title="Journal Patterns">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '18px 20px', background: 'var(--sage-soft)', borderRadius: 12 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--sage)' }}>0 / 30 entries</div>
              <div style={{ fontSize: 13, color: 'var(--ink-2)', marginTop: 2 }}>Keep journalling to unlock pattern insights.</div>
            </div>
            <button className="btn">Open journal →</button>
          </div>
        </Panel>
      </div>
    </div>
  );
}

window.ClarityTransits = ClarityTransits;
