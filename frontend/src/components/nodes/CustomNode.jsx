import { Handle, Position } from 'reactflow';

const STYLES = {
  webhook: { header: 'bg-emerald-500', border: 'border-emerald-500', icon: '⚡', badge: 'Webhook' },
  http:    { header: 'bg-blue-500',    border: 'border-blue-500',    icon: '🌐', badge: 'HTTP' },
  code:    { header: 'bg-violet-500',  border: 'border-violet-500',  icon: '{ }', badge: 'Code' },
  if:      { header: 'bg-amber-500',   border: 'border-amber-500',   icon: '?',  badge: 'IF' },
  switch:  { header: 'bg-yellow-400',  border: 'border-yellow-400',  icon: '⇄',  badge: 'Switch' },
  wait:    { header: 'bg-slate-400',   border: 'border-slate-400',   icon: '⏱', badge: 'Wait' },
};

export default function CustomNode({ data, selected }) {
  const s = STYLES[data.nodeType] || STYLES.code;
  const isWebhook = data.nodeType === 'webhook';
  const isIf      = data.nodeType === 'if';
  const isSwitch  = data.nodeType === 'switch';
  const cases     = isSwitch ? (Array.isArray(data.config?.cases) ? data.config.cases : []) : [];

  return (
    <div className={`rounded-lg border-2 ${s.border} shadow-md bg-white min-w-[170px] select-none ${selected ? 'ring-2 ring-offset-1 ring-blue-400' : ''}`}>
      {!isWebhook && (
        <Handle type="target" position={Position.Top}
          className="!w-3 !h-3 !bg-gray-300 !border-2 !border-white" />
      )}

      {/* Header */}
      <div className={`${s.header} text-white px-3 py-2 flex items-center gap-2 rounded-t-[6px]`}>
        <span className="text-sm font-bold w-4 text-center leading-none shrink-0">{s.icon}</span>
        <span className="text-sm font-medium truncate">{data.label}</span>
      </div>

      {/* Body */}
      <div className="px-3 py-2 min-h-[36px]">
        <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">{s.badge}</span>
        {data.nodeType === 'http' && data.config?.url && (
          <p className="text-[11px] text-gray-500 truncate mt-0.5">{data.config.url}</p>
        )}
        {data.nodeType === 'if' && data.config?.condition && (
          <p className="text-[11px] text-gray-500 truncate mt-0.5 font-mono">{data.config.condition}</p>
        )}
        {data.nodeType === 'wait' && data.config?.ms && (
          <p className="text-[11px] text-gray-500 mt-0.5">{data.config.ms} ms</p>
        )}
        {data.nodeType === 'code' && data.config?.code && (
          <p className="text-[11px] text-gray-400 truncate mt-0.5 font-mono">{data.config.code}</p>
        )}
      </div>

      {/* Default single source handle */}
      {!isIf && !isSwitch && (
        <Handle type="source" position={Position.Bottom}
          className="!w-3 !h-3 !bg-gray-400 !border-2 !border-white" />
      )}

      {/* IF: two handles — true / false */}
      {isIf && (
        <>
          <div className="flex justify-between text-[10px] px-4 pb-2 pt-0.5">
            <span className="text-green-600 font-semibold">✓ true</span>
            <span className="text-red-500 font-semibold">✗ false</span>
          </div>
          <Handle type="source" position={Position.Bottom} id="true"
            style={{ left: '28%' }}
            className="!w-3 !h-3 !bg-green-400 !border-2 !border-white" />
          <Handle type="source" position={Position.Bottom} id="false"
            style={{ left: '72%' }}
            className="!w-3 !h-3 !bg-red-400 !border-2 !border-white" />
        </>
      )}

      {/* Switch: one handle per case */}
      {isSwitch && cases.length > 0 && (
        <>
          <div className="flex flex-wrap gap-1 px-2 pb-2 pt-0.5 justify-center">
            {cases.map((c) => (
              <span key={c} className="bg-yellow-100 text-yellow-700 text-[10px] px-1.5 py-0.5 rounded font-medium">
                {c}
              </span>
            ))}
          </div>
          {cases.map((c, i) => (
            <Handle
              key={c}
              type="source"
              position={Position.Bottom}
              id={String(c)}
              style={{ left: `${((i + 1) / (cases.length + 1)) * 100}%` }}
              className="!w-3 !h-3 !bg-yellow-400 !border-2 !border-white"
            />
          ))}
        </>
      )}
    </div>
  );
}
