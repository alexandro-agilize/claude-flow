import { useState, useEffect } from 'react';
import { listFlows, createFlow, deleteFlow } from '../api';
import { slugify } from '../utils/flowConverter';

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60)   return `${s}s atrás`;
  if (s < 3600) return `${Math.floor(s / 60)}min atrás`;
  if (s < 86400) return `${Math.floor(s / 3600)}h atrás`;
  return `${Math.floor(s / 86400)}d atrás`;
}

function FlowCard({ flow, onOpen, onDelete }) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm(`Deletar o flow "${flow.name || flow.id}"?`)) return;
    setDeleting(true);
    try { await deleteFlow(flow.id); onDelete(); }
    catch (_) { setDeleting(false); }
  };

  return (
    <div
      style={{ background: '#1a1a24', border: '1px solid #2d2d3e', borderRadius: 10, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14, transition: 'border-color 0.12s' }}
      onMouseEnter={e => e.currentTarget.style.borderColor = '#474760'}
      onMouseLeave={e => e.currentTarget.style.borderColor = '#2d2d3e'}
    >
      {/* Icon */}
      <div style={{ width: 36, height: 36, borderRadius: 8, background: '#7c3aed18', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8b5cf6', fontSize: 16, flexShrink: 0 }}>
        ⚡
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#e2e2f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {flow.name || flow.id}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
          <span style={{ fontSize: 11, color: '#3a3a5a', fontFamily: 'monospace' }}>{flow.id}</span>
          {flow.updatedAt && (
            <span style={{ fontSize: 10, color: '#2d2d4a' }}>· atualizado {timeAgo(flow.updatedAt)}</span>
          )}
        </div>
        {flow.description && (
          <p style={{ margin: '4px 0 0', fontSize: 11, color: '#4a4a6a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{flow.description}</p>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        <button
          onClick={() => onOpen(flow.id)}
          style={{ fontSize: 12, padding: '6px 14px', borderRadius: 6, background: '#7c3aed', border: 'none', color: '#fff', cursor: 'pointer', fontWeight: 600 }}
          onMouseEnter={e => e.currentTarget.style.background = '#6d28d9'}
          onMouseLeave={e => e.currentTarget.style.background = '#7c3aed'}
        >
          Abrir Editor
        </button>
        <button
          onClick={handleDelete} disabled={deleting}
          style={{ fontSize: 12, padding: '6px 12px', borderRadius: 6, background: 'transparent', border: '1px solid #2d2d3e', color: '#6b6b8a', cursor: 'pointer', opacity: deleting ? 0.5 : 1 }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#ef4444'; e.currentTarget.style.color = '#ef4444'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#2d2d3e'; e.currentTarget.style.color = '#6b6b8a'; }}
        >
          {deleting ? '…' : 'Deletar'}
        </button>
      </div>
    </div>
  );
}

export default function FlowsPage({ onOpenFlow }) {
  const [flows, setFlows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const load = async () => {
    setLoading(true);
    try { const { data } = await listFlows(); setFlows(data); }
    catch (_) {}
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleNew = async () => {
    const name = window.prompt('Nome do novo flow:', 'Meu Flow');
    if (!name?.trim()) return;
    setCreating(true);
    try {
      const id = slugify(name) || `flow-${Date.now()}`;
      await createFlow({ id, name: name.trim(), nodes: [], edges: [] });
      await load();
      onOpenFlow(id);
    } catch (err) {
      alert(`Erro ao criar flow: ${err.response?.data?.error || err.message}`);
    } finally { setCreating(false); }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#101014', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '16px 24px', borderBottom: '1px solid #2d2d3e', background: '#1a1a24', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#e2e2f0' }}>Flows</h1>
          <p style={{ margin: 0, fontSize: 11, color: '#4a4a6a' }}>{flows.length} flow{flows.length !== 1 ? 's' : ''} criado{flows.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={load}
          style={{ fontSize: 12, padding: '7px 12px', borderRadius: 6, background: 'transparent', border: '1px solid #2d2d3e', color: '#6b6b8a', cursor: 'pointer' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#474760'; e.currentTarget.style.color = '#94a3b8'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#2d2d3e'; e.currentTarget.style.color = '#6b6b8a'; }}
        >
          ↺
        </button>
        <button
          onClick={handleNew} disabled={creating}
          style={{ fontSize: 12, padding: '7px 16px', borderRadius: 6, background: '#7c3aed', border: 'none', color: '#fff', cursor: 'pointer', fontWeight: 600, opacity: creating ? 0.7 : 1 }}
          onMouseEnter={e => !creating && (e.currentTarget.style.background = '#6d28d9')}
          onMouseLeave={e => (e.currentTarget.style.background = '#7c3aed')}
        >
          {creating ? 'Criando…' : '+ Novo Flow'}
        </button>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
        {loading ? (
          <p style={{ color: '#4a4a6a', fontSize: 13 }}>Carregando…</p>
        ) : flows.length === 0 ? (
          <div style={{ textAlign: 'center', paddingTop: 48 }}>
            <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.15 }}>⚡</div>
            <p style={{ color: '#4a4a6a', fontSize: 13, margin: 0 }}>Nenhum flow criado ainda.</p>
            <p style={{ color: '#3a3a5a', fontSize: 11, margin: '4px 0 0' }}>Clique em "+ Novo Flow" para começar.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxWidth: 720 }}>
            {flows.map(flow => (
              <FlowCard key={flow.id} flow={flow} onOpen={onOpenFlow} onDelete={load} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
