# claude-flow — Sistema de Automação estilo n8n

## Visão Geral

Sistema de automação de workflows visual, semelhante ao n8n, construído com Node.js.
Permite criar fluxos com nós conectados (HTTP, webhook, código JS, condicionais, etc.)
e executá-los via API REST ou agendamento (cron).

## Arquitetura

```
claude-flow/
├── server/           # API HTTP (Express) — porta 3000
├── engine/
│   ├── runner.js     # Motor de execução: percorre nodes+edges
│   ├── worker.js     # Processa fila de jobs em background
│   ├── queue.js      # Fila em memória (futuramente: Redis/BullMQ)
│   └── nodes/        # Tipos de nó disponíveis
│       ├── http.js       — requisição HTTP externa
│       ├── webhook.js    — ponto de entrada via webhook
│       ├── code.js       — executa JS customizado (input → output)
│       ├── if.js         — condicional true/false
│       ├── switch.js     — múltiplos caminhos por valor
│       └── wait.js       — delay em ms
├── flows/            # Flows salvos em JSON
├── frontend/         # (pendente) Editor visual React
├── db/               # (pendente) Persistência SQLite/PostgreSQL
└── scripts/          # Utilitários de setup
```

## Como flows funcionam

Um flow é um JSON com `nodes` (nós) e `edges` (conexões):

```json
{
  "id": "meu-flow",
  "nodes": [
    { "id": "inicio", "type": "webhook", "config": {} },
    { "id": "processa", "type": "code", "config": { "code": "return { ok: true };" } }
  ],
  "edges": [
    { "from": "inicio", "to": "processa" }
  ]
}
```

O runner percorre `nodes` seguindo `edges`, passando o output de cada nó como input do próximo.

## API REST

| Método | Endpoint            | Descrição                        |
|--------|---------------------|----------------------------------|
| GET    | /                   | Status do servidor               |
| GET    | /flows              | Lista todos os flows             |
| POST   | /run/:flowId        | Executa flow de forma síncrona   |
| POST   | /webhook/:flowId    | Dispara flow via webhook (fila)  |
| GET    | /queue/:name        | Quantos jobs na fila             |

## Rodando o projeto

```bash
npm start          # Sobe o servidor (porta 3000)
npm run worker     # Sobe worker para processar filas
```

## Tipos de nó existentes

| Tipo     | O que faz                                      |
|----------|------------------------------------------------|
| webhook  | Ponto de entrada — recebe dados externos       |
| http     | Faz requisição HTTP (GET/POST/etc)             |
| code     | Executa JS: `return { ...input, novo: valor }` |
| if       | Avalia condição JS → branch `true` ou `false`  |
| switch   | Avalia expressão JS → branch pelo valor        |
| wait     | Aguarda N milissegundos                        |

---

## Roadmap — Módulos a construir

### Módulo 1: Frontend Visual (branch: feature/frontend)
Editor drag-and-drop com React + React Flow.
- Tela principal com canvas de fluxo
- Painel lateral de tipos de nó
- Formulário de configuração ao clicar no nó
- Botão "Executar" que chama `POST /run/:flowId`
- Salvar/carregar flows via API

**Stack:** React, React Flow (reactflow.dev), Tailwind CSS

### Módulo 2: Novos Nós + Engine (branch: feature/engine)
Expandir os tipos de nó disponíveis:
- `claude` — chama Claude API (anthropic SDK) e retorna a resposta
- `transform` — transforma dados com JMESPath ou lodash
- `merge` — combina outputs de múltiplos nós
- `loop` — itera sobre array, executa sub-fluxo para cada item
- `set-variable` — armazena valor em contexto global do fluxo
- `log` — persiste log da execução no banco
Melhorar o runner para suportar execução paralela de branches.

### Módulo 3: Banco de dados + Persistência (branch: feature/database)
Substituir armazenamento em memória/arquivo por banco real:
- SQLite com Prisma ORM (sem precisar de servidor externo)
- Tabelas: `flows`, `executions`, `execution_logs`, `schedules`
- API para CRUD de flows (atualmente só lê de arquivo)
- Logs de execução com status, timestamps, input/output por nó

### Módulo 4: Integrações + Cron (branch: feature/integrations)
- `email` — envio via SMTP (nodemailer)
- `slack` — mensagem para canal Slack
- `postgres` — query em banco externo
- `cron` — agendamento de flows com expressão cron (node-cron)
- `sub-flow` — executa outro flow como sub-rotina

---

## Instruções para agentes autônomos

Cada branch/worktree é independente. Ao iniciar trabalho em um módulo:

1. Leia este CLAUDE.md para entender o contexto
2. Verifique os arquivos existentes no módulo antes de criar novos
3. Mantenha compatibilidade com o runner (`engine/runner.js`) existente
4. Todo novo tipo de nó deve exportar `module.exports = { run }` com assinatura `async run(config, input)`
5. Testes: crie um flow JSON em `flows/` para validar o nó manualmente

### Para o agente do Frontend
- A API roda em `http://localhost:3000`
- Consulte os endpoints na tabela acima
- O frontend fica em `frontend/` e pode ser servido pelo próprio Express em produção

### Para o agente do Engine
- Não quebre a assinatura do `runFlow(flow, input)` em `runner.js`
- Novos nós ficam em `engine/nodes/<tipo>.js`

### Para o agente do Banco
- Use Prisma com SQLite para facilitar o setup local
- Mantenha retrocompatibilidade: flows em arquivo JSON devem continuar funcionando

### Para o agente de Integrações
- Crie um arquivo `engine/nodes/<nome>.js` por integração
- Segredos (API keys) devem vir de `process.env`, nunca hardcodados
- Documente as variáveis de ambiente necessárias no `.env.example`
