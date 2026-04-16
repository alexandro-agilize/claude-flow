import { useState } from 'react';

export default function RunModal({ isOpen, onClose, onRun, isRunning, result }) {
  const [input, setInput] = useState('{}');
  const [jsonError, setJsonError] = useState('');

  const handleRun = () => {
    try {
      const parsed = JSON.parse(input);
      setJsonError('');
      onRun(parsed);
    } catch {
      setJsonError('JSON inválido — corrija antes de executar.');
    }
  };

  const handleClose = () => {
    setJsonError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-800">Executar Flow</h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
        </div>

        <div className="p-6 flex flex-col gap-4">
          {!result ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Input (JSON)
              </label>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                rows={6}
                className="w-full font-mono text-sm border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none"
                placeholder="{}"
                disabled={isRunning}
              />
              {jsonError && <p className="text-xs text-red-500 mt-1">{jsonError}</p>}
            </div>
          ) : (
            <div>
              <div className={`flex items-center gap-2 mb-3 text-sm font-medium ${result.success ? 'text-green-600' : 'text-red-600'}`}>
                {result.success ? '✓ Executado com sucesso' : '✗ Erro na execução'}
              </div>
              <pre className="bg-gray-900 text-green-300 text-xs rounded-lg p-4 overflow-auto max-h-72 font-mono whitespace-pre-wrap">
                {JSON.stringify(result.success ? result.result : result.error, null, 2)}
              </pre>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200">
          {result ? (
            <>
              <button
                onClick={() => { onClose(); }}
                className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm font-medium transition-colors"
              >
                Fechar
              </button>
              <button
                onClick={handleClose}
                className="px-4 py-2 rounded-lg bg-violet-100 hover:bg-violet-200 text-violet-700 text-sm font-medium transition-colors"
              >
                Nova execução
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleClose}
                className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleRun}
                disabled={isRunning}
                className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isRunning && (
                  <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                {isRunning ? 'Executando…' : '▶ Executar'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
