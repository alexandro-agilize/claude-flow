import { useState, useEffect, useCallback } from 'react';
import { listExecutions, listFlows, getExecution } from '../api';

const STATUS = {
  success: { color: '#10b981', bg: '#10b98115', label: 'Sucesso', icon: '✓' },
  error:   { color: '#ef4444', bg: '#ef444415', label: 'Erro',    icon: '✗' },
  pending: { color: '#f59e0b', bg: '#f59e0b15', label: 'Pendente', icon: '◌' },
  running: { color: '#3b82f6', bg: '#3b82f615', label: 'Rodando', icon: '▶' },
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60)   return `${s}s atrás`;
  if (s < 3600) return `${Math.floor(s / 60)}min atrás`;
  if (s < 86400) return `${Math.floor(s / 3600)}h atrás`;
  return `${Math.floor(s / 86400)}d atrás`;
}

function NodeLogRow({ log }) {
  const [open, setOpen] = useState(false);
  const s = STATUS[log.status] || STATUS.pending;
  return (
    <div style={{ borderBottom: '1px solid #1a1a2a' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}
        onMouseEnter={e => e.currentTarget.style.background = '#ffffff05'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        <span style={{ width: 20, height: 20, borderRadius: '50%', background: s.bg, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{s.icon}</span>
        <span style={{ fontSize: 12, color: '#c9c9d4', flex: 1 }}>{log.nodeId}</span>
        <span style={{ fontSize: 11, color: '#4a4a6a' }}>{log.nodeType}</span>
        {log.durationMs != null && <span style={{ fontSize: 11, color: '#4a4a6a', marginLeft: 8 }}>{log.durationMs}ms</span>}
        <span style={{ fontSize: 10, color: '#3a3a5a', marginLeft: 4 }}>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div style={{ padding: '8px 16px 12px 46px', background: '#0a0a12' }}>
          {log.error ? (
            <pre style={{ color: '#ef4444', fontSize: 11, margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{log.error}</pre>
          ) : (
            <pre style={{ color: '#34d399', fontSize: 11, margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all', maxHeight: 120, overflow: 'auto' }}>
              {log.output ? JSON.stringify(JSON.parse(log.output), null, 2) : '(sem output)'}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}

function ExecutionRow({ exec, flowName }) {
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState(null);
  const s = STATUS[exec.status] || STATUS.pending;

  const expand = async () => {
    if (!open && !detail) {
      try { const { data } = await getExecution(exec.id); setDetail(data); } catch (_) {}
    }
    setOpen(o => !o);
  };

  const duration = exec.finishedAt
    ? `${Date.now() - new Date(exec.startedAt).getTime() < 1000 ? Math.round((new Date(exec.finishedAt) - new Date(exec.startedAt))) + 'ms' : ((new Date(exec.finishedAt) - new Date(exec.startedAt)) / 1000).toFixed(1) + 's'}`
    : '—';

  return (
    <div style={{ borderBottom: '1px solid #1e1e2e' }}>
      <button
        onClick={expand}
        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}
        onMouseEnter={e => e.currentTarget.style.background = '#ffffff05'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        <span style={{ width: 24, height: 24, borderRadius: '50%', background: s.bg, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{s.icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 13, color: '#e2e2f0', fontWeight: 600 }}>{flowName || exec.flowId}</p>
          <p style={{ margin: 0, fontSize: 11, color: '#4a4a6a' }}>{exec.id.slice(0, 8)}…</p>
        </div>
        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: s.bg, color: s.color, fontWeight: 600 }}>{s.label}</span>
        <span style={{ fontSize: 11, color: '#4a4a6a', minWidth: 50, textAlign: 'right' }}>{duration}</span>
        <span style={{ fontSize: 11, color: '#4a4a6a', minWidth: 80, textAlign: 'right' }}>{timeAgo(exec.startedAt)}</span>
        <span style={{ fontSize: 10, color: '#3a3a5a', marginLeft: 8 }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div style={{ background: '#0d0d18', borderTop: '1px solid #1e1e2e' }}>
          {detail ? (
            detail.logs?.length > 0
              ? detail.logs.map((log, i) => <NodeLogRow key={i} log={log} />)
              : <p style={{ padding: '12px 20px', color: '#4a4a6a', fontSize: 12, margin: 0 }}>Sem logs de nós.</p>
          ) : (
            <p style={{ padding: '12px 20px', color: '#4a4a6a', fontSize: 12, margin: 0 }}>Carregando…</p>
          )}
        </div>
      )}
    </div>
  );
}

export default function ExecutionsPage() {
  const [executions, setExecutions] = useState([]);
  const [flows, setFlows] = useState([]);
  const [filterFlowId, setFilterFlowId] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [execRes, flowRes] = await Promise.all([
        listExecutions(filterFlowId || undefined),
        listFlows(),
      ]);
      setExecutions(execRes.data);
      setFlows(flowRes.data);
    } catch (_) {}
    finally { setLoading(false); }
  }, [filterFlowId]);

  useEffect(() => { load(); }, [load]);

  const flowMap = Object.fromEntries(flows.map(f => [f.id, f.name || f.id]));

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#101014', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '16px 24px', borderBottom: '1px solid #2d2d3e', background: '#1a1a24', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#e2e2f0' }}>Execuções</h1>
          <p style={{ margin: 0, fontSize: 11, color: '#4a4a6a' }}>Histórico de todas as execuções de flows</p>
        </div>
        <select
          value={filterFlowId}
          onChange={e => setFilterFlowId(e.target.value)}
          style={{ fontSize: 12, padding: '6px 10px', borderRadius: 6, background: '#101014', border: '1px solid #2d2d3e', color: '#94a3b8', cursor: 'pointer', outline: 'none' }}
        >
          <option value="">Todos os flows</option>
          {flows.map(f => <option key={f.id} value={f.id}>{f.name || f.id}</option>)}
        </select>
        <button
          onClick={load}
          style={{ fontSize: 12, padding: '6px 14px', borderRadius: 6, background: '#7c3aed', border: 'none', color: '#fff', cursor: 'pointer', fontWeight: 600 }}
          onMouseEnter={e => e.currentTarget.style.background = '#6d28d9'}
          onMouseLeave={e => e.currentTarget.style.background = '#7c3aed'}
        >
          ↺ Atualizar
        </button>
      </div>

      {/* Table header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 20px', borderBottom: '1px solid #1e1e2e', flexShrink: 0 }}>
        <span style={{ width: 24, flexShrink: 0 }} />
        <span style={{ flex: 1, fontSize: 10, fontWeight: 700, color: '#4a4a6a', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Flow</span>
        <span style={{ fontSize: 10, fontWeight: 700, color: '#4a4a6a', textTransform: 'uppercase', letterSpacing: '0.08em', width: 70 }}>Status</span>
        <span style={{ fontSize: 10, fontWeight: 700, color: '#4a4a6a', textTransform: 'uppercase', letterSpacing: '0.08em', width: 50, textAlign: 'right' }}>Duração</span>
        <span style={{ fontSize: 10, fontWeight: 700, color: '#4a4a6a', textTransform: 'uppercase', letterSpacing: '0.08em', width: 80, textAlign: 'right' }}>Início</span>
        <span style={{ width: 18 }} />
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {loading ? (
          <p style={{ padding: 24, color: '#4a4a6a', fontSize: 13 }}>Carregando…</p>
        ) : executions.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.15 }}>◷</div>
            <p style={{ color: '#4a4a6a', fontSize: 13, margin: 0 }}>Nenhuma execução encontrada.</p>
            <p style={{ color: '#3a3a5a', fontSize: 11, margin: '4px 0 0' }}>Execute um flow para ver o histórico aqui.</p>
          </div>
        ) : (
          executions.map(exec => (
            <ExecutionRow key={exec.id} exec={exec} flowName={flowMap[exec.flowId]} />
          ))
        )}
      </div>
    </div>
  );
}
