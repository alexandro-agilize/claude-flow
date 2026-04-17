import { useState, useEffect } from 'react';
import { listCredentials } from '../api';
import { FIELDS, CRED_NODES } from '../constants/nodeFields';

const inputClass = `
  w-full text-xs border rounded-md px-2.5 py-2 font-mono
  focus:outline-none focus:ring-1 focus:ring-violet-500
  transition-colors resize-y
`.trim();

const inputStyle = {
  background: '#0f172a',
  border: '1px solid #334155',
  color: '#e2e8f0',
};

function InputFieldChip({ path }) {
  const [copied, setCopied] = useState(false);
  const ref = `{{input.${path}}}`;
  const copy = () => {
    navigator.clipboard.writeText(ref).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };
  return (
    <button
      onClick={copy}
      title={`Copiar ${ref}`}
      style={{
        fontSize: 9, padding: '1px 5px', borderRadius: 3,
        background: copied ? '#10b98112' : '#0a0a18',
        border: `1px solid ${copied ? '#10b981' : '#1e293b'}`,
        color: copied ? '#10b981' : '#38bdf8',
        cursor: 'pointer', fontFamily: 'monospace',
        transition: 'all 0.12s',
      }}
    >
      {copied ? '✓' : path}
    </button>
  );
}

export default function ConfigPanel({ node, nodeInput, onDataChange, onDelete }) {
  const [label, setLabel] = useState('');
  const [config, setConfig] = useState({});
  const [credentials, setCredentials] = useState([]);

  useEffect(() => {
    if (node) {
      setLabel(node.data.label);
      const cfg = { ...node.data.config };
      if (Array.isArray(cfg.cases)) cfg.cases = cfg.cases.join(', ');
      setConfig(cfg);
    }
  }, [node?.id]);

  useEffect(() => {
    if (node && CRED_NODES[node.data.nodeType]) {
      listCredentials().then(r => setCredentials(r.data)).catch(() => {});
    }
  }, [node?.data?.nodeType]);

  if (!node) {
    return (
      <aside className="w-64 flex items-center justify-center shrink-0"
        style={{ background: '#0f172a', borderLeft: '1px solid #1e293b' }}>
        <div className="text-center px-6">
          <div className="text-2xl mb-2 opacity-20">⚙</div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Clique em um nó para editar
          </p>
        </div>
      </aside>
    );
  }

  const fields = FIELDS[node.data.nodeType] || [];

  const handleApply = () => {
    const processed = { ...config };
    if (node.data.nodeType === 'switch' && typeof processed.cases === 'string') {
      processed.cases = processed.cases.split(',').map((s) => s.trim()).filter(Boolean);
    }
    if (['wait', 'claude'].includes(node.data.nodeType) && processed.ms !== undefined) {
      processed.ms = Number(processed.ms);
    }
    if (node.data.nodeType === 'claude' && processed.maxTokens !== undefined) {
      processed.maxTokens = Number(processed.maxTokens);
    }
    onDataChange(node.id, { label, nodeType: node.data.nodeType, config: processed });
  };

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') handleApply();
  };

  return (
    <aside className="w-64 flex flex-col overflow-hidden shrink-0"
      style={{ background: '#0f172a', borderLeft: '1px solid #1e293b' }}>
      <div className="px-4 py-3 flex items-center justify-between shrink-0"
        style={{ borderBottom: '1px solid #1e293b' }}>
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Configurar nó</p>
        <button
          onClick={() => onDelete(node.id)}
          className="text-slate-600 hover:text-red-400 transition-colors text-xs leading-none px-1"
          title="Deletar nó"
        >
          ✕
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3" onKeyDown={handleKeyDown}>
        {/* Available input fields */}
        {nodeInput && Object.keys(nodeInput).length > 0 && (
          <div style={{ background: '#0a0a18', border: '1px solid #1e293b', borderRadius: 6, padding: '7px 9px' }}>
            <p className="text-[9px] font-bold uppercase tracking-wider mb-1.5" style={{ color: '#1e40af' }}>← campos do input</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
              {Object.keys(nodeInput).map(k => <InputFieldChip key={k} path={k} />)}
            </div>
          </div>
        )}

        <div>
          <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Nome</label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className={inputClass}
            style={inputStyle}
          />
        </div>

        {fields.map((field) => {
          const value = config[field.key] ?? field.default ?? '';
          return (
            <div key={field.key}>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                {field.label}
              </label>
              {field.help && (
                <p className="text-[10px] text-slate-600 mb-1.5 leading-snug">{field.help}</p>
              )}

              {field.type === 'credential' && (
                <select
                  value={value}
                  onChange={(e) => setConfig((c) => ({ ...c, [field.key]: e.target.value }))}
                  className={inputClass}
                  style={{ ...inputStyle, cursor: 'pointer' }}
                >
                  <option value="">— usar variáveis de ambiente —</option>
                  {credentials
                    .filter(c => c.type === field.credType)
                    .map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              )}

              {field.type === 'select' && (
                <select
                  value={value}
                  onChange={(e) => setConfig((c) => ({ ...c, [field.key]: e.target.value }))}
                  className={inputClass}
                  style={{ ...inputStyle, cursor: 'pointer' }}
                >
                  {field.options.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              )}

              {(field.type === 'text' || field.type === 'number') && (
                <input
                  type={field.type}
                  value={value}
                  placeholder={field.placeholder}
                  onChange={(e) => setConfig((c) => ({ ...c, [field.key]: e.target.value }))}
                  className={inputClass}
                  style={inputStyle}
                />
              )}

              {(field.type === 'textarea' || field.type === 'code') && (
                <textarea
                  value={value}
                  placeholder={field.placeholder}
                  rows={field.type === 'code' ? 7 : 3}
                  onChange={(e) => setConfig((c) => ({ ...c, [field.key]: e.target.value }))}
                  className={inputClass}
                  style={inputStyle}
                />
              )}
            </div>
          );
        })}
      </div>

      <div className="p-3 shrink-0" style={{ borderTop: '1px solid #1e293b' }}>
        <button
          onClick={handleApply}
          className="w-full text-white text-xs font-semibold py-2 rounded-lg transition-colors"
          style={{ background: '#7c3aed' }}
          onMouseEnter={e => e.currentTarget.style.background = '#6d28d9'}
          onMouseLeave={e => e.currentTarget.style.background = '#7c3aed'}
        >
          Aplicar <span className="text-purple-300 ml-1 font-normal">Ctrl+Enter</span>
        </button>
      </div>
    </aside>
  );
}
