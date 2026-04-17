export default function Toolbar({ flows, currentFlowId, flowName, onFlowNameChange, onSelectFlow, onNewFlow, onSave, onRun, isSaving, isRunning }) {
  return (
    <header className="h-12 flex items-center gap-3 px-4 shrink-0"
      style={{ background: '#020617', borderBottom: '1px solid #1e293b' }}>

      <div className="flex items-center gap-1.5 shrink-0">
        <span className="text-base leading-none" style={{ color: '#8b5cf6' }}>⚡</span>
        <span className="text-sm font-bold text-slate-100 tracking-tight">claude-flow</span>
      </div>

      <div className="w-px h-5 shrink-0" style={{ background: '#1e293b' }} />

      <select
        value={currentFlowId || ''}
        onChange={(e) => e.target.value && onSelectFlow(e.target.value)}
        className="text-xs rounded-md px-2 py-1.5 h-7 max-w-[160px] focus:outline-none focus:ring-1 cursor-pointer"
        style={{ background: '#0f172a', border: '1px solid #334155', color: '#94a3b8' }}
      >
        <option value="">— Abrir flow —</option>
        {flows.map((f) => (
          <option key={f.id} value={f.id}>{f.name || f.id}</option>
        ))}
      </select>

      <input
        type="text"
        value={flowName}
        onChange={(e) => onFlowNameChange(e.target.value)}
        placeholder="Nome do flow"
        className="text-xs rounded-md px-2 py-1.5 h-7 w-40 focus:outline-none focus:ring-1 focus:ring-violet-500"
        style={{ background: '#0f172a', border: '1px solid #334155', color: '#e2e8f0' }}
      />

      <div className="ml-auto flex items-center gap-2">
        <button
          onClick={onNewFlow}
          className="text-xs px-3 py-1 h-7 rounded-md font-medium transition-colors"
          style={{ background: 'transparent', border: '1px solid #334155', color: '#64748b' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#475569'; e.currentTarget.style.color = '#94a3b8'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#334155'; e.currentTarget.style.color = '#64748b'; }}
        >
          + Novo
        </button>

        <button
          onClick={onSave}
          disabled={isSaving}
          className="text-xs px-3 py-1 h-7 rounded-md font-medium transition-colors disabled:opacity-50"
          style={{ background: '#1e293b', border: '1px solid #334155', color: '#94a3b8' }}
          onMouseEnter={e => !isSaving && (e.currentTarget.style.background = '#334155')}
          onMouseLeave={e => (e.currentTarget.style.background = '#1e293b')}
        >
          {isSaving ? 'Salvando…' : '↓ Salvar'}
        </button>

        <button
          onClick={onRun}
          disabled={isRunning || !currentFlowId}
          title={!currentFlowId ? 'Salve o flow antes de executar' : ''}
          className="text-xs px-4 py-1 h-7 rounded-md font-semibold text-white transition-colors disabled:opacity-40"
          style={{ background: currentFlowId ? '#7c3aed' : '#334155' }}
          onMouseEnter={e => currentFlowId && !isRunning && (e.currentTarget.style.background = '#6d28d9')}
          onMouseLeave={e => (e.currentTarget.style.background = currentFlowId ? '#7c3aed' : '#334155')}
        >
          {isRunning ? '⏳ Executando…' : '▶ Executar'}
        </button>
      </div>
    </header>
  );
}
