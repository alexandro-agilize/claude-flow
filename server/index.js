const express = require('express');
const path = require('path');
const fs = require('fs');
const { runFlow } = require('../engine/runner');
const { enqueue, size } = require('../engine/queue');
const { listFlows, getFlow, createFlow, updateFlow, deleteFlow } = require('../db/flows');
const { createExecution, finishExecution, failExecution, logNode, listExecutions, getExecution } = require('../db/executions');

const app = express();
const PORT = process.env.PORT || 3000;
const FRONTEND_DIST = path.join(__dirname, '..', 'frontend', 'dist');

app.use(express.json());

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

if (fs.existsSync(FRONTEND_DIST)) {
  app.use(express.static(FRONTEND_DIST));
}

app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    message: 'claude-flow está rodando',
    endpoints: {
      flows: 'GET /flows',
      flow: 'GET /flows/:id',
      createFlow: 'POST /flows',
      updateFlow: 'PUT /flows/:id',
      run: 'POST /run/:flowId',
      webhook: 'POST /webhook/:flowId',
      executions: 'GET /executions',
      queue: 'GET /queue/:name',
    },
  });
});

// ─── Flows CRUD ─────────────────────────────────────────────────────────────

app.get('/flows', async (req, res) => {
  try {
    res.json(await listFlows());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/flows', async (req, res) => {
  try {
    const data = req.body;
    if (!data.id) return res.status(400).json({ error: 'Campo "id" obrigatório' });
    if (!data.nodes) return res.status(400).json({ error: 'Campo "nodes" obrigatório' });
    res.status(201).json(await createFlow(data));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/flows/:id', async (req, res) => {
  try {
    const flow = await getFlow(req.params.id);
    if (!flow) return res.status(404).json({ error: `Flow "${req.params.id}" não encontrado` });
    res.json(flow);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/flows/:id', async (req, res) => {
  try {
    res.json(await updateFlow(req.params.id, req.body));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/flows/:id', async (req, res) => {
  try {
    await deleteFlow(req.params.id);
    res.json({ deleted: true, id: req.params.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Execuções ───────────────────────────────────────────────────────────────

app.get('/executions', async (req, res) => {
  try {
    res.json(await listExecutions(req.query.flowId));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/executions/:id', async (req, res) => {
  try {
    const execution = await getExecution(req.params.id);
    if (!execution) return res.status(404).json({ error: 'Execução não encontrada' });
    res.json(execution);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/flows/:id/executions', async (req, res) => {
  try {
    res.json(await listExecutions(req.params.id));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Webhook (assíncrono — coloca na fila) ──────────────────────────────────
app.post('/webhook/:flowId', async (req, res) => {
  const { flowId } = req.params;
  const input = {
    body: req.body,
    query: req.query,
    headers: req.headers,
    method: req.method,
    timestamp: new Date().toISOString(),
  };

  let executionId;
  try {
    const execution = await createExecution(flowId, input, 'pending');
    executionId = execution.id;
  } catch (err) {
    console.warn('[DB] Falha ao registrar execução:', err.message);
  }

  enqueue('flow-executions', { flowId, input, executionId });
  res.json({ queued: true, flowId, executionId, message: 'Job adicionado à fila' });
});

// ─── Run direto (síncrono) ──────────────────────────────────────────────────
app.post('/run/:flowId', async (req, res) => {
  const { flowId } = req.params;

  const flow = await getFlow(flowId).catch(() => null);
  if (!flow) return res.status(404).json({ error: `Flow "${flowId}" não encontrado` });

  let execution;
  try {
    execution = await createExecution(flowId, req.body || {});
  } catch (err) {
    console.warn('[DB] Falha ao registrar execução:', err.message);
  }

  const hooks = execution ? {
    onNodeComplete: (nodeId, nodeType, info) =>
      logNode(execution.id, nodeId, nodeType, info),
  } : {};

  try {
    const result = await runFlow(flow, req.body || {}, null, hooks);
    if (execution) await finishExecution(execution.id, result).catch(() => {});
    res.json({ success: true, executionId: execution?.id, result });
  } catch (err) {
    if (execution) await failExecution(execution.id, err).catch(() => {});
    res.status(500).json({ error: err.message, executionId: execution?.id });
  }
});

// ─── Status da fila ─────────────────────────────────────────────────────────
app.get('/queue/:name', (req, res) => {
  const count = size(req.params.name);
  res.json({ queue: req.params.name, pending: count });
});

// ─── SPA fallback (deve ficar após todas as rotas de API) ───────────────────
if (fs.existsSync(FRONTEND_DIST)) {
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
