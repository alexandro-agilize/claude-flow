import { useState } from 'react';

function flattenPaths(obj, prefix = '', depth = 0) {
  if (!obj || typeof obj !== 'object' || depth > 3) return [];
  return Object.keys(obj).flatMap(key => {
    const path = prefix ? `${prefix}.${key}` : key;
    const val = obj[key];
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      return [path, ...flattenPaths(val, path, depth + 1)];
    }
    return [path];
  });
}

function FieldChip({ path }) {
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
        fontSize: 10, padding: '2px 7px', borderRadius: 4,
        background: copied ? '#10b98118' : '#0f172a',
        border: `1px solid ${copied ? '#10b981' : '#1e293b'}`,
        color: copied ? '#10b981' : '#60a5fa',
        cursor: 'pointer', fontFamily: 'monospace',
        transition: 'all 0.12s', whiteSpace: 'nowrap',
      }}
    >
      {copied ? '✓ copiado' : path}
    </button>
  );
}

function JsonView({ data, error }) {
  if (error) return (
    <pre style={{ fontSize: 11, color: '#f87171', fontFamily: 'monospace', margin: 0, padding: '10px 14px', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
      {error}
    </pre>
  );
  if (data === null || data === undefined) return (
    <p style={{ color: '#2a2a4a', fontSize: 12, padding: '12px 14px', margin: 0 }}>Sem dados</p>
  );
  return (
    <pre style={{ fontSize: 11, color: '#86efac', fontFamily: 'monospace', margin: 0, padding: '10px 14px', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

export default function NodeIOPanel({ node, execData, onClose }) {
  const [tab, setTab] = useState('output');

  if (!node) return null;

  const hasData = execData && (execData.input !== undefined || execData.output !== undefined || execData.error);
  const tabData = tab === 'input' ? execData?.input : execData?.output;
  const fields = flattenPaths(tabData).slice(0, 30);

  const Tab = ({ id, label }) => (
    <button
      onClick={() => setTab(id)}
      style={{
        fontSize: 11, padding: '3px 12px', borderRadius: 5, border: 'none', cursor: 'pointer',
        fontWeight: 600, background: tab === id ? '#1e293b' : 'transparent',
        color: tab === id ? '#e2e8f0' : '#475569', transition: 'all 0.1s',
      }}
    >
      {label}
    </button>
  );

  return (
    <div style={{ height: 230, flexShrink: 0, background: '#050510', borderTop: '1px solid #1a1a2e', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderBottom: '1px solid #0f172a', flexShrink: 0 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#cbd5e1' }}>{node.data?.label}</span>
        <span style={{ fontSize: 9, color: '#334155', background: '#0f172a', padding: '1px 6px', borderRadius: 3, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          {node.data?.nodeType}
        </span>
        {execData?.status === 'success' && (
          <span style={{ fontSize: 10, color: '#10b981' }}>✓ {execData.durationMs != null ? `${execData.durationMs}ms` : 'ok'}</span>
        )}
        {execData?.status === 'error' && (
          <span style={{ fontSize: 10, color: '#ef4444' }}>✗ erro</span>
        )}

        <div style={{ flex: 1 }} />

        <div style={{ display: 'flex', gap: 1, background: '#0a0a18', borderRadius: 6, padding: 2 }}>
          <Tab id="input" label="Entrada" />
          <Tab id="output" label="Saída" />
        </div>

        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#334155', cursor: 'pointer', fontSize: 16, lineHeight: 1, marginLeft: 4 }}>✕</button>
      </div>

      {!hasData ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
          <span style={{ fontSize: 20, opacity: 0.1 }}>◷</span>
          <p style={{ color: '#1e293b', fontSize: 12, margin: 0 }}>Execute o flow para ver os dados deste nó</p>
        </div>
      ) : (
        <>
          {/* Field chips — clique para copiar {{input.campo}} */}
          {fields.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, padding: '5px 12px', borderBottom: '1px solid #0a0a18', flexShrink: 0, alignItems: 'center' }}>
              <span style={{ fontSize: 9, color: '#1e3a5f', textTransform: 'uppercase', letterSpacing: '0.08em', marginRight: 2 }}>copiar campo:</span>
              {fields.map(f => <FieldChip key={f} path={f} />)}
            </div>
          )}

          {/* JSON */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <JsonView
              data={tabData}
              error={tab === 'output' && execData?.status === 'error' ? execData.error : null}
            />
          </div>
        </>
      )}
    </div>
  );
}
