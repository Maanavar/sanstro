// tr-app.jsx — Vinaadi Tools Redesign: gallery, sidebar, app entry

const TOOLS = [
  {
    id: 'compatibility',
    abbr: 'CP',
    title: 'Porutham / Compatibility',
    short: 'Check compatibility between any two people',
    desc: 'Uses the traditional 8 Kuta matching system with 36-point scoring for marriage, friendship, business, and family compatibility.',
    iconBg: '#F7EDE5',
    iconColor: T.accent,
  },
  {
    id: 'chart',
    abbr: 'CH',
    title: 'Generate Chart',
    short: 'Create a printable birth chart for any person',
    desc: 'Generates D1 Rasi and D9 Navamsa charts using Thirukanitham calculation — Lahiri ayanamsa, whole-sign houses.',
    iconBg: '#E9F1E4',
    iconColor: T.sage,
  },
  {
    id: 'annual',
    abbr: 'AW',
    title: 'Annual Wrapped',
    short: 'Your year in review — astrological summary',
    desc: 'See key periods, dasha transitions, and Jyotish themes that shaped your year.',
    iconBg: '#E4EBF2',
    iconColor: T.info,
  },
  {
    id: 'retrospective',
    abbr: 'RT',
    title: 'Retrospective',
    short: 'Look back at past periods and life patterns',
    desc: 'Enter any past event to see its astrological correlation and discover future windows with similar signatures.',
    iconBg: '#F2ECDF',
    iconColor: '#7A5C2E',
  },
];

// ── TOOL GALLERY (default, nothing selected) ─────────────────────────────
function ToolGallery({ onSelect }) {
  const [hov, setHov] = React.useState(null);
  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, maxWidth:900 }}>
      {TOOLS.map(tool => {
        const isHov = hov === tool.id;
        return (
          <button
            key={tool.id}
            onClick={() => onSelect(tool.id)}
            onMouseEnter={() => setHov(tool.id)}
            onMouseLeave={() => setHov(null)}
            style={{
              display:'flex', alignItems:'flex-start', gap:20,
              padding:'28px 28px', background: isHov ? tool.iconBg : T.surface,
              border:`1px solid ${isHov ? T.border2 : T.border}`,
              borderRadius:16, cursor:'pointer', textAlign:'left',
              fontFamily:'Inter, sans-serif', transition:'all 0.18s ease',
              boxShadow: isHov ? '0 10px 28px rgba(0,0,0,0.06)' : 'none',
              transform: isHov ? 'translateY(-2px)' : 'none',
            }}
          >
            {/* Monogram circle */}
            <div style={{
              width:56, height:56, borderRadius:'50%', flexShrink:0,
              background: tool.iconBg,
              border:`1.5px solid ${tool.iconColor}33`,
              display:'flex', alignItems:'center', justifyContent:'center',
              fontFamily:'Fraunces, serif', fontSize:16, color:tool.iconColor,
              letterSpacing:'-0.01em',
            }}>{tool.abbr}</div>

            {/* Text */}
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontFamily:'Fraunces, serif', fontSize:19, color:T.ink, marginBottom:7, lineHeight:1.2, letterSpacing:'-0.01em' }}>{tool.title}</div>
              <div style={{ fontSize:13, color:T.muted, lineHeight:1.6, marginBottom:12 }}>{tool.desc}</div>
              <div style={{ fontSize:12, color:tool.iconColor, fontWeight:500, display:'flex', alignItems:'center', gap:5, opacity: isHov ? 1 : 0.7, transition:'opacity 0.15s' }}>
                Open tool
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke={tool.iconColor} strokeWidth="1.5" strokeLinecap="round">
                  <line x1="2" y1="6" x2="10" y2="6"/><polyline points="7,3 10,6 7,9"/>
                </svg>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ── TOOL SIDEBAR (when a tool is active) ─────────────────────────────────
function ToolSidebar({ activeTool, onSelect }) {
  const [hov, setHov] = React.useState(null);
  return (
    <aside style={{ width:256, flexShrink:0 }}>
      {TOOLS.map(tool => {
        const isActive = tool.id === activeTool;
        const isHov = hov === tool.id;
        return (
          <button
            key={tool.id}
            onClick={() => onSelect(tool.id)}
            onMouseEnter={() => setHov(tool.id)}
            onMouseLeave={() => setHov(null)}
            style={{
              display:'flex', alignItems:'center', gap:12,
              width:'100%', padding:'11px 12px',
              border:'none',
              borderRadius:10,
              background: isActive ? T.accentSoft : isHov ? T.surface2 : 'transparent',
              cursor:'pointer', textAlign:'left',
              fontFamily:'Inter, sans-serif', marginBottom:2,
              boxShadow: isActive ? `inset 3px 0 0 ${T.accent}` : 'none',
              transition:'all 0.15s',
            }}
          >
            <div style={{
              width:36, height:36, borderRadius:'50%', flexShrink:0,
              background: isActive ? T.accentSoft : T.bg2,
              border:`1.5px solid ${isActive ? T.accent : T.border}`,
              display:'flex', alignItems:'center', justifyContent:'center',
              fontFamily:'Fraunces, serif', fontSize:12,
              color: isActive ? T.accent : T.muted,
              transition:'all 0.15s',
            }}>{tool.abbr}</div>
            <div style={{ minWidth:0 }}>
              <div style={{ fontSize:13, fontWeight: isActive ? 600 : 400, color: isActive ? T.ink : T.ink2, marginBottom:1, transition:'color 0.15s' }}>{tool.title}</div>
              <div style={{ fontSize:11, color:T.muted2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{tool.short}</div>
            </div>
          </button>
        );
      })}
    </aside>
  );
}

// ── TOOL CONTENT HEADER ────────────────────────────────────────────────
function ToolHeader({ tool }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:28 }}>
      <div style={{ width:44, height:44, borderRadius:'50%', background:tool.iconBg, border:`1.5px solid ${tool.iconColor}33`, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Fraunces, serif', fontSize:14, color:tool.iconColor, flexShrink:0 }}>
        {tool.abbr}
      </div>
      <div>
        <h2 style={{ fontFamily:'Fraunces, serif', fontSize:24, fontWeight:400, color:T.ink, letterSpacing:'-0.02em', marginBottom:2 }}>{tool.title}</h2>
        <div style={{ fontSize:12, color:T.muted }}>{tool.short}</div>
      </div>
    </div>
  );
}

// ── MAIN APP ──────────────────────────────────────────────────────────────
const PANELS = {
  compatibility:  () => React.createElement(window.CompatibilityPanel),
  chart:          () => React.createElement(window.GenerateChartPanel),
  annual:         () => React.createElement(window.AnnualWrappedPanel),
  retrospective:  () => React.createElement(window.RetrospectivePanel),
};

function App() {
  const [activeTool, setActiveTool] = React.useState(null);
  const activeDef = TOOLS.find(t => t.id === activeTool);

  return (
    <div style={{ minHeight:'100vh', background:T.bg }}>
      <TopNav/>

      <main style={{ maxWidth:1280, margin:'0 auto', padding:'44px 40px 0' }}>
        {/* Page header */}
        <div style={{ marginBottom: activeTool ? 36 : 44 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div>
              <div style={{ fontSize:10, letterSpacing:'0.16em', textTransform:'uppercase', color:T.accent, fontWeight:700, marginBottom:10 }}>Tools</div>
              <h1 style={{ fontFamily:'Fraunces, serif', fontSize:42, fontWeight:400, letterSpacing:'-0.025em', color:T.ink, marginBottom:7, lineHeight:1 }}>
                Specialist Tools
              </h1>
              <p style={{ fontSize:14, color:T.muted }}>Deep-dive tools for specific astrology questions</p>
            </div>
            {activeTool && (
              <Btn ghost small onClick={() => setActiveTool(null)}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke={T.muted} strokeWidth="1.5" strokeLinecap="round">
                  <line x1="10" y1="6" x2="2" y2="6"/><polyline points="5,3 2,6 5,9"/>
                </svg>
                All tools
              </Btn>
            )}
          </div>
        </div>

        {activeTool ? (
          /* Two-column workspace */
          <div style={{ display:'flex', gap:0, alignItems:'flex-start' }}>
            <ToolSidebar activeTool={activeTool} onSelect={setActiveTool}/>

            {/* Divider */}
            <div style={{ width:1, background:T.border, alignSelf:'stretch', margin:'0 36px' }}/>

            {/* Tool content */}
            <div style={{ flex:1, minWidth:0, paddingBottom:80 }}>
              <ToolHeader tool={activeDef}/>
              {PANELS[activeTool]?.()}
            </div>
          </div>
        ) : (
          <div style={{ paddingBottom:80 }}>
            <ToolGallery onSelect={setActiveTool}/>
          </div>
        )}
      </main>

      <Footer/>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(App));
