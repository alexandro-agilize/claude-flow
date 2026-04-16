const express = require('express');
const fs = require('fs');
const path = require('path');
const { runFlow } = require('../engine/runner');
const { enqueue, size } = require('../engine/queue');

const app = express();
const PORT = process.env.PORT || 3000;
const FLOWS_DIR = path.join(__dirname, '..', 'flows');
const FRONTEND_DIST = path.join(__dirname, '..', 'frontend', 'dist');

app.use(express.json());

// CORS — permite que o Vite dev server (porta 5173) acesse a API
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// ─── Status ────────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    message: 'claude-flow está rodando',
    endpoints: {
      flows: 'GET /flows',
      flow: 'GET /flows/:id',
      createFlow: 'POST /flows',
      updateFlow: 'PUT /flows/:id',
      webhook: 'POST /webhook/:flowId',
      run: 'POST /run/:flowId',
      queue: 'GET /queue/:name',
    },
  });
});

// ─── Lista flows ────────────────────────────────────────────────────────────
app.get('/flows', (req, res) => {
  if (!fs.existsSync(FLOWS_DIR)) return res.json([]);
  const files = fs.readdirSync(FLOWS_DIR).filter((f) => f.endsWith('.json'));
  const flows = files.map((f) => {
    try {
      const data = JSON.parse(fs.readFileSync(path.join(FLOWS_DIR, f), 'utf8'));
      return { id: data.id || f.replace('.json', ''), name: data.name || f.replace('.json', '') };
    } catch {
      return { id: f.replace('.json', ''), name: f.replace('.json', '') };
    }
  });
  res.json(flows);
});

// ─── Lê flow individual ─────────────────────────────────────────────────────
app.get('/flows/:flowId', (req, res) => {
  const flowFile = path.join(FLOWS_DIR, `${req.params.flowId}.json`);
  if (!fs.existsSync(flowFile)) {
    return res.status(404).json({ error: `Flow "${req.params.flowId}" não encontrado` });
  }
  try {
    res.json(JSON.parse(fs.readFileSync(flowFile, 'utf8')));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Cria novo flow ─────────────────────────────────────────────────────────
app.post('/flows', (req, res) => {
  const flow = req.body;
  if (!flow || !flow.id) return res.status(400).json({ error: 'Flow precisa ter um campo "id"' });

  if (!fs.existsSync(FLOWS_DIR)) fs.mkdirSync(FLOWS_DIR, { recursive: true });
  const flowFile = path.join(FLOWS_DIR, `${flow.id}.json`);

  if (fs.existsSync(flowFile)) {
    return res.status(409).json({ error: `Flow "${flow.id}" já existe. Use PUT para atualizar.` });
  }

  fs.writeFileSync(flowFile, JSON.stringify(flow, null, 2), 'utf8');
  res.status(201).json({ created: true, id: flow.id });
});

// ─── Atualiza flow ──────────────────────────────────────────────────────────
app.put('/flows/:flowId', (req, res) => {
  const { flowId } = req.params;
  const flow = req.body;
  if (!flow) return res.status(400).json({ error: 'Body obrigatório' });

  if (!fs.existsSync(FLOWS_DIR)) fs.mkdirSync(FLOWS_DIR, { recursive: true });
  const flowFile = path.join(FLOWS_DIR, `${flowId}.json`);

  flow.id = flowId;
  fs.writeFileSync(flowFile, JSON.stringify(flow, null, 2), 'utf8');
  res.json({ updated: true, id: flowId });
});

// ─── Webhook (assíncrono — coloca na fila) ──────────────────────────────────
app.post('/webhook/:flowId', (req, res) => {
  const { flowId } = req.params;
  enqueue('flow-executions', {
    flowId,
    input: {
      body: req.body,
      query: req.query,
      headers: req.headers,
      method: req.method,
      timestamp: new Date().toISOString(),
    },
  });
  res.json({ queued: true, flowId, message: 'Job adicionado à fila' });
});

// ─── Run direto (síncrono) ──────────────────────────────────────────────────
app.post('/run/:flowId', async (req, res) => {
  const { flowId } = req.params;
  const flowFile = path.join(FLOWS_DIR, `${flowId}.json`);

  if (!fs.existsSync(flowFile)) {
    return res.status(404).json({ error: `Flow "${flowId}" não encontrado` });
  }

  try {
    const flow = JSON.parse(fs.readFileSync(flowFile, 'utf8'));
    const result = await runFlow(flow, req.body || {});
    res.json({ success: true, result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Status da fila ─────────────────────────────────────────────────────────
app.get('/queue/:name', (req, res) => {
  const count = size(req.params.name);
  res.json({ queue: req.params.name, pending: count });
});

// ─── Frontend estático (produção) ───────────────────────────────────────────
if (fs.existsSync(FRONTEND_DIST)) {
  app.use(express.static(FRONTEND_DIST));
  app.get('*', (req, res) => {
    res.sendFile(path.join(FRONTEND_DIST, 'index.html'));
  });
}

// ─── Start ──────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n====================================`);
  console.log(` claude-flow server rodando`);
  console.log(` http://localhost:${PORT}`);
  console.log(`====================================\n`);
});
