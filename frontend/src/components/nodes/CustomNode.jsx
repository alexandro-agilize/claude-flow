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

const STATUS_CONFIG = {
  success: { icon: '✓', color: '#10b981', glow: '#10b98144' },
  error:   { icon: '✗', color: '#ef4444', glow: '#ef444444' },
  running: { icon: '◌', color: '#f59e0b', glow: '#f59e0b44' },
};

function ConfigPreview({ nodeType, config }) {
  if (!config || Object.keys(config).length === 0) return null;
  if (nodeType === 'http' && config.url)
    return <span className="font-mono truncate">{config.url}</span>;
  if (nodeType === 'if' && config.condition)
    return <span className="font-mono truncate">{config.condition}</span>;
  if (nodeType === 'wait' && config.ms)
    return <span>{config.ms} ms</span>;
  if (nodeType === 'code' && config.code)
    return <span className="font-mono truncate">{config.code.split('\n')[0]}</span>;
  if (nodeType === 'claude' && config.prompt)
    return <span className="truncate">{config.prompt.slice(0, 40)}{config.prompt.length > 40 ? '…' : ''}</span>;
  if (nodeType === 'loop' && config.arrayPath)
    return <span className="font-mono truncate">{config.arrayPath}</span>;
  if (nodeType === 'set-variable' && config.name)
    return <span className="font-mono truncate">{config.name}</span>;
  if (nodeType === 'email' && config.to)
    return <span className="truncate">{config.to}</span>;
  if (nodeType === 'slack' && config.channel)
    return <span className="font-mono truncate">{config.channel}</span>;
  if (nodeType === 'postgres' && config.query)
    return <span className="font-mono truncate">{config.query.split('\n')[0]}</span>;
  if (nodeType === 'sub-flow' && config.flowId)
    return <span className="font-mono truncate">{config.flowId}</span>;
  return null;
}

export default function CustomNode({ id, data, selected }) {
  const { onDeleteNode, onDuplicateNode, nodeExecutions } = useFlowContext();
  const [hovered, setHovered] = useState(false);

  const s = STYLES[data.nodeType] || STYLES.code;
  const exec = nodeExecutions?.[id];
  const status = exec?.status;
  const sc = STATUS_CONFIG[status];

  const isWebhook = data.nodeType === 'webhook';
  const isIf      = data.nodeType === 'if';
  const isSwitch  = data.nodeType === 'switch';
  const cases     = isSwitch ? (Array.isArray(data.config?.cases) ? data.config.cases : []) : [];

  const borderColor = sc ? sc.color : selected ? s.color : hovered ? '#475569' : '#2d3f55';
  const boxShadow   = sc
    ? `0 0 0 2px ${sc.glow}, 0 8px 24px rgba(0,0,0,0.5)`
    : selected
    ? `0 0 0 2px ${s.color}44, 0 8px 24px rgba(0,0,0,0.5)`
    : '0 2px 8px rgba(0,0,0,0.4)';

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ position: 'relative', userSelect: 'none' }}
    >
      {/* Hover toolbar — n8n style */}
      <NodeToolbar isVisible={hovered || selected} position={Position.Top} offset={6}>
        <div className="flex items-center gap-1 px-1.5 py-1 rounded-lg"
          style={{ background: '#0f172a', border: '1px solid #334155', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
          <button
            onClick={() => onDuplicateNode(id)}
            className="text-[11px] px-2 py-1 rounded transition-colors text-slate-400 hover:text-slate-100 hover:bg-slate-700"
            title="Duplicar"
          >
            ⎘ Duplicar
          </button>
          <div className="w-px h-4" style={{ background: '#334155' }} />
          <button
            onClick={() => onDeleteNode(id)}
            className="text-[11px] px-2 py-1 rounded transition-colors text-slate-400 hover:text-red-400 hover:bg-red-500/10"
            title="Deletar (Delete)"
          >
            ✕ Deletar
          </button>
        </div>
      </NodeToolbar>

      {/* Node card */}
      <div
        className="rounded-xl transition-all"
        style={{
          background: '#1a2740',
          border: `1.5px solid ${borderColor}`,
          minWidth: 190,
          maxWidth: 240,
          boxShadow,
          transition: 'border-color 0.15s, box-shadow 0.15s',
        }}
      >
        {!isWebhook && (
          <Handle type="target" position={Position.Top}
            style={{ background: '#334155', borderColor: '#475569', width: 10, height: 10, top: -6 }} />
        )}

        {/* Header */}
        <div
          className="px-3 py-2.5 flex items-center gap-2.5 rounded-t-[10px]"
          style={{ borderBottom: `1px solid ${s.color}22`, background: `linear-gradient(135deg, ${s.color}18, ${s.color}08)` }}
        >
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-sm font-bold"
            style={{ background: `${s.color}22`, color: s.color }}
          >
            {s.icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-0.5">{s.label}</p>
            <p className="text-sm font-semibold text-slate-100 truncate leading-tight">{data.label}</p>
          </div>
          {/* Execution status badge */}
          {sc && (
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
              style={{ background: `${sc.color}22`, color: sc.color, border: `1px solid ${sc.color}44` }}
              title={status === 'running' ? 'Executando…' : status === 'success' ? `${exec?.durationMs}ms` : exec?.error}
            >
              {status === 'running' ? <span className="animate-spin inline-block">◌</span> : sc.icon}
            </div>
          )}
        </div>

        {/* Body — config preview or execution output */}
        <div className="px-3 py-2 min-h-[30px]">
          {status === 'success' && exec?.output ? (
            <p className="text-[10px] text-emerald-400 truncate font-mono">
              {JSON.stringify(exec.output).slice(0, 60)}
            </p>
          ) : status === 'error' ? (
            <p className="text-[10px] text-red-400 truncate">{exec?.error}</p>
          ) : (
            <p className="text-[11px] text-slate-500 truncate">
              <ConfigPreview nodeType={data.nodeType} config={data.config} />
            </p>
          )}
        </div>

        {/* IF branches label */}
        {isIf && (
          <div className="flex justify-between text-[10px] px-3 pb-2"
            style={{ borderTop: '1px solid #1e293b' }}>
            <span className="font-semibold" style={{ color: '#10b981' }}>✓ true</span>
            <span className="font-semibold" style={{ color: '#ef4444' }}>✗ false</span>
          </div>
        )}

        {/* Switch case labels */}
        {isSwitch && cases.length > 0 && (
          <div className="flex flex-wrap gap-1 px-2 pb-2 pt-1 justify-center"
            style={{ borderTop: '1px solid #1e293b' }}>
            {cases.map((c) => (
              <span key={c} className="text-[9px] px-1.5 py-0.5 rounded font-semibold"
                style={{ background: '#f9731618', color: '#f97316' }}>{c}</span>
            ))}
          </div>
        )}

        {/* Output handles */}
        {!isIf && !isSwitch && (
          <Handle type="source" position={Position.Bottom}
            style={{ background: '#334155', borderColor: '#475569', width: 10, height: 10, bottom: -6 }} />
        )}
        {isIf && (
          <>
            <Handle type="source" position={Position.Bottom} id="true"
              style={{ left: '28%', background: '#10b981', borderColor: '#10b981', width: 10, height: 10, bottom: -6 }} />
            <Handle type="source" position={Position.Bottom} id="false"
              style={{ left: '72%', background: '#ef4444', borderColor: '#ef4444', width: 10, height: 10, bottom: -6 }} />
          </>
        )}
        {isSwitch && cases.map((c, i) => (
          <Handle key={c} type="source" position={Position.Bottom} id={String(c)}
            style={{
              left: `${((i + 1) / (cases.length + 1)) * 100}%`,
              background: '#f97316', borderColor: '#f97316', width: 10, height: 10, bottom: -6,
            }}
          />
        ))}
      </div>
    </div>
  );
}
