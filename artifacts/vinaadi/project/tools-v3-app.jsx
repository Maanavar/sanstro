// tools-v3-app.jsx

const V3_TOOLS = [
  {
    id:'compatibility', num:'01',
    title:'Porutham / Compatibility',
    tagline:'8 Kuta matching · 36-point score',
    desc:'Traditional 8 Kuta system to check compatibility between any two people — marriage, friendship, business, or family contexts.',
    specs:['8 Kutas','36-pt score','D1 charts','PDF export'],
    color:'var(--accent)', softBg:'var(--accent-soft)',
    icon: window.V3_ICONS.compatibility,
  },
  {
    id:'chart', num:'02',
    title:'Generate Chart',
    tagline:'D1 Rasi · D9 Navamsa · Print ready',
    desc:'Produces D1 Rasi and D9 Navamsa charts for any person using Thirukanitham — Lahiri ayanamsa, whole-sign houses, Vimshottari dasha.',
    specs:['D1 Rasi','D9 Navamsa','Print ready','Lahiri'],
    color:'var(--sage)', softBg:'var(--sage-soft)',
    icon: window.V3_ICONS.chart,
  },
  {
    id:'annual', num:'03',
    title:'Annual Wrapped',
    tagline:'Dasha map · Key transits · Year review',
    desc:'Your astrological year in review — key dasha transitions, planetary periods, and Jyotish themes that shaped a given year.',
    specs:['Year review','Dasha map','Transit summary'],
    color:'var(--info)', softBg:'var(--info-soft)',
    icon: window.V3_ICONS.annual,
  },
  {
    id:'retrospective', num:'04',
    title:'Retrospective',
    tagline:'Event lookup · Recurrence patterns',
    desc:'Enter any past event to reveal its astrological correlation — active dasha, key transits — and discover future windows with a similar signature.',
    specs:['Event lookup','Recurrence map','Dasha match'],
    color:'#9A7020', softBg:'#F5E9C0',
    icon: window.V3_ICONS.retrospective,
  },
];

const V3_PANELS = {
  compatibility:  () => React.createElement(window.V3CompatibilityPanel),
  chart:          () => React.createElement(window.V3GenerateChartPanel),
  annual:         () => React.createElement(window.V3AnnualWrappedPanel),
  retrospective:  () => React.createElement(window.V3RetrospectivePanel),
};

// ── TOOL CARD ─────────────────────────────────────────────────────────────
function ToolCard({ tool, onSelect }) {
  const [hov, setHov] = React.useState(false);
  const Icon = tool.icon;
  return (
    <div
      onClick={() => onSelect(tool.id)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background:'var(--surface)',
        border:`1px solid ${hov ? 'var(--border-2)' : 'var(--border)'}`,
        borderRadius:20, padding:'32px 32px 28px',
        cursor:'pointer', transition:'all 0.22s ease',
        transform: hov ? 'translateY(-3px)' : 'translateY(0)',
        boxShadow: hov ? '0 10px 40px rgba(26,22,18,0.08)' : '0 1px 4px rgba(26,22,18,0.03)',
        display:'flex', flexDirection:'column', minHeight:280,
      }}
    >
      {/* Icon row */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:24 }}>
        <div style={{
          width:54, height:54, borderRadius:16,
          background: tool.softBg,
          display:'flex', alignItems:'center', justifyContent:'center',
          color: tool.color,
          transition:'transform 0.22s',
          transform: hov ? 'scale(1.06)' : 'scale(1)',
          flexShrink:0,
        }}>
          <Icon/>
        </div>
        <span style={{
          fontSize:11, fontWeight:600, letterSpacing:'0.1em',
          color:'var(--muted-2)', background:'var(--bg-2)',
          padding:'4px 11px', borderRadius:999,
          fontFamily:'var(--font-mono)',
        }}>{tool.num}</span>
      </div>

      {/* Title + description */}
      <div style={{ flex:1, marginBottom:20 }}>
        <div style={{
          fontFamily:'var(--font-display)', fontSize:22, color:'var(--ink)',
          letterSpacing:'-0.02em', lineHeight:1.2, marginBottom:10,
          transition:'color 0.18s',
          ...(hov ? { color: tool.color } : {}),
        }}>
          {tool.title}
        </div>
        <div style={{ fontSize:13, color:'var(--muted)', lineHeight:1.7 }}>
          {tool.desc}
        </div>
      </div>

      {/* Feature chips */}
      <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:24 }}>
        {tool.specs.map(s => (
          <span key={s} style={{
            fontSize:11, padding:'4px 12px', borderRadius:999,
            background:'var(--bg-2)', color:'var(--muted)',
            border:'1px solid var(--border)', fontWeight:500,
          }}>{s}</span>
        ))}
      </div>

      {/* CTA footer */}
      <div style={{
        borderTop:'1px solid var(--border)', paddingTop:20,
        display:'flex', alignItems:'center', justifyContent:'space-between',
      }}>
        <span style={{
          fontSize:13, fontWeight:600,
          color: hov ? tool.color : 'var(--ink-2)',
          transition:'color 0.18s',
        }}>Open tool</span>
        <div style={{
          width:34, height:34, borderRadius:'50%',
          background: hov ? tool.softBg : 'transparent',
          border:`1px solid ${hov ? tool.color + '44' : 'var(--border)'}`,
          display:'flex', alignItems:'center', justifyContent:'center',
          color: hov ? tool.color : 'var(--muted-2)',
          fontSize:16, transition:'all 0.18s',
        }}>→</div>
      </div>
    </div>
  );
}

// ── GALLERY ────────────────────────────────────────────────────────────────
function V3Gallery({ onSelect }) {
  return (
    <div style={{ paddingBottom:80 }}>
      {/* Page header */}
      <div style={{ marginBottom:48 }}>
        <div style={{ fontSize:11, letterSpacing:'0.18em', textTransform:'uppercase', color:'var(--accent)', fontWeight:600, marginBottom:14 }}>
          Tools
        </div>
        <h1 style={{ fontFamily:'var(--font-display)', fontSize:48, fontWeight:400, letterSpacing:'-0.03em', color:'var(--ink)', lineHeight:1, margin:'0 0 14px' }}>
          Specialist Tools
        </h1>
        <p style={{ fontSize:14, color:'var(--muted)', lineHeight:1.65, maxWidth:540, margin:0 }}>
          Deep-dive tools for specific astrology questions — compatibility, chart generation, event analysis, and yearly reviews.
        </p>
      </div>

      {/* 2×2 card grid */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
        {V3_TOOLS.map(tool => (
          <ToolCard key={tool.id} tool={tool} onSelect={onSelect}/>
        ))}
      </div>
    </div>
  );
}

// ── BREADCRUMB ─────────────────────────────────────────────────────────────
function V3Breadcrumb({ tool, onBack }) {
  const [hov, setHov] = React.useState(false);
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:40 }}>
      <button
        onClick={() => onBack(null)}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          display:'inline-flex', alignItems:'center', gap:7,
          padding:'7px 16px', border:'1px solid var(--border)',
          borderRadius:999, fontSize:12,
          color: hov ? 'var(--ink)' : 'var(--muted)',
          background: hov ? 'var(--surface)' : 'transparent',
          cursor:'pointer', fontFamily:'inherit', transition:'all 0.15s',
        }}>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <line x1="9" y1="5" x2="1" y2="5"/>
          <polyline points="4,2 1,5 4,8"/>
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
function V3ToolPage({ activeTool, onBack }) {
  const tool = V3_TOOLS.find(t => t.id === activeTool);
  const Icon = tool.icon;
  return (
    <div style={{ paddingBottom:80 }}>
      <V3Breadcrumb tool={tool} onBack={onBack}/>

      {/* Tool header */}
      <div style={{ marginBottom:44, paddingBottom:36, borderBottom:'1px solid var(--border)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:20 }}>
          <div style={{
            width:60, height:60, borderRadius:18, flexShrink:0,
            background: tool.softBg,
            display:'flex', alignItems:'center', justifyContent:'center',
            color: tool.color,
          }}>
            <Icon/>
          </div>
          <div>
            <h2 style={{ fontFamily:'var(--font-display)', fontSize:36, fontWeight:400, color:'var(--ink)', letterSpacing:'-0.03em', lineHeight:1.1, margin:'0 0 8px' }}>
              {tool.title}
            </h2>
            <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
              <span style={{ fontSize:13, color:'var(--muted)' }}>{tool.tagline}</span>
              {tool.specs.map(s => (
                <span key={s} style={{
                  fontSize:11, padding:'3px 10px', borderRadius:999,
                  background:'var(--bg-2)', color:'var(--muted)',
                  border:'1px solid var(--border)', fontWeight:500,
                }}>{s}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Panel */}
      {V3_PANELS[activeTool]?.()}
    </div>
  );
}

// ── APP ─────────────────────────────────────────────────────────────────────
function V3App() {
  const [activeTool, setActiveTool] = React.useState(null);
  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', color:'var(--ink)' }}>
      <V3Nav/>
      <main style={{ maxWidth:1300, margin:'0 auto', padding:'56px 48px 0' }}>
        {activeTool
          ? <V3ToolPage activeTool={activeTool} onBack={setActiveTool}/>
          : <V3Gallery onSelect={setActiveTool}/>
        }
      </main>
      <V3Footer/>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(V3App));
