import { useState, useEffect } from 'react';
import { listCredentials, getCredentialById, createCredential, updateCredential, deleteCredential } from '../api';

const CRED_TYPES = [
  { id: 'smtp',       label: 'SMTP / Email',  icon: '✉', color: '#f43f5e' },
  { id: 'slack',      label: 'Slack',         icon: '◈', color: '#4ade80' },
  { id: 'postgres',   label: 'PostgreSQL',    icon: '🗄', color: '#38bdf8' },
  { id: 'anthropic',  label: 'Anthropic AI',  icon: '✦', color: '#a78bfa' },
];

const TYPE_FIELDS = {
  smtp: [
    { key: 'host', label: 'SMTP Host',  placeholder: 'smtp.gmail.com' },
    { key: 'port', label: 'Porta',      placeholder: '587' },
    { key: 'user', label: 'Usuário',    placeholder: 'user@gmail.com' },
    { key: 'pass', label: 'Senha',      placeholder: '••••••••', secret: true },
  ],
  slack: [
    { key: 'botToken', label: 'Bot Token', placeholder: 'xoxb-...', secret: true },
  ],
  postgres: [
    { key: 'url', label: 'Connection URL', placeholder: 'postgresql://user:pass@host:5432/db', secret: true },
  ],
  anthropic: [
    { key: 'apiKey', label: 'API Key', placeholder: 'sk-ant-...', secret: true },
  ],
};

const inputStyle = {
  width: '100%', fontSize: 12, padding: '7px 10px', borderRadius: 6,
  background: '#0d0d18', border: '1px solid #2d2d3e', color: '#e2e2f0',
  outline: 'none', boxSizing: 'border-box', fontFamily: 'monospace',
};

function Modal({ cred, onClose, onSaved }) {
  const isEdit = !!cred?.id;
  const [name, setName] = useState(cred?.name || '');
  const [type, setType] = useState(cred?.type || 'smtp');
  const [fields, setFields] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEdit && cred.id) {
      getCredentialById(cred.id).then(r => {
        try { setFields(JSON.parse(r.data.data) || {}); } catch (_) {}
      }).catch(() => {});
    }
  }, [isEdit, cred?.id]);

  const typeInfo = CRED_TYPES.find(t => t.id === type);

  const handleSave = async () => {
    if (!name.trim()) { setError('Nome é obrigatório'); return; }
    setSaving(true); setError('');
    try {
      if (isEdit) {
        await updateCredential(cred.id, { name: name.trim(), type, data: fields });
      } else {
        await createCredential({ name: name.trim(), type, data: fields });
      }
      onSaved();
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally { setSaving(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000000aa', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#1a1a24', border: '1px solid #2d2d3e', borderRadius: 12, width: 440, maxWidth: '90vw', boxShadow: '0 24px 64px rgba(0,0,0,0.6)' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #2d2d3e' }}>
          <h2 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#e2e2f0' }}>
            {isEdit ? 'Editar Credencial' : 'Nova Credencial'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#4a4a6a', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>✕</button>
        </div>

        {/* Form */}
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ fontSize: 10, fontWeight: 700, color: '#6b6b8a', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>Nome</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Slack Produção" style={inputStyle} />
          </div>

          <div>
            <label style={{ fontSize: 10, fontWeight: 700, color: '#6b6b8a', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>Tipo</label>
            <select
              value={type} onChange={e => { setType(e.target.value); setFields({}); }}
              disabled={isEdit}
              style={{ ...inputStyle, cursor: isEdit ? 'default' : 'pointer', opacity: isEdit ? 0.6 : 1 }}
            >
              {CRED_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
          </div>

          {(TYPE_FIELDS[type] || []).map(f => (
            <div key={f.key}>
              <label style={{ fontSize: 10, fontWeight: 700, color: '#6b6b8a', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>{f.label}</label>
              <input
                type={f.secret ? 'password' : 'text'}
                value={fields[f.key] || ''}
                onChange={e => setFields(prev => ({ ...prev, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                style={inputStyle}
                autoComplete="new-password"
              />
            </div>
          ))}

          {error && <p style={{ color: '#ef4444', fontSize: 12, margin: 0 }}>{error}</p>}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', padding: '12px 20px', borderTop: '1px solid #2d2d3e' }}>
          <button onClick={onClose} style={{ fontSize: 12, padding: '7px 16px', borderRadius: 6, background: 'transparent', border: '1px solid #2d2d3e', color: '#6b6b8a', cursor: 'pointer' }}>
            Cancelar
          </button>
          <button
            onClick={handleSave} disabled={saving}
            style={{ fontSize: 12, padding: '7px 16px', borderRadius: 6, background: '#7c3aed', border: 'none', color: '#fff', cursor: 'pointer', fontWeight: 600, opacity: saving ? 0.6 : 1 }}
          >
            {saving ? 'Salvando…' : isEdit ? 'Salvar' : 'Criar'}
          </button>
        </div>
      </div>
    </div>
  );
}

function CredCard({ cred, onEdit, onDelete }) {
  const typeInfo = CRED_TYPES.find(t => t.id === cred.type) || { label: cred.type, icon: '⚿', color: '#6b6b8a' };
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm(`Deletar a credencial "${cred.name}"?`)) return;
    setDeleting(true);
    try { await deleteCredential(cred.id); onDelete(); }
    catch (_) { setDeleting(false); }
  };

  return (
    <div style={{ background: '#1a1a24', border: '1px solid #2d2d3e', borderRadius: 10, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ width: 36, height: 36, borderRadius: 8, background: `${typeInfo.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: typeInfo.color, flexShrink: 0 }}>
        {typeInfo.icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#e2e2f0', truncate: true }}>{cred.name}</p>
        <p style={{ margin: 0, fontSize: 11, color: '#4a4a6a' }}>{typeInfo.label}</p>
      </div>
      <p style={{ margin: 0, fontSize: 10, color: '#3a3a5a' }}>
        {new Date(cred.createdAt).toLocaleDateString('pt-BR')}
      </p>
      <div style={{ display: 'flex', gap: 4 }}>
        <button
          onClick={() => onEdit(cred)}
          style={{ fontSize: 11, padding: '5px 10px', borderRadius: 6, background: 'transparent', border: '1px solid #2d2d3e', color: '#6b6b8a', cursor: 'pointer' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#474760'; e.currentTarget.style.color = '#94a3b8'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#2d2d3e'; e.currentTarget.style.color = '#6b6b8a'; }}
        >
          Editar
        </button>
        <button
          onClick={handleDelete} disabled={deleting}
          style={{ fontSize: 11, padding: '5px 10px', borderRadius: 6, background: 'transparent', border: '1px solid #2d2d3e', color: '#6b6b8a', cursor: 'pointer', opacity: deleting ? 0.5 : 1 }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#ef4444'; e.currentTarget.style.color = '#ef4444'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#2d2d3e'; e.currentTarget.style.color = '#6b6b8a'; }}
        >
          {deleting ? '…' : 'Deletar'}
        </button>
      </div>
    </div>
  );
}

export default function CredentialsPage() {
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);

  const load = async () => {
    setLoading(true);
    try { const { data } = await listCredentials(); setCredentials(data); }
    catch (_) {}
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const grouped = CRED_TYPES.map(t => ({
    ...t,
    items: credentials.filter(c => c.type === t.id),
  })).filter(g => g.items.length > 0);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#101014', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '16px 24px', borderBottom: '1px solid #2d2d3e', background: '#1a1a24', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#e2e2f0' }}>Credenciais</h1>
          <p style={{ margin: 0, fontSize: 11, color: '#4a4a6a' }}>Gerencie tokens e senhas para os nós de integração</p>
        </div>
        <button
          onClick={() => setModal({})}
          style={{ fontSize: 12, padding: '7px 16px', borderRadius: 6, background: '#7c3aed', border: 'none', color: '#fff', cursor: 'pointer', fontWeight: 600 }}
          onMouseEnter={e => e.currentTarget.style.background = '#6d28d9'}
          onMouseLeave={e => e.currentTarget.style.background = '#7c3aed'}
        >
          + Nova Credencial
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
        {loading ? (
          <p style={{ color: '#4a4a6a', fontSize: 13 }}>Carregando…</p>
        ) : credentials.length === 0 ? (
          <div style={{ textAlign: 'center', paddingTop: 48 }}>
            <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.15 }}>⚿</div>
            <p style={{ color: '#4a4a6a', fontSize: 13, margin: 0 }}>Nenhuma credencial salva.</p>
            <p style={{ color: '#3a3a5a', fontSize: 11, margin: '4px 0 0' }}>Crie uma para usar nos nós Email, Slack e Postgres.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 640 }}>
            {grouped.map(group => (
              <div key={group.id}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <span style={{ fontSize: 14, color: group.color }}>{group.icon}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#6b6b8a', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{group.label}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {group.items.map(cred => (
                    <CredCard key={cred.id} cred={cred} onEdit={c => setModal(c)} onDelete={load} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modal !== null && (
        <Modal cred={modal} onClose={() => setModal(null)} onSaved={() => { setModal(null); load(); }} />
      )}
    </div>
  );
}
