const NODE_TYPES = [
  { type: 'webhook', label: 'Webhook', icon: '⚡', color: 'bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100', desc: 'Ponto de entrada' },
  { type: 'http',    label: 'HTTP',    icon: '🌐', color: 'bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100',           desc: 'Requisição HTTP' },
  { type: 'code',    label: 'Code',    icon: '{ }',color: 'bg-violet-50 border-violet-300 text-violet-700 hover:bg-violet-100',   desc: 'Código JS' },
  { type: 'if',      label: 'IF',      icon: '?',  color: 'bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100',       desc: 'Condicional' },
  { type: 'switch',  label: 'Switch',  icon: '⇄',  color: 'bg-yellow-50 border-yellow-300 text-yellow-700 hover:bg-yellow-100',  desc: 'Múltiplos caminhos' },
  { type: 'wait',    label: 'Wait',    icon: '⏱', color: 'bg-slate-50 border-slate-300 text-slate-600 hover:bg-slate-100',       desc: 'Aguardar (ms)' },
];

export default function NodeSidebar() {
  const onDragStart = (e, nodeType) => {
    e.dataTransfer.setData('application/reactflow', nodeType);
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <aside className="w-48 bg-white border-r border-gray-200 flex flex-col overflow-y-auto shrink-0">
      <div className="px-3 py-3 border-b border-gray-200">
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Tipos de nó</p>
      </div>

      <div className="p-2 flex flex-col gap-1.5">
        {NODE_TYPES.map(({ type, label, icon, color, desc }) => (
          <div
            key={type}
            draggable
            onDragStart={(e) => onDragStart(e, type)}
            className={`flex items-center gap-2.5 px-2.5 py-2 border rounded-lg cursor-grab active:cursor-grabbing transition-all ${color}`}
          >
            <span className="text-base leading-none w-5 text-center shrink-0">{icon}</span>
            <div className="min-w-0">
              <div className="text-xs font-semibold leading-tight">{label}</div>
              <div className="text-[10px] opacity-70 truncate leading-tight">{desc}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-auto p-3 border-t border-gray-100">
        <p className="text-[10px] text-gray-400 leading-tight">
          Arraste para o canvas<br />ou clique duplo para adicionar
        </p>
      </div>
    </aside>
  );
}
