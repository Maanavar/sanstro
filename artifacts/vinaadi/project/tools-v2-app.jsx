// tools-v2-app.jsx — v3 rewrite: editorial gallery, breadcrumb nav, no sidebar

const V2_TOOLS = [
  {
    id:'compatibility', num:'01', abbr:'CP',
    title:'Porutham / Compatibility',
    tagline:'8 Kuta matching · 36-point score',
    desc:'Traditional 8 Kuta matching system to check compatibility between any two people — for marriage, friendship, business, or family contexts.',
    specs:['8 Kutas','36-point score','D1 charts'],
    color:'var(--accent)', softBg:'var(--accent-soft)',
  },
  {
    id:'chart', num:'02', abbr:'CH',
    title:'Generate Chart',
    tagline:'D1 Rasi · D9 Navamsa · Print ready',
    desc:'Produces D1 Rasi and D9 Navamsa charts for any person using Thirukanitham — Lahiri ayanamsa, whole-sign houses, Vimshottari dasha.',
    specs:['D1 Rasi','D9 Navamsa','Print ready'],
    color:'var(--sage)', softBg:'var(--sage-soft)',
  },
  {
    id:'annual', num:'03', abbr:'AW',
    title:'Annual Wrapped',
    tagline:'Dasha map · Key transits · Year review',
    desc:'Your astrological year in review — key dasha transitions, planetary periods, and Jyotish themes that shaped a given year.',
    specs:['Year review','Dasha map','Transits'],
    color:'var(--info)', softBg:'var(--info-soft)',
  },
  {
    id:'retrospective', num:'04', abbr:'RT',
    title:'Retrospective',
    tagline:'Event lookup · Recurrence patterns',
    desc:'Enter any past event to reveal its astrological correlation — dasha, transits — and discover future windows with a similar signature.',
    specs:['Event lookup','Recurrence map','Dasha match'],
    color:'#9A7020', softBg:'#F5E9C0',
  },
];

const V2_PANELS = {
  compatibility:  () => React.createElement(window.V2CompatibilityPanel),
  chart:          () => React.createElement(window.V2GenerateChartPanel),
  annual:         () => React.createElement(window.V2AnnualWrappedPanel),
  retrospective:  () => React.createElement(window.V2RetrospectivePanel),
};

// ── GALLERY ROW ────────────────────────────────────────────────────────────
function GalleryRow({ tool, onSelect, isLast }) {
  const [hov, setHov] = React.useState(false);
  return (
    <div
      onClick={() => onSelect(tool.id)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display:'grid', gridTemplateColumns:'80px 1fr auto',
        alignItems:'center', gap:32,
        padding:'32px 0',
        borderBottom: isLast ? 'none' : '1px solid var(--border)',
        cursor:'pointer',
        transition:'all 0.18s ease',
      }}
    >
      {/* Big faint row number */}
      <div style={{
        fontFamily:'var(--font-display)', fontSize:64,
        lineHeight:1, color: hov ? tool.color : 'var(--border-2)',
        letterSpacing:'-0.04em', userSelect:'none',
        transition:'color 0.2s',
      }}>{tool.num}</div>

      {/* Text body */}
      <div style={{ display:'flex', flexDirection:'column', gap:8, transition:'transform 0.18s', transform: hov ? 'translateX(6px)' : 'translateX(0)' }}>
        <div style={{ display:'flex', alignItems:'baseline', gap:14, flexWrap:'wrap' }}>
          <div style={{ fontFamily:'var(--font-display)', fontSize:28, color:'var(--ink)', letterSpacing:'-0.025em', lineHeight:1.15 }}>
            {tool.title}
          </div>
          <div style={{ fontSize:12, color:'var(--muted)', fontStyle:'italic', letterSpacing:'0.01em' }}>
            {tool.tagline}
          </div>
        </div>
        <div style={{ fontSize:14, color:'var(--muted)', lineHeight:1.6, maxWidth:640 }}>
          {tool.desc}
        </div>
      </div>

      {/* Right: arrow circle */}
      <div style={{
        width:44, height:44, borderRadius:'50%', flexShrink:0,
        border:`1px solid ${hov ? tool.color : 'var(--border)'}`,
        background: hov ? tool.softBg : 'transparent',
        display:'flex', alignItems:'center', justifyContent:'center',
        fontSize:18, color: hov ? tool.color : 'var(--muted-2)',
        transition:'all 0.18s',
      }}>→</div>
    </div>
  );
}

// ── GALLERY PAGE ────────────────────────────────────────────────────────────
function V2Gallery({ onSelect }) {
  return (
    <div style={{ paddingBottom:80 }}>
      {/* Generous page header */}
      <div style={{ paddingBottom:16, borderBottom:'1px solid var(--border)' }}>
        <div style={{ fontSize:10, letterSpacing:'0.18em', textTransform:'uppercase', color:'var(--accent)', fontWeight:700, marginBottom:18 }}>Tools</div>
        <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between' }}>
          <h1 style={{ fontFamily:'var(--font-display)', fontSize:72, fontWeight:400, letterSpacing:'-0.035em', color:'var(--ink)', lineHeight:0.95, margin:0 }}>
            Specialist<br/><em style={{ color:'var(--muted)', fontStyle:'normal' }}>Tools</em>
          </h1>
          <p style={{ fontSize:14, color:'var(--muted)', maxWidth:320, lineHeight:1.65, textAlign:'right', paddingBottom:8 }}>
            Deep-dive tools for specific astrology questions — compatibility, chart generation, event analysis, and yearly reviews.
          </p>
        </div>
      </div>

      {/* Tool rows */}
      {V2_TOOLS.map((tool, i) => (
        <GalleryRow key={tool.id} tool={tool} onSelect={onSelect} isLast={i === V2_TOOLS.length - 1}/>
      ))}
    </div>
  );
}

// ── BREADCRUMB ─────────────────────────────────────────────────────────────
function V2Breadcrumb({ tool, onBack }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:40 }}>
      <button onClick={() => onBack(null)} style={{
        display:'inline-flex', alignItems:'center', gap:7,
        padding:'7px 16px', border:'1px solid var(--border)',
        borderRadius:999, fontSize:12, color:'var(--muted)',
        background:'transparent', cursor:'pointer', fontFamily:'inherit',
        transition:'all 0.15s',
      }}>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="var(--muted)" strokeWidth="1.5" strokeLinecap="round">
          <line x1="9" y1="5" x2="1" y2="5"/><polyline points="4,2 1,5 4,8"/>
        </svg>
        Tools
      </button>
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="var(--border-2)" strokeWidth="1.2">
        <polyline points="4,2 8,6 4,10"/>
      </svg>
      <span style={{ fontSize:13, color:'var(--ink-2)', fontWeight:500 }}>{tool.title}</span>
    </div>
  );
}

// ── TOOL PAGE ───────────────────────────────────────────────────────────────
function V2ToolPage({ activeTool, onBack }) {
  const tool = V2_TOOLS.find(t => t.id === activeTool);
  return (
    <div style={{ paddingBottom:80 }}>
      <V2Breadcrumb tool={tool} onBack={onBack}/>

      {/* Tool header */}
      <div style={{ marginBottom:40, paddingBottom:32, borderBottom:'1px solid var(--border)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:16 }}>
          <div style={{
            width:52, height:52, borderRadius:'50%', flexShrink:0,
            background:tool.softBg, border:`1.5px solid ${tool.color}44`,
            display:'flex', alignItems:'center', justifyContent:'center',
            fontFamily:'var(--font-display)', fontSize:16, color:tool.color,
          }}>{tool.abbr}</div>
          <div>
            <h2 style={{ fontFamily:'var(--font-display)', fontSize:36, fontWeight:400, color:'var(--ink)', letterSpacing:'-0.03em', lineHeight:1.1, marginBottom:5 }}>
              {tool.title}
            </h2>
            <div style={{ fontSize:13, color:'var(--muted)', lineHeight:1.5 }}>
              {tool.tagline} &nbsp;·&nbsp; {tool.desc.split('—')[0].trim()}
            </div>
          </div>
        </div>
      </div>

      {/* Panel */}
      {V2_PANELS[activeTool]?.()}
    </div>
  );
}

// ── APP ─────────────────────────────────────────────────────────────────────
function V2App() {
  const [activeTool, setActiveTool] = React.useState(null);
  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', color:'var(--ink)' }}>
      <V2Nav/>
      <main style={{ maxWidth:1300, margin:'0 auto', padding:'56px 48px 0' }}>
        {activeTool
          ? <V2ToolPage activeTool={activeTool} onBack={setActiveTool}/>
          : <V2Gallery onSelect={setActiveTool}/>
        }
      </main>
      <V2Footer/>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(V2App));
