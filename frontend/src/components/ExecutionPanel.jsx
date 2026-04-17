import { useState } from 'react';

const STATUS_STYLE = {
  success: { color: '#10b981', icon: '✓', bg: '#10b98112' },
  error:   { color: '#ef4444', icon: '✗', bg: '#ef444412' },
  running: { color: '#f59e0b', icon: '◌', bg: '#f59e0b12' },
  pending: { color: '#64748b', icon: '○', bg: '#64748b12' },
};

export default function ExecutionPanel({ executions, onClose }) {
  const [expanded, setExpanded] = useState(null);

  if (!executions || executions.length === 0) return null;

  return (
    <div
      className="shrink-0 overflow-hidden flex flex-col"
      style={{
        height: 220,
        background: '#020617',
        borderTop: '1px solid #1e293b',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 shrink-0"
        style={{ borderBottom: '1px solid #1e293b' }}>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            Execução — resultado por nó
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
            style={{ background: '#1e293b', color: '#64748b' }}>
            {executions.length} nó{executions.length !== 1 ? 's' : ''}
          </span>
        </div>
        <button onClick={onClose}
          className="text-slate-600 hover:text-slate-400 text-xs transition-colors px-1">
          ✕
        </button>
      </div>

      {/* Node list */}
      <div className="flex-1 overflow-y-auto">
        {executions.map((log, i) => {
          const s = STATUS_STYLE[log.status] || STATUS_STYLE.pending;
          const isOpen = expanded === i;
          return (
            <div key={i}>
              <button
                onClick={() => setExpanded(isOpen ? null : i)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
                style={{ borderBottom: '1px solid #0f172a' }}
                onMouseEnter={e => e.currentTarget.style.background = '#0f172a'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                {/* Status icon */}
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                  style={{ background: s.bg, color: s.color }}>
                  {log.status === 'running'
                    ? <span className="animate-spin inline-block">{s.icon}</span>
                    : s.icon}
                </div>

                {/* Node info */}
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-semibold text-slate-200">{log.nodeId}</span>
                  <span className="text-[10px] text-slate-600 ml-2">{log.nodeType}</span>
                </div>

                {/* Duration */}
                {log.durationMs != null && (
                  <span className="text-[10px] text-slate-600 shrink-0">{log.durationMs}ms</span>
                )}

                {/* Expand arrow */}
                <span className="text-[10px] text-slate-600 shrink-0 ml-1">
                  {isOpen ? '▲' : '▼'}
                </span>
              </button>

              {/* Expanded output */}
              {isOpen && (
                <div className="px-4 pb-3 pt-1" style={{ background: '#0a0f1a', borderBottom: '1px solid #0f172a' }}>
                  {log.error ? (
                    <pre className="text-[11px] text-red-400 font-mono whitespace-pre-wrap break-all">
                      {log.error}
                    </pre>
                  ) : (
                    <pre className="text-[11px] text-emerald-300 font-mono whitespace-pre-wrap break-all max-h-28 overflow-y-auto">
                      {JSON.stringify(log.output, null, 2)}
                    </pre>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
