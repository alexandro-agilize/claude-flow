export default function Toolbar({
  flows,
  currentFlowId,
  flowName,
  onFlowNameChange,
  onSelectFlow,
  onNewFlow,
  onSave,
  onRun,
  isSaving,
  isRunning,
}) {
  return (
    <header className="h-14 bg-gray-900 text-white flex items-center gap-3 px-4 shrink-0 border-b border-gray-800">
      {/* Brand */}
      <div className="flex items-center gap-2 mr-1">
        <span className="text-violet-400 text-lg font-bold leading-none">⚡</span>
        <span className="text-sm font-bold">claude-flow</span>
      </div>

      <div className="w-px h-6 bg-gray-700 mx-1" />

      {/* Flow selector */}
      <select
        value={currentFlowId || ''}
        onChange={(e) => e.target.value && onSelectFlow(e.target.value)}
        className="bg-gray-800 text-white text-sm border border-gray-700 rounded-md px-2 py-1 h-8 max-w-[180px] focus:outline-none focus:ring-1 focus:ring-violet-500 cursor-pointer"
      >
        <option value="">— Abrir flow —</option>
        {flows.map((f) => (
          <option key={f.id} value={f.id}>{f.name || f.id}</option>
        ))}
      </select>

      {/* Flow name */}
      <input
        type="text"
        value={flowName}
        onChange={(e) => onFlowNameChange(e.target.value)}
        placeholder="Nome do flow"
        className="bg-gray-800 text-white text-sm border border-gray-700 rounded-md px-2 py-1 h-8 w-48 focus:outline-none focus:ring-1 focus:ring-violet-500"
      />

      {/* Actions */}
      <div className="ml-auto flex items-center gap-2">
        <button
          onClick={onNewFlow}
          className="text-sm px-3 py-1 h-8 rounded-md border border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
        >
          + Novo
        </button>

        <button
          onClick={onSave}
          disabled={isSaving}
          className="text-sm px-3 py-1 h-8 rounded-md bg-gray-700 text-gray-200 hover:bg-gray-600 transition-colors disabled:opacity-50"
        >
          {isSaving ? 'Salvando…' : '💾 Salvar'}
        </button>

        <button
          onClick={onRun}
          disabled={isRunning || !currentFlowId}
          className="text-sm px-4 py-1 h-8 rounded-md bg-violet-600 text-white hover:bg-violet-500 transition-colors disabled:opacity-50 font-medium"
          title={!currentFlowId ? 'Salve o flow antes de executar' : ''}
        >
          {isRunning ? '⏳ Executando…' : '▶ Executar'}
        </button>
      </div>
    </header>
  );
}
