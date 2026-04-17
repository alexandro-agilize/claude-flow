const express = require('express');
const path = require('path');
const fs = require('fs');
const { runFlow } = require('../engine/runner');
const { enqueue, size } = require('../engine/queue');
const { listFlows, getFlow, createFlow, updateFlow, deleteFlow } = require('../db/flows');
const { createExecution, finishExecution, failExecution, logNode, listExecutions, getExecution } = require('../db/executions');
const { listCredentials, getCredential, createCredential, updateCredential, deleteCredential } = require('../db/credentials');
const { listVariables, createVariable, updateVariable, deleteVariable } = require('../db/variables');
const scheduler = require('../engine/scheduler');
const { v4: uuidv4 } = require('uuid');

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

// Helper: carrega variáveis do banco para passar ao runner
async function loadEnvVars() {
  try {
    const vars = await listVariables();
    return Object.fromEntries(vars.map(v => [v.key, v.value]));
  } catch { return {}; }
}

// ─── Execute step (roda o flow até um nó específico, sem salvar) ─────────────
app.post('/run/step', async (req, res) => {
  const { flow, nodeId, input } = req.body;
  if (!flow)   return res.status(400).json({ error: 'Campo "flow" obrigatório' });
  if (!nodeId) return res.status(400).json({ error: 'Campo "nodeId" obrigatório' });

  const nodeData = {};

  const hooks = {
    stopAt: nodeId,
    onNodeComplete: async (id, _type, info) => {
      nodeData[id] = {
        status: info.error ? 'error' : 'success',
        input:  info.input  ?? null,
        output: info.output ?? null,
        error:  info.error?.message || null,
        durationMs: info.durationMs,
      };
    },
  };

  const envVars = await loadEnvVars();
  try {
    await runFlow(flow, input || {}, null, { ...hooks, envVars });
    res.json({ success: true, nodeData });
  } catch (err) {
    res.json({ success: false, nodeData, error: err.message });
  }
});

// ─── Run com SSE — stream de eventos em tempo real ───────────────────────────
app.post('/run/:flowId/stream', async (req, res) => {
  const { flowId } = req.params;
  const flow = await getFlow(flowId).catch(() => null);
  if (!flow) return res.status(404).json({ error: `Flow "${flowId}" não encontrado` });

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const ac = new AbortController();
  req.on('close', () => ac.abort());

  const send = (data) => {
    try { res.write(`data: ${JSON.stringify(data)}\n\n`); } catch {}
  };

  let execution;
  try { execution = await createExecution(flowId, req.body || {}); } catch {}

  const envVars = await loadEnvVars();

  const hooks = {
    signal: ac.signal,
    onNodeStart: async (nodeId, nodeType, { input }) => {
      send({ type: 'node:start', nodeId, nodeType, input });
    },
    onNodeComplete: async (nodeId, nodeType, info) => {
      if (execution) await logNode(execution.id, nodeId, nodeType, info).catch(() => {});
      send({
        type: 'node:complete', nodeId,
        status: info.error ? 'error' : 'success',
        input: info.input, output: info.output,
        error: info.error?.message || null, durationMs: info.durationMs,
      });
    },
    envVars,
  };

  try {
    const result = await runFlow(flow, req.body || {}, null, hooks);
    if (execution) await finishExecution(execution.id, result).catch(() => {});
    send({ type: 'flow:done', result, executionId: execution?.id });
  } catch (err) {
    if (execution) await failExecution(execution.id, err).catch(() => {});
    send({ type: 'flow:error', error: err.message, executionId: execution?.id });
  }

  res.end();
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

  const envVars = await loadEnvVars();
  const hooks = {
    envVars,
    ...(execution ? { onNodeComplete: (nodeId, nodeType, info) => logNode(execution.id, nodeId, nodeType, info) } : {}),
  };

  try {
    const result = await runFlow(flow, req.body || {}, null, hooks);
    if (execution) await finishExecution(execution.id, result).catch(() => {});
    res.json({ success: true, executionId: execution?.id, result });
  } catch (err) {
    if (execution) await failExecution(execution.id, err).catch(() => {});
    res.status(500).json({ error: err.message, executionId: execution?.id });
  }
});

// ─── Schedules (cron) ────────────────────────────────────────────────────────
const prisma = require('../db/client');

app.get('/schedules', async (req, res) => {
  try {
    res.json(await prisma.schedule.findMany({ orderBy: { createdAt: 'desc' } }));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/schedules', async (req, res) => {
  const { flowId, cron, enabled = true } = req.body;
  if (!flowId) return res.status(400).json({ error: 'Campo "flowId" obrigatório' });
  if (!cron)   return res.status(400).json({ error: 'Campo "cron" obrigatório' });
  try {
    const schedule = await prisma.schedule.create({
      data: { id: uuidv4(), flowId, cron, enabled, createdAt: new Date() },
    });
    scheduler.registerSchedule(schedule);
    res.status(201).json(schedule);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.patch('/schedules/:id', async (req, res) => {
  try {
    const schedule = await prisma.schedule.update({
      where: { id: req.params.id },
      data: req.body,
    });
    scheduler.registerSchedule(schedule);
    res.json(schedule);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/schedules/:id', async (req, res) => {
  try {
    await prisma.schedule.delete({ where: { id: req.params.id } });
    scheduler.unregisterSchedule(req.params.id);
    res.json({ deleted: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Credentials ─────────────────────────────────────────────────────────────
app.get('/credentials', async (req, res) => {
  try { res.json(await listCredentials()); } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/credentials/:id', async (req, res) => {
  try {
    const c = await getCredential(req.params.id);
    if (!c) return res.status(404).json({ error: 'Credencial não encontrada' });
    res.json(c);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/credentials', async (req, res) => {
  const { name, type, data } = req.body;
  if (!name) return res.status(400).json({ error: 'Campo "name" obrigatório' });
  if (!type) return res.status(400).json({ error: 'Campo "type" obrigatório' });
  try { res.status(201).json(await createCredential({ name, type, data: data || {} })); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/credentials/:id', async (req, res) => {
  try { res.json(await updateCredential(req.params.id, req.body)); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/credentials/:id', async (req, res) => {
  try { await deleteCredential(req.params.id); res.json({ deleted: true }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Variables (env vars armazenadas no banco) ────────────────────────────────
app.get('/variables', async (req, res) => {
  try { res.json(await listVariables()); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/variables', async (req, res) => {
  const { key, value } = req.body;
  if (!key) return res.status(400).json({ error: 'Campo "key" obrigatório' });
  try { res.status(201).json(await createVariable({ key, value: value ?? '' })); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/variables/:id', async (req, res) => {
  try { res.json(await updateVariable(req.params.id, req.body)); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/variables/:id', async (req, res) => {
  try { await deleteVariable(req.params.id); res.json({ deleted: true }); }
  catch (err) { res.status(500).json({ error: err.message }); }
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
  scheduler.loadAll();
});
