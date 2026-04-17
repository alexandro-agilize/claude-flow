import { useState, useEffect } from 'react';

const FIELDS = {
  webhook: [
    { key: 'method', label: 'Método HTTP', type: 'select', options: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], default: 'POST' },
  ],
  http: [
    { key: 'url',     label: 'URL',           type: 'text',     placeholder: 'https://api.exemplo.com/dados' },
    { key: 'method',  label: 'Método',         type: 'select',   options: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], default: 'GET' },
    { key: 'headers', label: 'Headers (JSON)', type: 'textarea', placeholder: '{"Authorization": "Bearer token"}' },
    { key: 'body',    label: 'Body (JSON)',     type: 'textarea', placeholder: '{"key": "value"}' },
  ],
  code: [
    { key: 'code', label: 'Código JS', type: 'code', placeholder: 'return { ...input, campo: "valor" };', help: '`input` = saída do nó anterior.' },
  ],
  if: [
    { key: 'condition', label: 'Condição JS', type: 'text', placeholder: 'input.status === 200', help: 'Retorna true/false. `input` = saída anterior.' },
  ],
  switch: [
    { key: 'value', label: 'Expressão de valor', type: 'text', placeholder: "input.tipo" },
    { key: 'cases', label: 'Cases (vírgula)', type: 'text', placeholder: 'caso1, caso2, caso3', help: 'Cada case vira uma saída do nó.' },
  ],
  wait: [
    { key: 'ms', label: 'Duração (ms)', type: 'number', placeholder: '1000', default: 1000 },
  ],
  claude: [
    { key: 'prompt',      label: 'Prompt',         type: 'code',     placeholder: 'Resuma o seguinte texto: {{input.texto}}', help: 'Use {{input.campo}} para interpolar dados.' },
    { key: 'model',       label: 'Modelo',          type: 'select',   options: ['claude-sonnet-4-6', 'claude-haiku-4-5-20251001', 'claude-opus-4-7'], default: 'claude-sonnet-4-6' },
    { key: 'maxTokens',   label: 'Max tokens',      type: 'number',   placeholder: '1024', default: 1024 },
    { key: 'outputField', label: 'Campo de saída',  type: 'text',     placeholder: 'resposta', help: 'Nome do campo no output.' },
  ],
  transform: [
    { key: 'expression', label: 'Expressão JMESPath', type: 'text', placeholder: 'data[*].name', help: 'Filtra/transforma dados com JMESPath.' },
  ],
  merge: [
    { key: 'strategy', label: 'Estratégia', type: 'select', options: ['merge', 'concat', 'first'], default: 'merge' },
  ],
  loop: [
    { key: 'arrayPath', label: 'Caminho do array', type: 'text', placeholder: 'input.items', help: 'Expressão JS que retorna o array a iterar.' },
    { key: 'itemVar',   label: 'Variável do item',  type: 'text', placeholder: 'item', default: 'item' },
  ],
  'set-variable': [
    { key: 'name',  label: 'Nome da variável', type: 'text', placeholder: 'minhaVar' },
    { key: 'value', label: 'Valor (JS)',        type: 'text', placeholder: 'input.resultado', help: 'Expressão JS avaliada no contexto do fluxo.' },
  ],
  log: [
    { key: 'message', label: 'Mensagem', type: 'text', placeholder: 'Etapa concluída: {{input.id}}', help: 'Suporta interpolação com {{campo}}.' },
    { key: 'level',   label: 'Nível',    type: 'select', options: ['info', 'warn', 'error'], default: 'info' },
  ],
  email: [
    { key: 'to',      label: 'Para (to)',    type: 'text',     placeholder: 'destino@exemplo.com', help: 'Suporta {{input.campo}}.' },
    { key: 'subject', label: 'Assunto',      type: 'text',     placeholder: 'Olá, {{input.nome}}!' },
    { key: 'body',    label: 'Corpo',        type: 'textarea', placeholder: 'Conteúdo do email...', help: 'Suporta interpolação com {{campo}}.' },
    { key: 'from',    label: 'Remetente',    type: 'text',     placeholder: 'noreply@exemplo.com', help: 'Deixe em branco para usar SMTP_USER.' },
    { key: 'html',    label: 'HTML?',        type: 'select',   options: ['false', 'true'], default: 'false' },
  ],
  slack: [
    { key: 'channel', label: 'Canal / User', type: 'text',     placeholder: '#geral ou @usuario', help: 'ID ou nome do canal/usuário.' },
    { key: 'text',    label: 'Mensagem',     type: 'textarea', placeholder: 'Workflow concluído: {{input.id}}', help: 'Suporta interpolação com {{campo}}.' },
  ],
  postgres: [
    { key: 'url',    label: 'Connection URL', type: 'text',     placeholder: 'postgresql://user:pass@host/db', help: 'Deixe em branco para usar POSTGRES_URL.' },
    { key: 'query',  label: 'Query SQL',      type: 'code',     placeholder: 'SELECT * FROM users WHERE id = $1', help: 'Use $1, $2... para params posicionais.' },
    { key: 'params', label: 'Params (JSON)',   type: 'textarea', placeholder: '["{{input.userId}}"]', help: 'Array JSON com os valores dos parâmetros.' },
  ],
  'sub-flow': [
    { key: 'flowId',      label: 'ID do Flow',       type: 'text',   placeholder: 'meu-outro-flow' },
    { key: 'passInput',   label: 'Passar input?',    type: 'select', options: ['true', 'false'], default: 'true', help: 'Repassa o input atual para o sub-flow.' },
    { key: 'outputField', label: 'Campo de saída',   type: 'text',   placeholder: 'subflow', help: 'Nome do campo no output onde o resultado fica.' },
  ],
};

const inputClass = `
  w-full text-xs border rounded-md px-2.5 py-2 font-mono
  focus:outline-none focus:ring-1 focus:ring-violet-500
  transition-colors resize-y
`.trim();

const inputStyle = {
  background: '#0f172a',
  border: '1px solid #334155',
  color: '#e2e8f0',
};

export default function ConfigPanel({ node, onDataChange, onDelete }) {
  const [label, setLabel] = useState('');
  const [config, setConfig] = useState({});

  useEffect(() => {
    if (node) {
      setLabel(node.data.label);
      const cfg = { ...node.data.config };
      if (Array.isArray(cfg.cases)) cfg.cases = cfg.cases.join(', ');
      setConfig(cfg);
    }
  }, [node?.id]);

  if (!node) {
    return (
      <aside className="w-64 flex items-center justify-center shrink-0"
        style={{ background: '#0f172a', borderLeft: '1px solid #1e293b' }}>
        <div className="text-center px-6">
          <div className="text-2xl mb-2 opacity-20">⚙</div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Clique em um nó para editar
          </p>
        </div>
      </aside>
    );
  }

  const fields = FIELDS[node.data.nodeType] || [];

  const handleApply = () => {
    const processed = { ...config };
    if (node.data.nodeType === 'switch' && typeof processed.cases === 'string') {
      processed.cases = processed.cases.split(',').map((s) => s.trim()).filter(Boolean);
    }
    if (['wait', 'claude'].includes(node.data.nodeType) && processed.ms !== undefined) {
      processed.ms = Number(processed.ms);
    }
    if (node.data.nodeType === 'claude' && processed.maxTokens !== undefined) {
      processed.maxTokens = Number(processed.maxTokens);
    }
    onDataChange(node.id, { label, nodeType: node.data.nodeType, config: processed });
  };

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') handleApply();
  };

  return (
    <aside className="w-64 flex flex-col overflow-hidden shrink-0"
      style={{ background: '#0f172a', borderLeft: '1px solid #1e293b' }}>
      <div className="px-4 py-3 flex items-center justify-between shrink-0"
        style={{ borderBottom: '1px solid #1e293b' }}>
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Configurar nó</p>
        <button
          onClick={() => onDelete(node.id)}
          className="text-slate-600 hover:text-red-400 transition-colors text-xs leading-none px-1"
          title="Deletar nó"
        >
          ✕
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3" onKeyDown={handleKeyDown}>
        <div>
          <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Nome</label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className={inputClass}
            style={inputStyle}
          />
        </div>

        {fields.map((field) => {
          const value = config[field.key] ?? field.default ?? '';
          return (
            <div key={field.key}>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                {field.label}
              </label>
              {field.help && (
                <p className="text-[10px] text-slate-600 mb-1.5 leading-snug">{field.help}</p>
              )}

              {field.type === 'select' && (
                <select
                  value={value}
                  onChange={(e) => setConfig((c) => ({ ...c, [field.key]: e.target.value }))}
                  className={inputClass}
                  style={{ ...inputStyle, cursor: 'pointer' }}
                >
                  {field.options.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              )}

              {(field.type === 'text' || field.type === 'number') && (
                <input
                  type={field.type}
                  value={value}
                  placeholder={field.placeholder}
                  onChange={(e) => setConfig((c) => ({ ...c, [field.key]: e.target.value }))}
                  className={inputClass}
                  style={inputStyle}
                />
              )}

              {(field.type === 'textarea' || field.type === 'code') && (
                <textarea
                  value={value}
                  placeholder={field.placeholder}
                  rows={field.type === 'code' ? 7 : 3}
                  onChange={(e) => setConfig((c) => ({ ...c, [field.key]: e.target.value }))}
                  className={inputClass}
                  style={inputStyle}
                />
              )}
            </div>
          );
        })}
      </div>

      <div className="p-3 shrink-0" style={{ borderTop: '1px solid #1e293b' }}>
        <button
          onClick={handleApply}
          className="w-full text-white text-xs font-semibold py-2 rounded-lg transition-colors"
          style={{ background: '#7c3aed' }}
          onMouseEnter={e => e.currentTarget.style.background = '#6d28d9'}
          onMouseLeave={e => e.currentTarget.style.background = '#7c3aed'}
        >
          Aplicar <span className="text-purple-300 ml-1 font-normal">Ctrl+Enter</span>
        </button>
      </div>
    </aside>
  );
}
