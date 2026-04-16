import { useState, useEffect } from 'react';

const FIELDS = {
  webhook: [
    { key: 'method', label: 'Método HTTP', type: 'select', options: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], default: 'POST' },
  ],
  http: [
    { key: 'url',     label: 'URL',             type: 'text',     placeholder: 'https://api.exemplo.com/dados' },
    { key: 'method',  label: 'Método',           type: 'select',   options: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], default: 'GET' },
    { key: 'headers', label: 'Headers (JSON)',   type: 'textarea', placeholder: '{"Authorization": "Bearer token"}' },
    { key: 'body',    label: 'Body (JSON)',       type: 'textarea', placeholder: '{"key": "value"}' },
  ],
  code: [
    { key: 'code', label: 'Código JS', type: 'code', placeholder: 'return { ...input, campo: "valor" };', help: '`input` contém a saída do nó anterior.' },
  ],
  if: [
    { key: 'condition', label: 'Condição JS', type: 'text', placeholder: 'input.status === 200', help: 'Avalia como booleano. `input` = saída anterior.' },
  ],
  switch: [
    { key: 'value', label: 'Expressão de valor', type: 'text', placeholder: "input.tipo === 'A' ? 'caso1' : 'caso2'" },
    { key: 'cases', label: 'Cases (separados por vírgula)', type: 'text', placeholder: 'caso1, caso2, caso3', help: 'Cada value vira uma saída (handle) do nó.' },
  ],
  wait: [
    { key: 'ms', label: 'Duração (ms)', type: 'number', placeholder: '1000', default: 1000 },
  ],
};

export default function ConfigPanel({ node, onDataChange, onDelete }) {
  const [label, setLabel] = useState('');
  const [config, setConfig] = useState({});

  useEffect(() => {
    if (node) {
      setLabel(node.data.label);
      // Normalize cases array to comma-string for display
      const cfg = { ...node.data.config };
      if (Array.isArray(cfg.cases)) cfg.cases = cfg.cases.join(', ');
      setConfig(cfg);
    }
  }, [node?.id]);

  if (!node) {
    return (
      <aside className="w-64 bg-white border-l border-gray-200 flex items-center justify-center shrink-0">
        <p className="text-xs text-gray-400 text-center px-6 leading-relaxed">
          Selecione um nó no canvas para editar sua configuração
        </p>
      </aside>
    );
  }

  const fields = FIELDS[node.data.nodeType] || [];

  const handleApply = () => {
    const processed = { ...config };
    if (node.data.nodeType === 'switch' && typeof processed.cases === 'string') {
      processed.cases = processed.cases.split(',').map((s) => s.trim()).filter(Boolean);
    }
    if (node.data.nodeType === 'wait' && processed.ms !== undefined) {
      processed.ms = Number(processed.ms);
    }
    onDataChange(node.id, { label, nodeType: node.data.nodeType, config: processed });
  };

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') handleApply();
  };

  return (
    <aside className="w-64 bg-white border-l border-gray-200 flex flex-col overflow-y-auto shrink-0">
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Configurar nó</p>
        <button
          onClick={() => onDelete(node.id)}
          className="text-gray-300 hover:text-red-400 transition-colors text-sm leading-none"
          title="Deletar nó"
        >
          ✕
        </button>
      </div>

      <div className="p-4 flex flex-col gap-4 flex-1 overflow-y-auto" onKeyDown={handleKeyDown}>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Nome do nó</label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="w-full text-sm border border-gray-300 rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-violet-400"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1">ID do nó</label>
          <input
            type="text"
            value={node.id}
            readOnly
            className="w-full text-xs border border-gray-100 rounded-md px-2 py-1.5 bg-gray-50 text-gray-400 font-mono"
          />
        </div>

        {fields.map((field) => {
          const value = config[field.key] ?? field.default ?? '';
          return (
            <div key={field.key}>
              <label className="block text-xs font-medium text-gray-600 mb-1">{field.label}</label>
              {field.help && (
                <p className="text-[10px] text-gray-400 mb-1 leading-snug">{field.help}</p>
              )}

              {field.type === 'select' && (
                <select
                  value={value}
                  onChange={(e) => setConfig((c) => ({ ...c, [field.key]: e.target.value }))}
                  className="w-full text-sm border border-gray-300 rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white"
                >
                  {field.options.map((o) => <option key={o}>{o}</option>)}
                </select>
              )}

              {(field.type === 'text' || field.type === 'number') && (
                <input
                  type={field.type}
                  value={value}
                  placeholder={field.placeholder}
                  onChange={(e) => setConfig((c) => ({ ...c, [field.key]: e.target.value }))}
                  className="w-full text-sm border border-gray-300 rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-violet-400 font-mono"
                />
              )}

              {(field.type === 'textarea' || field.type === 'code') && (
                <textarea
                  value={value}
                  placeholder={field.placeholder}
                  rows={field.type === 'code' ? 7 : 3}
                  onChange={(e) => setConfig((c) => ({ ...c, [field.key]: e.target.value }))}
                  className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-violet-400 font-mono resize-y"
                />
              )}
            </div>
          );
        })}
      </div>

      <div className="p-4 border-t border-gray-200 shrink-0">
        <button
          onClick={handleApply}
          className="w-full bg-violet-600 text-white text-sm font-medium py-2 rounded-md hover:bg-violet-700 transition-colors"
        >
          Aplicar <span className="text-violet-300 text-xs ml-1">Ctrl+Enter</span>
        </button>
      </div>
    </aside>
  );
}
