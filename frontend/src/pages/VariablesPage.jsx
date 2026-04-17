import { useState, useEffect } from 'react';
import { listVariables, createVariable, updateVariable, deleteVariable } from '../api';

const inputStyle = {
  background: '#0d0d1e', border: '1px solid #1e293b', color: '#e2e8f0',
  borderRadius: 6, padding: '7px 10px', fontSize: 12, fontFamily: 'monospace',
  outline: 'none', width: '100%', boxSizing: 'border-box',
};

export default function VariablesPage() {
  const [vars, setVars] = useState([]);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ key: '', value: '' });
  const [showVal, setShowVal] = useState({});
  const [adding, setAdding] = useState(false);
  const [toast, setToast] = useState(null);

  const reload = () => listVariables().then(r => setVars(r.data)).catch(() => {});

  useEffect(() => { reload(); }, []);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const startEdit = (v) => {
    setEditId(v.id);
    setForm({ key: v.key, value: v.value });
    setAdding(false);
  };

  const cancelEdit = () => { setEditId(null); setAdding(false); setForm({ key: '', value: '' }); };

  const handleSave = async () => {
    if (!form.key.trim()) return;
    try {
      if (editId) {
        await updateVariable(editId, { key: form.key.trim(), value: form.value });
        showToast('Variável atualizada');
      } else {
        await createVariable({ key: form.key.trim(), value: form.value });
        showToast('Variável criada');
      }
      cancelEdit();
      reload();
    } catch (err) {
      showToast(err.response?.data?.error || 'Erro ao salvar', 'error');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteVariable(id);
      showToast('Variável removida');
      reload();
    } catch {
      showToast('Erro ao remover', 'error');
    }
  };

  const toggleShow = (id) => setShowVal(p => ({ ...p, [id]: !p[id] }));

  return (
    <div style={{ flex: 1, background: '#09091a', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '16px 24px', borderBottom: '1px solid #1a1a2e', background: '#07070f', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#e2e8f0' }}>Variáveis</h1>
          <p style={{ margin: '2px 0 0', fontSize: 11, color: '#334155' }}>
            Armazenadas no banco — use <code style={{ background: '#0f172a', padding: '0 4px', borderRadius: 3, color: '#86efac' }}>{'{{env.CHAVE}}'}</code> em qualquer campo de configuração
          </p>
        </div>
        <div style={{ flex: 1 }} />
        <button
          onClick={() => { setAdding(true); setEditId(null); setForm({ key: '', value: '' }); }}
          style={{
            background: '#7c3aed', border: 'none', color: '#fff',
            padding: '7px 16px', borderRadius: 7, fontSize: 12, fontWeight: 700,
            cursor: 'pointer', transition: 'opacity 0.12s',
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          + Nova variável
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>

        {/* Add form */}
        {adding && (
          <div style={{ background: '#0f0f1e', border: '1px solid #7c3aed44', borderRadius: 8, padding: '14px 16px', marginBottom: 16, display: 'flex', gap: 10, alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 5 }}>Chave</label>
              <input
                autoFocus value={form.key}
                onChange={e => setForm(f => ({ ...f, key: e.target.value }))}
                placeholder="MINHA_CHAVE"
                style={inputStyle}
                onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') cancelEdit(); }}
              />
            </div>
            <div style={{ flex: 2 }}>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 5 }}>Valor</label>
              <input
                value={form.value}
                onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
                placeholder="valor secreto ou URL"
                style={inputStyle}
                onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') cancelEdit(); }}
              />
            </div>
            <button onClick={handleSave} style={{ background: '#7c3aed', border: 'none', color: '#fff', padding: '7px 14px', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>
              Salvar
            </button>
            <button onClick={cancelEdit} style={{ background: 'transparent', border: '1px solid #1e293b', color: '#475569', padding: '7px 12px', borderRadius: 6, fontSize: 12, cursor: 'pointer', flexShrink: 0 }}>
              Cancelar
            </button>
          </div>
        )}

        {/* Table */}
        {vars.length === 0 && !adding ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 200, gap: 8 }}>
            <span style={{ fontSize: 32, opacity: 0.08 }}>$</span>
            <p style={{ color: '#1e293b', fontSize: 12, margin: 0 }}>Nenhuma variável cadastrada</p>
          </div>
        ) : (
          <div style={{ background: '#0d0d1e', border: '1px solid #1a1a2e', borderRadius: 8, overflow: 'hidden' }}>
            {/* Table header */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr auto', padding: '8px 14px', background: '#07070f', borderBottom: '1px solid #1a1a2e' }}>
              {['Chave', 'Valor', ''].map(h => (
                <span key={h} style={{ fontSize: 10, fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.09em' }}>{h}</span>
              ))}
            </div>

            {vars.map((v, i) => (
              <div key={v.id}>
                {editId === v.id ? (
                  <div style={{ display: 'flex', gap: 10, padding: '10px 14px', background: '#0f0f1e', alignItems: 'center', borderBottom: i < vars.length - 1 ? '1px solid #1a1a2e' : 'none' }}>
                    <input
                      autoFocus value={form.key}
                      onChange={e => setForm(f => ({ ...f, key: e.target.value }))}
                      style={{ ...inputStyle, flex: 1 }}
                      onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') cancelEdit(); }}
                    />
                    <input
                      value={form.value}
                      onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
                      style={{ ...inputStyle, flex: 2 }}
                      onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') cancelEdit(); }}
                    />
                    <button onClick={handleSave} style={{ background: '#7c3aed', border: 'none', color: '#fff', padding: '5px 12px', borderRadius: 5, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>OK</button>
                    <button onClick={cancelEdit} style={{ background: 'transparent', border: '1px solid #1e293b', color: '#475569', padding: '5px 10px', borderRadius: 5, fontSize: 11, cursor: 'pointer' }}>✕</button>
                  </div>
                ) : (
                  <div style={{
                    display: 'grid', gridTemplateColumns: '1fr 2fr auto',
                    padding: '10px 14px', alignItems: 'center', gap: 12,
                    borderBottom: i < vars.length - 1 ? '1px solid #1a1a2e' : 'none',
                    transition: 'background 0.08s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = '#0f0f1e'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <code style={{ fontSize: 12, color: '#93c5fd', fontFamily: 'monospace' }}>{v.key}</code>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <code style={{ fontSize: 11, color: '#475569', fontFamily: 'monospace', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {showVal[v.id] ? v.value : '••••••••••••'}
                      </code>
                      <button onClick={() => toggleShow(v.id)} style={{ background: 'transparent', border: 'none', color: '#334155', cursor: 'pointer', fontSize: 11, padding: '0 4px', flexShrink: 0 }}>
                        {showVal[v.id] ? '🙈' : '👁'}
                      </button>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => startEdit(v)} style={{ background: 'transparent', border: '1px solid #1e293b', color: '#64748b', cursor: 'pointer', padding: '3px 10px', borderRadius: 5, fontSize: 11 }}
                        onMouseEnter={e => { e.currentTarget.style.color = '#e2e8f0'; e.currentTarget.style.borderColor = '#334155'; }}
                        onMouseLeave={e => { e.currentTarget.style.color = '#64748b'; e.currentTarget.style.borderColor = '#1e293b'; }}>
                        Editar
                      </button>
                      <button onClick={() => handleDelete(v.id)} style={{ background: 'transparent', border: '1px solid #1e293b', color: '#64748b', cursor: 'pointer', padding: '3px 10px', borderRadius: 5, fontSize: 11 }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#3f0808'; e.currentTarget.style.color = '#f87171'; e.currentTarget.style.borderColor = '#6b1010'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748b'; e.currentTarget.style.borderColor = '#1e293b'; }}>
                        ✕
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {toast && (
        <div style={{ position: 'fixed', bottom: 16, right: 16, background: toast.type === 'error' ? '#dc2626' : '#059669', color: '#fff', padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600, zIndex: 50, boxShadow: '0 4px 16px rgba(0,0,0,0.4)' }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
