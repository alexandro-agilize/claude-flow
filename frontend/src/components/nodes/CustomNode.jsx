import { useState } from 'react';
import { Handle, Position, NodeToolbar } from 'reactflow';
import { useFlowContext } from '../../context/FlowContext';

const STYLES = {
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

const STATUS = {
  success: { icon: '✓', color: '#10b981' },
  error:   { icon: '✗', color: '#ef4444' },
  running: { icon: '◌', color: '#f59e0b' },
};

function configSummary(nodeType, config) {
  if (!config) return null;
  if (nodeType === 'http')          return config.url;
  if (nodeType === 'if')            return config.condition;
  if (nodeType === 'wait')          return config.ms ? `${config.ms} ms` : null;
  if (nodeType === 'code')          return config.code?.split('\n')[0];
  if (nodeType === 'claude')        return config.prompt?.slice(0, 45);
  if (nodeType === 'loop')          return config.arrayPath;
  if (nodeType === 'set-variable')  return config.name;
  if (nodeType === 'email')         return config.to;
  if (nodeType === 'slack')         return config.channel;
  if (nodeType === 'postgres')      return config.query?.split('\n')[0];
  if (nodeType === 'sub-flow')      return config.flowId;
  return null;
}

export default function CustomNode({ id, data, selected }) {
  const { onDeleteNode, onDuplicateNode, nodeExecutions } = useFlowContext();
  const [hovered, setHovered] = useState(false);

  const s = STYLES[data.nodeType] || STYLES.code;
  const exec = nodeExecutions?.[id];
  const status = exec?.status;
  const sc = STATUS[status];

  const isWebhook = data.nodeType === 'webhook';
  const isIf      = data.nodeType === 'if';
  const isSwitch  = data.nodeType === 'switch';
  const cases     = isSwitch ? (Array.isArray(data.config?.cases) ? data.config.cases : []) : [];

  const preview = status === 'success' && exec?.output
    ? JSON.stringify(exec.output).slice(0, 55)
    : status === 'error'
    ? exec?.error?.slice(0, 55)
    : configSummary(data.nodeType, data.config);

  const previewColor = status === 'success' ? '#34d399'
    : status === 'error' ? '#f87171'
    : '#475569';

  const borderColor = sc ? sc.color
    : selected ? `${s.color}cc`
    : hovered ? '#2d3748'
    : '#1a2035';

  const shadow = selected
    ? `0 0 0 2px ${s.color}33, 0 8px 32px rgba(0,0,0,0.6)`
    : sc ? `0 0 0 2px ${sc.color}33, 0 4px 16px rgba(0,0,0,0.5)`
    : '0 2px 8px rgba(0,0,0,0.5)';

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ position: 'relative', userSelect: 'none' }}
    >
      <NodeToolbar isVisible={hovered || selected} position={Position.Top} offset={5}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, padding: '4px 6px', borderRadius: 8, background: '#0f172a', border: '1px solid #1e293b', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
          <button
            onClick={() => onDuplicateNode(id)}
            style={{ fontSize: 11, padding: '3px 8px', borderRadius: 5, border: 'none', background: 'transparent', color: '#64748b', cursor: 'pointer' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#1e293b'; e.currentTarget.style.color = '#e2e8f0'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748b'; }}
          >⎘ Duplicar</button>
          <div style={{ width: 1, height: 14, background: '#1e293b' }} />
          <button
            onClick={() => onDeleteNode(id)}
            style={{ fontSize: 11, padding: '3px 8px', borderRadius: 5, border: 'none', background: 'transparent', color: '#64748b', cursor: 'pointer' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#450a0a'; e.currentTarget.style.color = '#f87171'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748b'; }}
          >✕ Deletar</button>
        </div>
      </NodeToolbar>

      {/* Node card — n8n compact style */}
      <div style={{
        background: '#13131f',
        border: `1.5px solid ${borderColor}`,
        borderRadius: 10,
        minWidth: 200,
        maxWidth: 248,
        boxShadow: shadow,
        transition: 'border-color 0.12s, box-shadow 0.12s',
        overflow: 'hidden',
      }}>
        {/* Colored top accent line */}
        <div style={{ height: 2, background: s.color, opacity: 0.7 }} />

        {!isWebhook && (
          <Handle type="target" position={Position.Top}
            style={{ background: '#1e293b', borderColor: '#334155', width: 10, height: 10, top: -5 }} />
        )}

        {/* Main row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 10px' }}>
          {/* Icon */}
          <div style={{
            width: 32, height: 32, borderRadius: 8, flexShrink: 0,
            background: `${s.color}18`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, fontWeight: 700, color: s.color,
          }}>
            {s.icon}
          </div>

          {/* Label */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 9, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.09em', margin: 0, lineHeight: 1 }}>
              {s.label}
            </p>
            <p style={{ fontSize: 12, color: '#cbd5e1', fontWeight: 600, margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.2 }}>
              {data.label}
            </p>
          </div>

          {/* Status badge */}
          {sc && (
            <div style={{
              width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
              background: `${sc.color}18`, color: sc.color,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, fontWeight: 700, border: `1px solid ${sc.color}44`,
            }}>
              {status === 'running' ? <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>◌</span> : sc.icon}
            </div>
          )}
        </div>

        {/* Preview strip */}
        {preview && (
          <div style={{
            borderTop: `1px solid ${s.color}12`,
            padding: '4px 10px 6px',
            background: '#0c0c18',
          }}>
            <p style={{ fontSize: 10, color: previewColor, fontFamily: 'monospace', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', opacity: 0.85 }}>
              {preview}
            </p>
          </div>
        )}

        {/* IF branch labels */}
        {isIf && (
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 10px 5px', borderTop: `1px solid ${s.color}12`, background: '#0c0c18' }}>
            <span style={{ fontSize: 9, fontWeight: 700, color: '#10b981' }}>✓ true</span>
            <span style={{ fontSize: 9, fontWeight: 700, color: '#ef4444' }}>✗ false</span>
          </div>
        )}

        {/* Switch case labels */}
        {isSwitch && cases.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, padding: '3px 8px 5px', borderTop: `1px solid ${s.color}12`, background: '#0c0c18', justifyContent: 'center' }}>
            {cases.map(c => (
              <span key={c} style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, background: '#f9731618', color: '#fb923c', fontWeight: 600 }}>{c}</span>
            ))}
          </div>
        )}

        {/* Output handles */}
        {!isIf && !isSwitch && (
          <Handle type="source" position={Position.Bottom}
            style={{ background: '#1e293b', borderColor: '#334155', width: 10, height: 10, bottom: -5 }} />
        )}
        {isIf && (
          <>
            <Handle type="source" position={Position.Bottom} id="true"
              style={{ left: '28%', background: '#10b981', borderColor: '#10b981', width: 10, height: 10, bottom: -5 }} />
            <Handle type="source" position={Position.Bottom} id="false"
              style={{ left: '72%', background: '#ef4444', borderColor: '#ef4444', width: 10, height: 10, bottom: -5 }} />
          </>
        )}
        {isSwitch && cases.map((c, i) => (
          <Handle key={c} type="source" position={Position.Bottom} id={String(c)}
            style={{ left: `${((i + 1) / (cases.length + 1)) * 100}%`, background: '#f97316', borderColor: '#f97316', width: 10, height: 10, bottom: -5 }} />
        ))}
      </div>
    </div>
  );
}
