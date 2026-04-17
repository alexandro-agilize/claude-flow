export const CRED_NODES = { email: 'smtp', slack: 'slack', postgres: 'postgres' };

export const FIELDS = {
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
    { key: 'value', label: 'Expressão de valor', type: 'text', placeholder: 'input.tipo' },
    { key: 'cases', label: 'Cases (vírgula)',    type: 'text', placeholder: 'caso1, caso2, caso3', help: 'Cada case vira uma saída do nó.' },
  ],
  wait: [
    { key: 'ms', label: 'Duração (ms)', type: 'number', placeholder: '1000', default: 1000 },
  ],
  claude: [
    { key: 'prompt',      label: 'Prompt',        type: 'code',   placeholder: 'Resuma o seguinte texto: {{input.texto}}', help: 'Use {{input.campo}} para interpolar dados.' },
    { key: 'model',       label: 'Modelo',         type: 'select', options: ['claude-sonnet-4-6', 'claude-haiku-4-5-20251001', 'claude-opus-4-7'], default: 'claude-sonnet-4-6' },
    { key: 'maxTokens',   label: 'Max tokens',     type: 'number', placeholder: '1024', default: 1024 },
    { key: 'outputField', label: 'Campo de saída', type: 'text',   placeholder: 'resposta', help: 'Nome do campo no output.' },
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
    { key: 'message', label: 'Mensagem', type: 'text',   placeholder: 'Etapa concluída: {{input.id}}', help: 'Suporta interpolação com {{campo}}.' },
    { key: 'level',   label: 'Nível',    type: 'select', options: ['info', 'warn', 'error'], default: 'info' },
  ],
  email: [
    { key: 'credentialId', label: 'Credencial SMTP',  type: 'credential', credType: 'smtp', help: 'Opcional — ou preencha SMTP_* nas variáveis de ambiente.' },
    { key: 'to',      label: 'Para (to)',   type: 'text',     placeholder: 'destino@exemplo.com', help: 'Suporta {{input.campo}}.' },
    { key: 'subject', label: 'Assunto',     type: 'text',     placeholder: 'Olá, {{input.nome}}!' },
    { key: 'body',    label: 'Corpo',       type: 'textarea', placeholder: 'Conteúdo do email...', help: 'Suporta interpolação com {{campo}}.' },
    { key: 'from',    label: 'Remetente',   type: 'text',     placeholder: 'noreply@exemplo.com', help: 'Deixe em branco para usar SMTP_USER.' },
    { key: 'html',    label: 'HTML?',       type: 'select',   options: ['false', 'true'], default: 'false' },
  ],
  slack: [
    { key: 'credentialId', label: 'Credencial Slack', type: 'credential', credType: 'slack', help: 'Opcional — ou use SLACK_BOT_TOKEN no ambiente.' },
    { key: 'channel', label: 'Canal / User', type: 'text',     placeholder: '#geral ou @usuario' },
    { key: 'text',    label: 'Mensagem',     type: 'textarea', placeholder: 'Workflow concluído: {{input.id}}', help: 'Suporta interpolação com {{campo}}.' },
  ],
  postgres: [
    { key: 'credentialId', label: 'Credencial Postgres', type: 'credential', credType: 'postgres', help: 'Opcional — ou preencha url abaixo / POSTGRES_URL.' },
    { key: 'url',    label: 'Connection URL', type: 'text',     placeholder: 'postgresql://user:pass@host/db' },
    { key: 'query',  label: 'Query SQL',      type: 'code',     placeholder: 'SELECT * FROM users WHERE id = $1', help: 'Use $1, $2... para params posicionais.' },
    { key: 'params', label: 'Params (JSON)',  type: 'textarea', placeholder: '["{{input.userId}}"]', help: 'Array JSON com os valores dos parâmetros.' },
  ],
  'sub-flow': [
    { key: 'flowId',      label: 'ID do Flow',     type: 'text',   placeholder: 'meu-outro-flow' },
    { key: 'passInput',   label: 'Passar input?',  type: 'select', options: ['true', 'false'], default: 'true', help: 'Repassa o input atual para o sub-flow.' },
    { key: 'outputField', label: 'Campo de saída', type: 'text',   placeholder: 'subflow', help: 'Nome do campo no output onde o resultado fica.' },
  ],
};
