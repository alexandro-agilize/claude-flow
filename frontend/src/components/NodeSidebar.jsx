const CATEGORIES = [
  {
    label: 'Entrada',
    nodes: [
      { type: 'webhook', label: 'Webhook', icon: '⚡', color: '#10b981', desc: 'Ponto de entrada' },
    ],
  },
  {
    label: 'Requisições',
    nodes: [
      { type: 'http', label: 'HTTP', icon: '🌐', color: '#3b82f6', desc: 'Requisição HTTP' },
    ],
  },
  {
    label: 'Lógica',
    nodes: [
      { type: 'code',    label: 'Code',   icon: '{ }', color: '#8b5cf6', desc: 'Código JavaScript' },
      { type: 'if',      label: 'IF',     icon: '⑂',   color: '#f59e0b', desc: 'Condicional' },
      { type: 'switch',  label: 'Switch', icon: '⇄',   color: '#f97316', desc: 'Múltiplos caminhos' },
      { type: 'loop',    label: 'Loop',   icon: '↺',   color: '#6366f1', desc: 'Iterar sobre array' },
    ],
  },
  {
    label: 'Dados',
    nodes: [
      { type: 'transform',    label: 'Transform',  icon: '⟳', color: '#06b6d4', desc: 'Transformar dados' },
      { type: 'merge',        label: 'Merge',      icon: '⊕', color: '#14b8a6', desc: 'Combinar saídas' },
      { type: 'set-variable', label: 'Variável',   icon: '$', color: '#ec4899', desc: 'Salvar variável' },
    ],
  },
  {
    label: 'IA & Utilidades',
    nodes: [
      { type: 'claude', label: 'Claude AI', icon: '✦', color: '#a855f7', desc: 'Claude API' },
      { type: 'wait',   label: 'Wait',      icon: '⏱', color: '#64748b', desc: 'Aguardar (ms)' },
      { type: 'log',    label: 'Log',       icon: '◉', color: '#84cc16', desc: 'Registrar log' },
    ],
  },
  {
    label: 'Integrações',
    nodes: [
      { type: 'email',    label: 'Email',    icon: '✉', color: '#f43f5e', desc: 'Enviar email SMTP' },
      { type: 'slack',    label: 'Slack',    icon: '◈', color: '#4ade80', desc: 'Mensagem Slack' },
      { type: 'postgres', label: 'Postgres', icon: '🗄', color: '#38bdf8', desc: 'Query PostgreSQL' },
      { type: 'sub-flow', label: 'Sub-flow', icon: '⊞', color: '#fb923c', desc: 'Executar outro flow' },
    ],
  },
];

export default function NodeSidebar() {
  const onDragStart = (e, nodeType) => {
    e.dataTransfer.setData('application/reactflow', nodeType);
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <aside className="w-52 flex flex-col overflow-y-auto shrink-0"
      style={{ background: '#0f172a', borderRight: '1px solid #1e293b' }}>
      <div className="px-3 py-3" style={{ borderBottom: '1px solid #1e293b' }}>
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Nós</p>
      </div>

      <div className="flex flex-col gap-0.5 p-2 flex-1">
        {CATEGORIES.map(({ label, nodes }) => (
          <div key={label} className="mb-1">
            <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest px-1.5 py-1.5">
              {label}
            </p>
            {nodes.map(({ type, label: nLabel, icon, color, desc }) => (
              <div
                key={type}
                draggable
                onDragStart={(e) => onDragStart(e, type)}
                className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-grab active:cursor-grabbing transition-all mb-0.5"
                style={{ background: 'transparent' }}
                onMouseEnter={e => e.currentTarget.style.background = '#1e293b'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <span
                  className="text-sm w-5 text-center leading-none shrink-0 font-bold"
                  style={{ color }}
                >
                  {icon}
                </span>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-200 leading-tight">{nLabel}</div>
                  <div className="text-[10px] text-slate-500 truncate leading-tight">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="p-3" style={{ borderTop: '1px solid #1e293b' }}>
        <p className="text-[10px] text-slate-600 leading-tight">
          Arraste para o canvas
        </p>
      </div>
    </aside>
  );
}
