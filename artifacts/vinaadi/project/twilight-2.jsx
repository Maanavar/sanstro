// TWILIGHT — part 2: Life Areas, Predictions, Family, Calendar, Setup.

// 4. LIFE AREAS
function TwilightLifeAreas() {
  const t = useLang();
  return (
    <div className="frame theme-twilight" style={{ display: 'flex' }}>
      <Rail active="lifeAreas" />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <TopBar title="Life Areas" sub="Personal · age 33 · Moon Dasa" />
        <div style={{ padding: '20px 32px 12px', display: 'flex', gap: 6 }}>
          {['Overview','Predictions','Yogas & Doshams','Jadhagam'].map((s, i) => (
            <span key={s} className={`tag ${i === 0 ? 'tag-accent' : ''}`}>{s}</span>
          ))}
        </div>
        <div style={{ padding: '4px 32px 32px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {VINAADI.lifeAreas.map(a => {
            const tone = a.score >= 60 ? 'sage' : a.score >= 45 ? 'accent' : 'caution';
            return (
              <div key={a.key} className="card" style={{ padding: 22 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                  <div>
                    <div className="eyebrow">{a.label}</div>
                    <div className="display tnum" style={{ fontSize: 40, lineHeight: 1, marginTop: 6, color: `var(--${tone})` }}>{a.score}</div>
                  </div>
                  <Dial value={a.score} size={56} stroke={5} tone={tone} />
                </div>
                <p style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.5, minHeight: 56 }}>{a.note}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, fontSize: 11, color: 'var(--muted)' }}>
                  <span style={{ color: `var(--${tone})` }}>{a.trend === 'down' ? '↓ softening' : a.trend === 'up' ? '↑ rising' : '– steady'}</span>
                  <span className="mono">H{(a.score % 9) + 1}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// 5. PREDICTIONS
function TwilightPredictions() {
  const t = useLang();
  return (
    <div className="frame theme-twilight" style={{ display: 'flex' }}>
      <Rail active="lifeAreas" />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <TopBar title="Predictions" sub="Personal · next 6 months" />
        <div style={{ padding: '20px 32px 12px', display: 'flex', gap: 6 }}>
          {['Overview','Predictions','Yogas & Doshams','Jadhagam'].map((s, i) => (
            <span key={s} className={`tag ${i === 1 ? 'tag-accent' : ''}`}>{s}</span>
          ))}
        </div>
        <div style={{ padding: '4px 32px 32px', display: 'grid', gap: 16 }}>
          <div className="card" style={{ padding: 24, display: 'grid', gridTemplateColumns: '1fr 260px', gap: 28 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <span className="eyebrow">Marriage</span><span className="tag tag-accent">Medium signal</span>
              </div>
              <div className="display" style={{ fontSize: 26, lineHeight: 1.15, marginBottom: 12 }}>
                Indicators are mixed. A planned, paced approach lands you well.
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginTop: 8 }}>
                <div>
                  <div className="eyebrow" style={{ color: 'var(--sage)', marginBottom: 8 }}>Supporting</div>
                  {['Venus offers support','Transit support present','Age phase supportive'].map(s => (
                    <div key={s} style={{ display: 'flex', gap: 8, fontSize: 13, marginBottom: 6, color: 'var(--ink-2)' }}>
                      <span style={{ width: 5, height: 5, borderRadius: 5, background: 'var(--sage)', marginTop: 7, flexShrink: 0 }} />{s}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="eyebrow" style={{ color: 'var(--caution)', marginBottom: 8 }}>Watch</div>
                  {['7th lord challenged','Dasha timing moderate','Sevvai dosham','Rahu–Ketu patience'].map(s => (
                    <div key={s} style={{ display: 'flex', gap: 8, fontSize: 13, marginBottom: 6, color: 'var(--ink-2)' }}>
                      <span style={{ width: 5, height: 5, borderRadius: 5, background: 'var(--caution)', marginTop: 7, flexShrink: 0 }} />{s}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: 24 }}>
              <div className="eyebrow">Window</div>
              <div className="display tnum" style={{ fontSize: 22, lineHeight: 1.2, marginTop: 6 }}>May 2026 →<br/>Dec 2026</div>
              <hr className="hr" style={{ margin: '16px 0' }} />
              {[['Dasha','Weak','caution'],['Transit','Strong','sage'],['Age phase','Strong','sage']].map(([k, v, c]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 8 }}>
                  <span style={{ color: 'var(--muted)' }}>{k}</span><span style={{ color: `var(--${c})` }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {[['Career','Favourable phase for growth.','High','sage'],
              ['Wealth','Avoid high-risk exposure.','Low','caution'],
              ['Health','Preventive care first.','Low','caution']].map(([k, v, sig, tone]) => (
              <div key={k} className="card-flat" style={{ padding: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div className="eyebrow" style={{ color: `var(--${tone})` }}>{k}</div>
                  <span className={`tag tag-${tone}`}>{sig}</span>
                </div>
                <div style={{ fontSize: 14, color: 'var(--ink)' }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// 6. FAMILY
function TwilightFamily() {
  const t = useLang();
  return (
    <div className="frame theme-twilight" style={{ display: 'flex' }}>
      <Rail active="family" />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <TopBar title="Senthils family" sub="Family vault · 2 members" />
        <div style={{ padding: 24, display: 'grid', gridTemplateColumns: '320px 1fr', gap: 20, flex: 1 }}>
          <div className="card" style={{ padding: 26, display: 'flex', flexDirection: 'column' }}>
            <div className="eyebrow">Family today</div>
            <div style={{ display: 'grid', placeItems: 'center', margin: '18px 0' }}>
              <Dial value={70} size={150} stroke={10} tone="sage" label="/ 100" />
            </div>
            <span className="tag tag-sage" style={{ alignSelf: 'center' }}>Supportive</span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 20 }}>
              <div style={{ padding: 12, borderRadius: 10, background: 'var(--sage-soft)' }}>
                <div className="eyebrow" style={{ color: 'var(--sage)' }}>Best shared</div>
                <div className="tnum" style={{ fontSize: 13, fontWeight: 600, marginTop: 2, color: 'var(--sage)' }}>07:01–08:04</div>
              </div>
              <div style={{ padding: 12, borderRadius: 10, background: 'var(--caution-soft)' }}>
                <div className="eyebrow" style={{ color: 'var(--caution)' }}>Avoid</div>
                <div className="tnum" style={{ fontSize: 13, fontWeight: 600, marginTop: 2, color: 'var(--caution)' }}>15:29–17:04</div>
              </div>
            </div>
            <hr className="hr" style={{ margin: '20px 0 14px' }} />
            <div className="eyebrow" style={{ marginBottom: 10 }}>7-day outlook</div>
            <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 64 }}>
              {VINAADI.weekScores.map(d => (
                <div key={d.n} style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ height: 48, display: 'flex', alignItems: 'flex-end' }}>
                    <div style={{ width: '100%', height: `${d.s}%`, background: d.s >= 65 ? 'var(--sage)' : 'var(--accent)', borderRadius: 3, opacity: 0.85 }} />
                  </div>
                  <div style={{ fontSize: 9, color: 'var(--muted)', marginTop: 4 }}>{d.d}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateRows: 'repeat(2, 1fr)', gap: 16 }}>
            {[
              { name: 'Senthilkumar Sivaraman', rel: 'Self', score: 64, info: 'Mesham Lagna · Moolam ☉ · Moon Dasa' },
              { name: 'Aadhinii Senthilkumar', rel: 'Daughter', score: 70, info: 'Mesham Lagna · Uthiradam ☉ · Sun Dasa' },
            ].map(m => (
              <div key={m.name} className="card" style={{ padding: 24, display: 'flex', alignItems: 'center', gap: 24 }}>
                <Dial value={m.score} size={86} stroke={7} tone={m.score >= 65 ? 'sage' : 'accent'} />
                <div style={{ flex: 1 }}>
                  <div className="eyebrow">{m.rel}</div>
                  <div className="display" style={{ fontSize: 26, margin: '4px 0' }}>{m.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>{m.info}</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <span className="tag tag-sage">Best 7:01 AM</span>
                    <span className="tag tag-caution">Avoid 3:29 PM</span>
                    <span className="tag">View chart →</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// 7. CALENDAR · PANCHANGAM
function TwilightCalendar() {
  const t = useLang();
  return (
    <div className="frame theme-twilight" style={{ display: 'flex' }}>
      <Rail active="calendar" />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <TopBar title="Calendar · Panchangam" sub="Tuesday · 26 May 2026" />
        <div style={{ padding: 24, display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 20, flex: 1 }}>
          <div className="card" style={{ padding: 26 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
              <div className="display" style={{ fontSize: 28 }}>Ekadasi</div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>Sunrise 5:56 · Sunset 6:38</div>
            </div>
            <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 18 }}>Hastham · Siddhi yoga · Vanija karana</div>
            <DayArc width={520} height={116} />
            <hr className="hr" style={{ margin: '20px 0' }} />
            <div style={{ display: 'grid', gap: 8 }}>
              {VINAADI.windows.map((w, i) => {
                const tone = w.tone === 'best' ? 'sage' : w.tone === 'avoid' ? 'caution' : w.tone === 'good' ? 'sage' : 'accent';
                return (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 13px', background: `var(--${tone}-soft)`, borderRadius: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ width: 6, height: 6, borderRadius: 6, background: `var(--${tone})` }} />
                      <span style={{ fontSize: 13, fontWeight: 500 }}>{w.label}</span>
                    </div>
                    <span className="tnum" style={{ fontSize: 12, color: `var(--${tone})`, fontWeight: 600 }}>{w.time}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div style={{ display: 'grid', gap: 12, alignContent: 'start' }}>
            <div className="eyebrow">Panchangam · five limbs</div>
            {[['Vara','Tuesday','Mars lord'],['Tithi','Ekadasi','Shukla 11'],['Nakshatra','Hastham','Pada 1'],['Yoga','Siddhi','Yoga 16'],['Karana','Vanija','—']].map(([k, v, sub]) => (
              <div key={k} className="card-flat" style={{ padding: 14, display: 'grid', gridTemplateColumns: '88px 1fr', gap: 12, alignItems: 'center' }}>
                <div className="eyebrow">{k}</div>
                <div><div style={{ fontSize: 15, fontWeight: 500 }}>{v}</div><div style={{ fontSize: 11, color: 'var(--muted)' }}>{sub}</div></div>
              </div>
            ))}
            <div className="card" style={{ background: 'var(--accent-soft)', borderColor: 'transparent', padding: 16, marginTop: 4 }}>
              <div className="eyebrow" style={{ color: 'var(--accent)' }}>Today's significance</div>
              <div style={{ fontSize: 13.5, marginTop: 4, lineHeight: 1.55 }}>Ekadasi — sacred to Vishnu. Fasting brings merit. Offer tulasi at a Perumal temple.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 8. SETUP / SETTINGS
function TwilightSetup() {
  const t = useLang();
  return (
    <div className="frame theme-twilight" style={{ display: 'flex' }}>
      <Rail active="settings" />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <TopBar title="Setup" sub="Settings · onboarding" />
        <div style={{ padding: 24, flex: 1 }}>
          <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
            {[['1','Your chart',true],['2','Family vault',true],['3','Add member',true]].map(([n, k, done]) => (
              <div key={n} className="card-flat" style={{ flex: 1, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12,
                borderColor: done ? 'var(--sage)' : 'var(--border)' }}>
                <span style={{ width: 28, height: 28, borderRadius: 28, background: 'var(--sage)', color: '#1A1410',
                  display: 'grid', placeItems: 'center', fontSize: 13, fontWeight: 700 }}>✓</span>
                <div><div style={{ fontSize: 14, fontWeight: 500 }}>{k}</div><div style={{ fontSize: 11, color: 'var(--muted)' }}>Complete</div></div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div><span className="tag tag-sage">✓ Saved</span><div className="display" style={{ fontSize: 20, marginTop: 10 }}>Birth details</div></div>
                <button className="btn" style={{ padding: '7px 14px' }}>Edit</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {[['Name','Senthilkumar S.'],['Relationship','Self'],['Birth date','15 Mar 1993'],['Birth time','08:15 AM'],['Birth place','Tirupur, TN'],['Timezone','Asia / Kolkata']].map(([k, v]) => (
                  <div key={k}><div className="eyebrow">{k}</div><div style={{ fontSize: 14, marginTop: 2 }}>{v}</div></div>
                ))}
              </div>
            </div>
            <div className="card" style={{ padding: 24 }}>
              <span className="tag tag-sage">✓ Vault</span>
              <div className="display" style={{ fontSize: 20, margin: '10px 0 4px' }}>Senthils family</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 14 }}>2 members · Tamil + English</div>
              <div style={{ display: 'grid', gap: 10 }}>
                {[['Senthilkumar Sivaraman','Self · weight 1.00'],['Aadhinii Senthilkumar','Daughter · weight 0.75']].map(([n, r]) => (
                  <div key={n} className="card-flat" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ width: 28, height: 28, borderRadius: 28, background: 'var(--accent-soft)', color: 'var(--accent)', display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 700 }}>{n.charAt(0)}</span>
                      <div><div style={{ fontSize: 13.5, fontWeight: 500 }}>{n}</div><div style={{ fontSize: 11, color: 'var(--muted)' }}>{r}</div></div>
                    </div>
                    <span className="tag">Edit</span>
                  </div>
                ))}
              </div>
              <button className="btn btn-primary" style={{ marginTop: 14, width: '100%', justifyContent: 'center' }}>+ Add a member</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

window.Twilight2 = { TwilightLifeAreas, TwilightPredictions, TwilightFamily, TwilightCalendar, TwilightSetup };
