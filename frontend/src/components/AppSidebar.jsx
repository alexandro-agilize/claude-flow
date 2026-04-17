const NAV = [
  { id: 'editor',      icon: '◫', label: 'Editor' },
  { id: 'flows',       icon: '⊞', label: 'Flows' },
  { id: 'executions',  icon: '◷', label: 'Execuções' },
  { id: 'credentials', icon: '⚿', label: 'Credenciais' },
  { id: 'variables',   icon: '$',  label: 'Variáveis' },
];

export default function AppSidebar({ page, onNavigate }) {
  return (
    <aside style={{ width: 56, background: '#1a1a24', borderRight: '1px solid #2d2d3e', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 0', flexShrink: 0, zIndex: 10 }}>
      <div style={{ width: 32, height: 32, borderRadius: 8, background: '#7c3aed22', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, color: '#a78bfa', fontSize: 16, flexShrink: 0 }}>
        ⚡
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, width: '100%', padding: '0 8px' }}>
        {NAV.map(({ id, icon, label }) => {
          const isActive = page === id;
          return (
            <button
              key={id} title={label} onClick={() => onNavigate(id)}
              style={{
                width: '100%', height: 40, borderRadius: 8, border: 'none',
                background: isActive ? '#7c3aed22' : 'transparent',
                color: isActive ? '#a78bfa' : '#4a4a6a',
                fontSize: 17, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.12s',
                borderLeft: isActive ? '2px solid #7c3aed' : '2px solid transparent',
              }}
              onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = '#ffffff08'; e.currentTarget.style.color = '#7a7a9a'; }}}
              onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#4a4a6a'; }}}
            >
              {icon}
            </button>
          );
        })}
      </div>
    </aside>
  );
}
