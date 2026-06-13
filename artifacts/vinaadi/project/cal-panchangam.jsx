// CALENDAR · PANCHANGAM — Clarity direction.

function ClarityCalPanchangam() {
  const t = useLang();
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
        <CalToggle active="panchangam" />
      </div>

      <div style={{ padding: '28px 32px 36px', display: 'grid', gridTemplateColumns: '1.25fr 1fr', gap: 20 }}>
        {/* Day at a glance */}
        <Panel title="Day at a glance">
          <div className="display" style={{ fontSize: 30, marginBottom: 2 }}>Thrayodasi. Swathi. Parigha.</div>
          <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 18px' }}>Sunrise 5:57 am, sunset 6:40 pm.</p>
          <DayArc width={560} height={120} />
          <hr className="hr" style={{ margin: '20px 0' }} />
          <div style={{ display: 'grid', gap: 7 }}>
            {[
              ['Mandhi', '12:19 pm – 1:54 pm', 'accent'],
              ['Abhijit', '11:55 am – 12:43 pm', 'sage'],
              ['Nalla Neram', '7:33 am – 9:08 am', 'sage'],
              ['Nalla Neram', '12:19 pm – 1:54 pm', 'sage'],
              ['Yamagandam', '3:30 pm – 5:05 pm', 'caution'],
              ['Kuligai', '7:33 am – 9:08 am', 'caution'],
              ['Rahu Kalam', '10:44 am – 12:19 pm', 'caution'],
            ].map(([label, time, tone], i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '9px 14px', background: `var(--${tone}-soft)`, borderRadius: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ width: 6, height: 6, borderRadius: 6, background: `var(--${tone})` }} />
                  <span style={{ fontSize: 13.5, fontWeight: 500 }}>{label}</span>
                </div>
                <span className="tnum" style={{ fontSize: 12.5, color: `var(--${tone})`, fontWeight: 600 }}>{time}</span>
              </div>
            ))}
          </div>
        </Panel>

        {/* Right column */}
        <div style={{ display: 'grid', gap: 16, alignContent: 'start' }}>
          <Panel title="Panchangam · five limbs" pad={20}>
            <div style={{ display: 'grid', gap: 8 }}>
              {[
                ['Vara', 'Friday', 'Venus lord'],
                ['Tithi', 'Thrayodasi', 'Shukla 13 · 9:51 am until'],
                ['Nakshatra', 'Swathi', 'Pada 4 · 10:38 am until'],
                ['Yoga', 'Parigha', 'Yoga 19'],
                ['Karana', 'Taitila', '—'],
              ].map(([k, v, sub]) => (
                <div key={k} className="card-flat" style={{ padding: '12px 14px', display: 'grid',
                  gridTemplateColumns: '84px 1fr auto', gap: 12, alignItems: 'center' }}>
                  <div className="eyebrow">{k}</div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 500 }}>{v}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>{sub}</div>
                  </div>
                  <span className="mono" style={{ fontSize: 10.5, color: 'var(--muted-2)' }}>5L</span>
                </div>
              ))}
            </div>
          </Panel>

          <div className="card" style={{ background: 'var(--caution-soft)', borderColor: 'transparent', padding: 18 }}>
            <div className="eyebrow" style={{ color: 'var(--caution)' }}>Today's significance</div>
            <div style={{ fontSize: 13.5, marginTop: 6, lineHeight: 1.55, color: 'var(--ink-2)' }}>
              Inauspicious: Parigha yoga, inauspicious nakshatra.
            </div>
            <div style={{ fontSize: 13.5, marginTop: 4, lineHeight: 1.55, color: 'var(--ink-2)' }}>
              Chandrastamam today: Rishabam (Moon in Thulam).
            </div>
          </div>

          <Panel title="Hora table" pad={20}>
            <div style={{ display: 'grid', gap: 2 }}>
              {VINAADI.hora.map((h, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '8px 10px', borderRadius: 8, background: i === 0 ? 'var(--surface-2)' : 'transparent' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ width: 6, height: 6, borderRadius: 6, background: PLANET_HUE[h.p] }} />
                    <span style={{ fontSize: 13, fontWeight: i === 0 ? 600 : 400 }}>{h.p} Hora</span>
                  </div>
                  <span className="mono" style={{ fontSize: 11.5, color: 'var(--muted)' }}>{h.t}</span>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

window.ClarityCalPanchangam = ClarityCalPanchangam;
