import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FIELDS, CRED_NODES } from '../constants/nodeFields';
import { listCredentials } from '../api';

const NODE_META = {
  webhook:        { color: '#10b981', icon: '⚡', label: 'Webhook' },
  http:           { color: '#3b82f6', icon: '🌐', label: 'HTTP' },
  code:           { color: '#8b5cf6', icon: '{ }', label: 'Code' },
  if:             { color: '#f59e0b', icon: '⑂',  label: 'IF' },
  switch:         { color: '#f97316', icon: '⇄',  label: 'Switch' },
  wait:           { color: '#64748b', icon: '⏱',  label: 'Wait' },
  claude:         { color: '#a855f7', icon: '✦',  label: 'Claude AI' },
  transform:      { color: '#06b6d4', icon: '⟳',  label: 'Transform' },
  merge:          { color: '#14b8a6', icon: '⊕',  label: 'Merge' },
  loop:           { color: '#6366f1', icon: '↺',  label: 'Loop' },
  'set-variable': { color: '#ec4899', icon: '$',  label: 'Variável' },
  log:            { color: '#84cc16', icon: '◉',  label: 'Log' },
  email:          { color: '#f43f5e', icon: '✉',  label: 'Email' },
  slack:          { color: '#4ade80', icon: '◈',  label: 'Slack' },
  postgres:       { color: '#38bdf8', icon: '🗄',  label: 'Postgres' },
  'sub-flow':     { color: '#fb923c', icon: '⊞',  label: 'Sub-flow' },
};

function syntaxHighlightJson(data) {
  if (data === null || data === undefined) return 'null';
  const str = JSON.stringify(data, null, 2);
  const escaped = str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return escaped.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
    (match) => {
      let color = '#fdba74';
      if (/^"/.test(match)) {
        color = /:$/.test(match) ? '#93c5fd' : '#86efac';
      } else if (/true|false/.test(match)) {
        color = '#c084fc';
      } else if (/null/.test(match)) {
        color = '#94a3b8';
      }
      return `<span style="color:${color}">${match}</span>`;
    }
  );
}

function SchemaNode({ nodeKey, val, path, onCopy, depth }) {
  const [expanded, setExpanded] = useState(depth < 2);
  const [hovered, setHovered] = useState(false);
  const isObj = val !== null && typeof val === 'object' && !Array.isArray(val);
  const isArr = Array.isArray(val);
  const canExpand = isObj || isArr;
  const typeStr = isArr ? `array[${val.length}]` : isObj ? 'object' : typeof val;
  const typeColors = { string: '#86efac', number: '#fdba74', boolean: '#c084fc', object: '#93c5fd', 'array': '#fdba74' };
  const typeColor = typeColors[isArr ? 'array' : isObj ? 'object' : typeof val] || '#94a3b8';
  const preview = !canExpand ? String(JSON.stringify(val) ?? 'null').slice(0, 35) : null;

  return (
    <div>
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 4,
          padding: `3px 10px 3px ${10 + depth * 14}px`,
          cursor: 'pointer', borderRadius: 3, fontSize: 11,
          background: hovered ? '#0f172a' : 'transparent', transition: 'background 0.08s',
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => canExpand ? setExpanded(e => !e) : onCopy(path)}
      >
        <span style={{ color: '#1e3a5f', fontSize: 9, width: 10, flexShrink: 0 }}>
          {canExpand ? (expanded ? '▼' : '▶') : ''}
        </span>
        <span style={{ color: '#93c5fd', fontFamily: 'monospace', fontWeight: 600 }}>{nodeKey}</span>
        <span style={{ color: '#1e3a5f', margin: '0 2px' }}>:</span>
        <span style={{ color: typeColor, fontFamily: 'monospace', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {canExpand ? (isArr ? `[ ${val.length} items ]` : '{ ... }') : preview}
        </span>
        {!canExpand && hovered && (
          <span style={{ fontSize: 9, color: '#1e40af', background: '#0f172a', padding: '1px 5px', borderRadius: 3, flexShrink: 0 }}>
            copiar
          </span>
        )}
      </div>
      {canExpand && expanded && isObj && Object.entries(val).map(([k, v]) => (
        <SchemaNode key={k} nodeKey={k} val={v} path={`${path}.${k}`} onCopy={onCopy} depth={depth + 1} />
      ))}
      {canExpand && expanded && isArr && val.slice(0, 20).map((item, i) => (
        <SchemaNode key={i} nodeKey={`[${i}]`} val={item} path={`${path}[${i}]`} onCopy={onCopy} depth={depth + 1} />
      ))}
    </div>
  );
}

function DataPanel({ title, data, error }) {
  const [tab, setTab] = useState('schema');
  const [toast, setToast] = useState(null);

  const handleCopy = (path) => {
    const ref = `{{input.${path}}}`;
    navigator.clipboard.writeText(ref).catch(() => {});
    setToast(ref);
    setTimeout(() => setToast(null), 1600);
  };

  const isEmpty = data === null || data === undefined;
  const entries = !isEmpty && typeof data === 'object' ? Object.entries(data) : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '10px 12px 0', flexShrink: 0, gap: 8 }}>
        <span style={{ fontSize: 10, fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.12em', flex: 1 }}>
          {title}
        </span>
        <div style={{ display: 'flex', background: '#070711', borderRadius: 5, padding: 2, gap: 1 }}>
          {['schema', 'json'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              fontSize: 10, padding: '2px 8px', borderRadius: 3, border: 'none', cursor: 'pointer',
              background: tab === t ? '#1e293b' : 'transparent',
              color: tab === t ? '#e2e8f0' : '#334155',
              fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', transition: 'all 0.1s',
            }}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', paddingTop: 8 }}>
        {error && tab !== 'schema' ? (
          <pre style={{ color: '#f87171', fontFamily: 'monospace', fontSize: 11, padding: '10px 12px', margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.6 }}>
            {error}
          </pre>
        ) : isEmpty || (error && tab === 'schema') ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 160, gap: 8 }}>
            <span style={{ fontSize: 28, opacity: 0.07 }}>◷</span>
            <p style={{ color: '#1e293b', fontSize: 11, textAlign: 'center', margin: 0, lineHeight: 1.5 }}>
              {error ? 'Erro na execução' : 'Execute o flow\npara ver os dados'}
            </p>
          </div>
        ) : tab === 'json' ? (
          <pre
            style={{ fontFamily: 'monospace', fontSize: 11, padding: '10px 12px', margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.7 }}
            dangerouslySetInnerHTML={{ __html: syntaxHighlightJson(data) }}
          />
        ) : (
          <div>
            {entries.map(([k, v]) => (
              <SchemaNode key={k} nodeKey={k} val={v} path={k} onCopy={handleCopy} depth={0} />
            ))}
          </div>
        )}
      </div>

      {toast && (
        <div style={{
          position: 'absolute', bottom: 8, left: 8, right: 8,
          background: '#0f172a', border: '1px solid #10b981', borderRadius: 6,
          padding: '5px 10px', fontSize: 10, color: '#10b981', fontFamily: 'monospace',
          textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
        }}>
          ✓ Copiado: {toast}
        </div>
      )}
    </div>
  );
}

function CodeEditor({ value, onChange, placeholder }) {
  const [scrollTop, setScrollTop] = useState(0);
  const lines = Math.max(1, (value || '').split('\n').length);

  return (
    <div style={{
      display: 'flex', flex: 1, background: '#070711',
      border: '1px solid #1e293b', borderRadius: 6, overflow: 'hidden',
      fontFamily: 'monospace', fontSize: 12,
    }}>
      <div style={{
        width: 40, background: '#0d0d1e', color: '#2d3748',
        padding: '10px 0', textAlign: 'right', flexShrink: 0,
        borderRight: '1px solid #1a1a2e', overflowY: 'hidden', userSelect: 'none',
      }}>
        <div style={{ transform: `translateY(-${scrollTop}px)`, willChange: 'transform' }}>
          {Array.from({ length: lines }, (_, i) => (
            <div key={i} style={{ lineHeight: '1.65em', paddingRight: 8, fontSize: 11 }}>{i + 1}</div>
          ))}
        </div>
      </div>
      <textarea
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        onScroll={e => setScrollTop(e.currentTarget.scrollTop)}
        spellCheck={false}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        style={{
          flex: 1, background: 'transparent', color: '#e2e8f0',
          border: 'none', outline: 'none', resize: 'none',
          padding: '10px 14px', lineHeight: '1.65em',
          fontFamily: 'monospace', fontSize: 12, tabSize: 2,
        }}
      />
    </div>
  );
}

const inputStyle = { background: '#0d0d1e', border: '1px solid #1e293b', color: '#e2e8f0' };
const inputCls = 'w-full text-xs border rounded px-2.5 py-2 font-mono focus:outline-none focus:ring-1 focus:ring-violet-500 transition-colors';

export default function NodeEditorModal({ node, execData, onClose, onDataChange, onDelete, onStepRun }) {
  const [label, setLabel] = useState('');
  const [config, setConfig] = useState({});
  const [credentials, setCredentials] = useState([]);
  const [centerTab, setCenterTab] = useState('parameters');
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (node) {
      setLabel(node.data.label);
      const cfg = { ...node.data.config };
      if (Array.isArray(cfg.cases)) cfg.cases = cfg.cases.join(', ');
      setConfig(cfg);
      setCenterTab('parameters');
    }
  }, [node?.id]);

  useEffect(() => {
    if (node && CRED_NODES[node.data.nodeType]) {
      listCredentials().then(r => setCredentials(r.data)).catch(() => {});
    }
  }, [node?.data?.nodeType]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') handleApply();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [label, config]);

  if (!node) return null;

  const fields = FIELDS[node.data.nodeType] || [];
  const meta = NODE_META[node.data.nodeType] || { color: '#6366f1', icon: '?', label: node.data.nodeType };

  const inputData = execData?.input ?? null;
  const outputData = execData?.output ?? null;
  const outputError = execData?.status === 'error' ? execData.error : null;

  const buildNodeData = () => {
    const processed = { ...config };
    if (node.data.nodeType === 'switch' && typeof processed.cases === 'string') {
      processed.cases = processed.cases.split(',').map(s => s.trim()).filter(Boolean);
    }
    if (node.data.nodeType === 'wait' && processed.ms !== undefined) {
      processed.ms = Number(processed.ms);
    }
    if (node.data.nodeType === 'claude' && processed.maxTokens !== undefined) {
      processed.maxTokens = Number(processed.maxTokens);
    }
    return { label, nodeType: node.data.nodeType, config: processed };
  };

  const handleApply = () => {
    onDataChange(node.id, buildNodeData());
    onClose();
  };

  const handleExecuteStep = async () => {
    if (!onStepRun || isRunning) return;
    setIsRunning(true);
    await onStepRun(node.id, buildNodeData());
    setIsRunning(false);
  };

  return createPortal(
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(3,3,12,0.82)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(3px)',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        width: '94vw', maxWidth: 1280, height: '88vh',
        background: '#0a0a16',
        border: '1px solid #1a1a2e', borderRadius: 12,
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 30px 90px rgba(0,0,0,0.85)',
        overflow: 'hidden',
      }}>

        {/* ── Header ── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 16px', background: '#07070f',
          borderBottom: '1px solid #14142a', flexShrink: 0,
        }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8, flexShrink: 0,
            background: `${meta.color}1a`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, color: meta.color, fontWeight: 700,
          }}>
            {meta.icon}
          </div>

          <input
            value={label}
            onChange={e => setLabel(e.target.value)}
            style={{
              background: 'transparent', border: 'none', outline: 'none',
              color: '#e2e8f0', fontSize: 14, fontWeight: 700, minWidth: 0, flex: 1,
            }}
          />

          <span style={{
            fontSize: 10, padding: '2px 8px', borderRadius: 4,
            background: `${meta.color}1a`, color: meta.color,
            textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700, flexShrink: 0,
          }}>
            {meta.label}
          </span>

          {execData?.status === 'success' && (
            <span style={{ fontSize: 11, color: '#10b981', flexShrink: 0 }}>
              ✓ {execData.durationMs != null ? `${execData.durationMs}ms` : 'ok'}
            </span>
          )}
          {execData?.status === 'error' && (
            <span style={{ fontSize: 11, color: '#ef4444', flexShrink: 0 }}>✗ erro</span>
          )}

          <div style={{ flex: 1 }} />

          {/* Execute step button */}
          <button
            onClick={handleExecuteStep}
            disabled={isRunning}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: isRunning ? '#1e293b' : '#f59e0b',
              border: 'none', color: isRunning ? '#64748b' : '#0a0a16',
              cursor: isRunning ? 'not-allowed' : 'pointer',
              padding: '6px 14px', borderRadius: 7, fontSize: 12,
              fontWeight: 700, flexShrink: 0, transition: 'all 0.15s',
              letterSpacing: '0.01em',
            }}
            onMouseEnter={e => { if (!isRunning) e.currentTarget.style.background = '#d97706'; }}
            onMouseLeave={e => { if (!isRunning) e.currentTarget.style.background = '#f59e0b'; }}
          >
            {isRunning ? (
              <>
                <span style={{ display: 'inline-block', animation: 'spin 0.8s linear infinite', fontSize: 13 }}>◌</span>
                Executando…
              </>
            ) : (
              <>▶ Execute step</>
            )}
          </button>

          <button
            onClick={() => { onDelete(node.id); onClose(); }}
            style={{
              background: 'transparent', border: '1px solid #1e293b',
              color: '#475569', cursor: 'pointer', padding: '4px 12px',
              borderRadius: 6, fontSize: 11, transition: 'all 0.12s', flexShrink: 0,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#3f0808'; e.currentTarget.style.color = '#f87171'; e.currentTarget.style.borderColor = '#6b1010'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#475569'; e.currentTarget.style.borderColor = '#1e293b'; }}
          >
            ✕ Deletar
          </button>

          <button
            onClick={onClose}
            style={{
              background: 'transparent', border: 'none',
              color: '#334155', cursor: 'pointer', fontSize: 20, lineHeight: 1,
              padding: '0 4px', transition: 'color 0.1s', flexShrink: 0,
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#94a3b8'}
            onMouseLeave={e => e.currentTarget.style.color = '#334155'}
          >
            ✕
          </button>
        </div>

        {/* ── Three-column body ── */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

          {/* LEFT — INPUT */}
          <div style={{
            width: 280, flexShrink: 0, background: '#06060e',
            borderRight: '1px solid #14142a', overflow: 'hidden',
            display: 'flex', flexDirection: 'column',
          }}>
            <DataPanel title="INPUT" data={inputData} />
          </div>

          {/* CENTER — PARAMETERS */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#09091a' }}>
            {/* Tabs */}
            <div style={{
              display: 'flex', background: '#07070f',
              borderBottom: '1px solid #14142a', flexShrink: 0,
            }}>
              {[
                { id: 'parameters', label: 'Parâmetros' },
                { id: 'settings', label: 'Configurações' },
              ].map(t => (
                <button key={t.id} onClick={() => setCenterTab(t.id)} style={{
                  padding: '10px 20px', fontSize: 12, fontWeight: 600,
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  color: centerTab === t.id ? '#e2e8f0' : '#334155',
                  borderBottom: centerTab === t.id ? `2px solid ${meta.color}` : '2px solid transparent',
                  transition: 'all 0.12s',
                }}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* Form */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
              {centerTab === 'parameters' && (
                <>
                  {fields.length === 0 && (
                    <p style={{ color: '#1e293b', fontSize: 12, textAlign: 'center', marginTop: 48 }}>
                      Este nó não tem parâmetros configuráveis.
                    </p>
                  )}
                  {fields.map(field => {
                    const value = config[field.key] ?? field.default ?? '';
                    return (
                      <div key={field.key} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <label style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.09em' }}>
                          {field.label}
                        </label>
                        {field.help && (
                          <p style={{ fontSize: 11, color: '#334155', margin: 0, lineHeight: 1.45 }}>{field.help}</p>
                        )}

                        {field.type === 'credential' && (
                          <select value={value} onChange={e => setConfig(c => ({ ...c, [field.key]: e.target.value }))}
                            className={inputCls} style={{ ...inputStyle, cursor: 'pointer' }}>
                            <option value="">— usar variáveis de ambiente —</option>
                            {credentials.filter(c => c.type === field.credType).map(c => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </select>
                        )}

                        {field.type === 'select' && (
                          <select value={value} onChange={e => setConfig(c => ({ ...c, [field.key]: e.target.value }))}
                            className={inputCls} style={{ ...inputStyle, cursor: 'pointer' }}>
                            {field.options.map(o => <option key={o} value={o}>{o}</option>)}
                          </select>
                        )}

                        {(field.type === 'text' || field.type === 'number') && (
                          <input type={field.type} value={value} placeholder={field.placeholder}
                            onChange={e => setConfig(c => ({ ...c, [field.key]: e.target.value }))}
                            className={inputCls} style={inputStyle} />
                        )}

                        {field.type === 'textarea' && (
                          <textarea value={value} placeholder={field.placeholder} rows={4}
                            onChange={e => setConfig(c => ({ ...c, [field.key]: e.target.value }))}
                            className={inputCls} style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }} />
                        )}

                        {field.type === 'code' && (
                          <div style={{ height: 260, display: 'flex', flexDirection: 'column' }}>
                            <CodeEditor
                              value={value}
                              onChange={v => setConfig(c => ({ ...c, [field.key]: v }))}
                              placeholder={field.placeholder}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </>
              )}

              {centerTab === 'settings' && (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.09em' }}>ID do Nó</label>
                    <input value={node.id} readOnly className={inputCls} style={{ ...inputStyle, opacity: 0.45, cursor: 'default' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.09em' }}>Tipo</label>
                    <input value={node.data.nodeType} readOnly className={inputCls} style={{ ...inputStyle, opacity: 0.45, cursor: 'default' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.09em' }}>Posição</label>
                    <input
                      value={`x: ${Math.round(node.position?.x ?? 0)}, y: ${Math.round(node.position?.y ?? 0)}`}
                      readOnly className={inputCls} style={{ ...inputStyle, opacity: 0.45, cursor: 'default' }} />
                  </div>
                </>
              )}
            </div>

            {/* Apply */}
            <div style={{ padding: '14px 24px', borderTop: '1px solid #14142a', background: '#07070f', flexShrink: 0 }}>
              <button
                onClick={handleApply}
                style={{
                  width: '100%', padding: '10px', borderRadius: 8, border: 'none',
                  background: meta.color, color: '#fff', fontWeight: 700, fontSize: 13,
                  cursor: 'pointer', transition: 'opacity 0.12s', letterSpacing: '0.02em',
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.82'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                Aplicar  <span style={{ fontSize: 11, opacity: 0.6, fontWeight: 400 }}>Ctrl+Enter</span>
              </button>
            </div>
          </div>

          {/* RIGHT — OUTPUT */}
          <div style={{
            width: 280, flexShrink: 0, background: '#06060e',
            borderLeft: '1px solid #14142a', overflow: 'hidden',
            display: 'flex', flexDirection: 'column',
          }}>
            <DataPanel title="OUTPUT" data={outputData} error={outputError} />
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
