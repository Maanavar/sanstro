// CALENDAR · MONTHLY v2 — Revamped layout & grouping
// Design change: sidebar becomes tabbed (Events / Vratha / Muhurthams)
// All "Special Days This Month" content absorbed into sidebar — no more below-fold section
// Targets single-screen layout at 1280×860

function CalMonthlyToggle({ active }) {
  const opts = [
    ['panchangam', 'Panchangam'],
    ['personal',   'Personal'],
    ['family',     'Family'],
    ['monthly',    'Monthly'],
  ];
  return (
    <div style={{
      display: 'flex', gap: 4,
      background: 'var(--surface-2)', padding: 4,
      borderRadius: 999, border: '1px solid var(--border)',
    }}>
      {opts.map(([k, label]) => (
        <div key={k} style={{
          padding: '6px 15px', borderRadius: 999,
          fontSize: 12.5, fontWeight: 500, cursor: 'pointer',
          background: active === k ? 'var(--surface)' : 'transparent',
          color: active === k ? 'var(--ink)' : 'var(--muted)',
          boxShadow: active === k ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
        }}>{label}</div>
      ))}
    </div>
  );
}

function ClarityCalMonthly() {
  const [sideTab, setSideTab] = React.useState('events');

  const DOW = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  // June 2026 starts Monday → offset 1
  const OFFSET = 1;

  const CELLS = [
    {d:1,  tam:'Vaikasi 18', naks:'Kottai',         events:[]},
    {d:2,  tam:'Vaikasi 19', naks:'Moolam',          events:[], subam:true},
    {d:3,  tam:'Vaikasi 20', naks:'Pooradam',        events:[]},
    {d:4,  tam:'Vaikasi 21', naks:'Uthradam',        events:[{n:'Chathurthi',    type:'v'}], subam:true},
    {d:5,  tam:'Vaikasi 22', naks:'Thiruvonam',      events:[{n:'Onam',          type:'f'}], subam:true},
    {d:6,  tam:'Vaikasi 23', naks:'Thiruvonam',      events:[{n:'Onam · Thiruvonam', type:'f'},{n:'Thiruvonam',type:'v'}], subam:true},
    {d:7,  tam:'Vaikasi 24', naks:'Avittam',         events:[]},
    {d:8,  tam:'Vaikasi 25', naks:'Sadayam',         events:[{n:'Theipirai Ashtami', type:'v'}], today:true},
    {d:9,  tam:'Vaikasi 26', naks:'Poorattathi',     events:[]},
    {d:10, tam:'Vaikasi 27', naks:'Uthirattathi',    events:[], subam:true},
    {d:11, tam:'Vaikasi 28', naks:'Revathi',         events:[{n:'Parama Ekadashi',   type:'v'}], subam:true},
    {d:12, tam:'Vaikasi 29', naks:'Aswini',          events:[], subam:true},
    {d:13, tam:'Vaikasi 30', naks:'Bharani',         events:[{n:'Pradhosam',type:'v'},{n:'Sani Pradhosam',type:'v'}]},
    {d:14, tam:'Aani 1',     naks:'Mirugaseerisham', events:[{n:'Rohini Vratam',      type:'v'}], subam:true},
    {d:15, tam:'Aani 2',     naks:'Thiruvathirai',   events:[]},
    {d:16, tam:'Aani 3',     naks:'Punarpoosam',     events:[]},
    {d:17, tam:'Aani 4',     naks:'Poosam',          events:[{n:'Chathurthi',    type:'v'}], subam:true},
    {d:18, tam:'Aani 5',     naks:'Ayilyam',         events:[], subam:true},
    {d:19, tam:'Aani 5',     naks:'Magam',           events:[]},
    {d:20, tam:'Aani 6',     naks:'Pooram',          events:[{n:'Sashti',        type:'v'}], subam:true},
    {d:21, tam:'Aani 7',     naks:'Uthiram',         events:[]},
    {d:22, tam:'Aani 8',     naks:'Hastham',         events:[]},
    {d:23, tam:'Aani 9',     naks:'Chithirai',       events:[]},
    {d:24, tam:'Aani 10',    naks:'Swathi',          events:[], subam:true},
    {d:25, tam:'Aani 11',    naks:'Visakam',         events:[{n:'Nirjala Ekadashi',   type:'v'}], subam:true},
    {d:26, tam:'Aani 12',    naks:'Anusham',         events:[{n:'Muharram',      type:'f'}]},
    {d:27, tam:'Aani 13',    naks:'Kettai',          events:[{n:'Pradhosam',type:'v'},{n:'Sani Pradhosam',type:'v'}], subam:true},
    {d:28, tam:'Aani 14',    naks:'Moolam',          events:[]},
    {d:29, tam:'Aani 15',    naks:'Pooradam',        events:[], subam:true},
    {d:30, tam:'Aani 16',    naks:'Uthradam',        events:[]},
  ];

  // Build padded 7-col grid
  const grid = [...Array(OFFSET).fill(null), ...CELLS];
  while (grid.length % 7 !== 0) grid.push(null);
  const rows = [];
  for (let i = 0; i < grid.length; i += 7) rows.push(grid.slice(i, i + 7));

  const TC = { v: 'var(--accent)', f: 'var(--sage)', g: 'var(--info)' };

  // ── Sidebar data ────────────────────────────────────────────
  const EVENTS_LIST = [
    {d:4,  name:'Chathurthi',         type:'v'},
    {d:5,  name:'Onam / Thiruvonam',  type:'f'},
    {d:5,  name:'World Oceans Day',   type:'g'},
    {d:6,  name:'Onam / Thiruvonam',  type:'f'},
    {d:7,  name:'Theipirai Ashtami',  type:'v'},
    {d:8,  name:'Theipirai Ashtami',  type:'v'},
    {d:8,  name:'உலக பெரும்கடல் திணம்',type:'g'},
    {d:11, name:'Parama Ekadashi',    type:'v'},
    {d:13, name:'Pradhosam',          type:'v'},
    {d:13, name:'Sani Pradhosam',     type:'v'},
    {d:14, name:'Rohini Vratam',      type:'v'},
    {d:17, name:'Chathurthi',         type:'v'},
    {d:20, name:'Sashti',             type:'v'},
    {d:21, name:'சர்வதேஸ யோகா திணம்',type:'g'},
    {d:25, name:'Nirjala Ekadashi',   type:'v'},
    {d:26, name:'Muharram',           type:'f'},
    {d:27, name:'Pradhosam',          type:'v'},
    {d:27, name:'Sani Pradhosam',     type:'v'},
  ].sort((a, b) => a.d - b.d);

  const EVENT_TYPE_LABEL = { v:'Vratha', f:'Festival', g:'Global' };

  const VRATHA_LIST = [
    {name:'Chathurthi',        dates:[4, 18]},
    {name:'Onam / Thiruvonam', dates:[5, 6]},
    {name:'Theipirai Ashtami', dates:[8]},
    {name:'Parama Ekadashi',   dates:[11]},
    {name:'Pradhosam',         dates:[13, 27]},
    {name:'Sani Pradhosam',    dates:[13, 27]},
    {name:'Rohini Vratam',     dates:[14]},
    {name:'Sashti',            dates:[20]},
    {name:'Nirjala Ekadashi',  dates:[25]},
  ];

  const MUHURTHAM_GROUPS = [
    {
      title: 'Valarpirai Subamuhurtham',
      col: 'sage',
      count: 7,
      dates: [17, 18, 20, 24, 25, 27, 29],
    },
    {
      title: 'Theipirai Subamuhurtham',
      col: 'accent',
      count: 9,
      dates: [2, 4, 5, 6, 7, 10, 11, 12, 14],
    },
    {
      title: 'Strict Reckoning',
      col: 'info',
      count: 7,
      dates: [2, 6, 10, 11, 17, 25, 27],
    },
  ];

  // ── Tab helpers ─────────────────────────────────────────────
  const tabStyle = (k) => ({
    padding: '9px 11px 8px',
    fontSize: 12, fontWeight: 500, cursor: 'pointer',
    color: sideTab === k ? 'var(--ink)' : 'var(--muted)',
    borderBottom: sideTab === k ? '2px solid var(--ink)' : '2px solid transparent',
    marginBottom: -1,
    display: 'flex', alignItems: 'center', gap: 5,
    whiteSpace: 'nowrap', userSelect: 'none',
  });

  const CountBadge = ({ k, n }) => (
    <span style={{
      fontSize: 9.5, padding: '1px 5px', borderRadius: 999,
      fontWeight: 600, lineHeight: 1.5,
      background: sideTab === k ? 'var(--ink)' : 'var(--surface-2)',
      color: sideTab === k ? 'var(--bg)' : 'var(--muted)',
      border: sideTab === k ? 'none' : '1px solid var(--border)',
    }}>{n}</span>
  );

  const DatePill = ({ d, col = '' }) => (
    <span className={`tag${col ? ' tag-' + col : ''}`}
      style={{ fontSize: 11, padding: '3px 9px', fontVariantNumeric: 'tabular-nums' }}>
      {String(d).padStart(2, '0')} Jun
    </span>
  );

  // ── Render ──────────────────────────────────────────────────
  return (
    <div className="frame theme-clarity" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <ClarityChrome active="calendar" />

      {/* ── Page header ── */}
      <div style={{
        padding: '12px 32px 11px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
        borderBottom: '1px solid var(--border)', flexShrink: 0,
      }}>
        <div>
          <div className="eyebrow" style={{ color: 'var(--accent)', marginBottom: 3 }}>
            Transits &amp; Events
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <span className="display" style={{ fontSize: 28, letterSpacing: '-0.025em' }}>
              8 Jun 2026
            </span>
            <span className="tag tag-accent" style={{ fontSize: 12 }}>Vaigasi 25</span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
            Monday · Krishna 23 · Sadayam
          </div>
        </div>
        <CalMonthlyToggle active="monthly" />
      </div>

      {/* ── Body ── */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 296px', minHeight: 0 }}>

        {/* ─── Left: Calendar ─── */}
        <div style={{
          padding: '12px 16px 10px 32px',
          display: 'flex', flexDirection: 'column', gap: 8,
        }}>
          {/* Month nav */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <button style={{
              width: 28, height: 28, borderRadius: 8,
              border: '1px solid var(--border)', background: 'var(--surface)',
              cursor: 'pointer', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 16, color: 'var(--ink)',
            }}>‹</button>
            <div>
              <span className="display" style={{ fontSize: 17 }}>June 2026</span>
              <span style={{ fontSize: 11, color: 'var(--muted-2)', marginLeft: 8 }}>Vaikasi</span>
            </div>
            <button style={{
              width: 28, height: 28, borderRadius: 8,
              border: '1px solid var(--border)', background: 'var(--surface)',
              cursor: 'pointer', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 16, color: 'var(--ink)',
            }}>›</button>
          </div>

          {/* Weekday headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3, flexShrink: 0 }}>
            {DOW.map(d => (
              <div key={d} className="eyebrow"
                style={{ textAlign: 'center', padding: '4px 0', fontSize: 10, color: 'var(--muted)' }}>
                {d}
              </div>
            ))}
          </div>

          {/* Calendar rows */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3, minHeight: 0 }}>
            {rows.map((row, ri) => (
              <div key={ri} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3, flex: 1 }}>
                {row.map((cell, ci) => {
                  if (!cell) return <div key={ci} />;
                  const isTod = cell.today;
                  const isSub = cell.subam;
                  return (
                    <div key={ci} style={{
                      borderRadius: 9, padding: '7px 8px 5px',
                      background: isTod
                        ? 'var(--accent-soft)'
                        : isSub ? 'rgba(92,118,84,0.065)' : 'var(--surface-2)',
                      border: isTod
                        ? '1.5px solid var(--accent)'
                        : isSub ? '1px solid rgba(92,118,84,0.22)' : '1px solid var(--border)',
                      display: 'flex', flexDirection: 'column', gap: 1, overflow: 'hidden',
                    }}>
                      {/* Date number + subam dot */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <span className="display tnum" style={{
                          fontSize: 16, lineHeight: 1,
                          color: isTod ? 'var(--accent)' : 'var(--ink)',
                          fontWeight: isTod ? 600 : 400,
                        }}>{cell.d}</span>
                        {isSub && (
                          <span style={{
                            width: 5, height: 5, borderRadius: 5,
                            background: 'var(--sage)', marginTop: 2, flexShrink: 0,
                          }} />
                        )}
                      </div>
                      {/* Tamil month */}
                      <div className="mono" style={{ fontSize: 9, color: 'var(--muted-2)', lineHeight: 1.2, marginTop: 1 }}>
                        {cell.tam}
                      </div>
                      {/* Nakshatra */}
                      <div style={{ fontSize: 9, color: 'var(--muted)', lineHeight: 1.2 }}>
                        {cell.naks}
                      </div>
                      {/* Event rows */}
                      {cell.events.length > 0 && (
                        <div style={{ marginTop: 'auto', paddingTop: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
                          {cell.events.slice(0, 2).map((ev, j) => (
                            <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                              <span style={{
                                width: 4, height: 4, borderRadius: 4,
                                background: TC[ev.type], flexShrink: 0,
                              }} />
                              <span style={{
                                fontSize: 8.5, color: 'var(--ink-2)',
                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.2,
                              }}>{ev.n}</span>
                            </div>
                          ))}
                          {cell.events.length > 2 && (
                            <div style={{ fontSize: 8.5, color: 'var(--muted)', marginLeft: 7 }}>
                              +{cell.events.length - 2}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', gap: 16, paddingTop: 2, flexShrink: 0 }}>
            {[
              ['Vratha', 'var(--accent)'],
              ['Festival', 'var(--sage)'],
              ['Global day', 'var(--info)'],
              ['Subam day', 'var(--sage)'],
            ].map(([l, c]) => (
              <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10.5, color: 'var(--muted)' }}>
                <span style={{ width: 6, height: 6, borderRadius: 6, background: c, flexShrink: 0 }} />
                {l}
              </div>
            ))}
          </div>
        </div>

        {/* ─── Right: Sidebar ─── */}
        <div style={{
          borderLeft: '1px solid var(--border)',
          display: 'flex', flexDirection: 'column', minHeight: 0,
        }}>
          {/* Tab strip */}
          <div style={{
            padding: '0 14px',
            borderBottom: '1px solid var(--border)',
            display: 'flex', gap: 0, flexShrink: 0,
          }}>
            <div style={tabStyle('events')} onClick={() => setSideTab('events')}>
              Events <CountBadge k="events" n={18} />
            </div>
            <div style={tabStyle('vratha')} onClick={() => setSideTab('vratha')}>
              Vratha <CountBadge k="vratha" n={9} />
            </div>
            <div style={tabStyle('muhurthams')} onClick={() => setSideTab('muhurthams')}>
              Muhurthams <CountBadge k="muhurthams" n={23} />
            </div>
          </div>

          {/* Tab content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', minHeight: 0 }}>

            {/* ─ Events tab ─ */}
            {sideTab === 'events' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {/* Type legend */}
                <div style={{ display: 'flex', gap: 10, marginBottom: 6 }}>
                  {[['v','Vratha'],['f','Festival'],['g','Global']].map(([k,l]) => (
                    <div key={k} style={{ display:'flex', alignItems:'center', gap:5, fontSize:10.5, color:'var(--muted)' }}>
                      <span style={{ width:6, height:6, borderRadius:6, background:TC[k], flexShrink:0 }} />
                      {l}
                    </div>
                  ))}
                </div>
                {EVENTS_LIST.map((ev, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '7px 10px', borderRadius: 8,
                    background: 'var(--surface-2)', border: '1px solid var(--border)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 7, height: 7, borderRadius: 7, background: TC[ev.type], flexShrink: 0 }} />
                      <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink)' }}>{ev.name}</span>
                    </div>
                    <span className="mono" style={{ fontSize: 11, color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                      {String(ev.d).padStart(2, '0')} Jun
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* ─ Vratha tab ─ */}
            {sideTab === 'vratha' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                <p style={{ fontSize: 11.5, color: 'var(--muted)', margin: '0 0 6px', lineHeight: 1.5 }}>
                  Fasting and observance days this month.
                </p>
                {VRATHA_LIST.map((vr, i) => (
                  <div key={i} style={{
                    padding: '10px 12px', borderRadius: 10,
                    background: 'var(--surface-2)', border: '1px solid var(--border)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 7 }}>
                      <span style={{ width: 6, height: 6, borderRadius: 6, background: 'var(--accent)', flexShrink: 0 }} />
                      <span style={{ fontSize: 12.5, fontWeight: 500 }}>{vr.name}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                      {vr.dates.map(d => <DatePill key={d} d={d} />)}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ─ Muhurthams tab ─ */}
            {sideTab === 'muhurthams' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <p style={{ fontSize: 11.5, color: 'var(--muted)', margin: '0 0 2px', lineHeight: 1.5 }}>
                  Auspicious windows for ceremonies and important decisions.
                </p>
                {MUHURTHAM_GROUPS.map((g, i) => (
                  <div key={i}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div className="eyebrow">{g.title}</div>
                      <span className={`tag tag-${g.col}`} style={{ fontSize: 10, padding: '2px 7px' }}>
                        {g.count}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                      {g.dates.map(d => <DatePill key={d} d={d} col={g.col} />)}
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}

window.ClarityCalMonthly = ClarityCalMonthly;
