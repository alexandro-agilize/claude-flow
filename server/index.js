/**
 * SERVER — API HTTP + receptor de Webhooks
 * Roda na porta 3000 (ou PORT do ambiente).
 *
 * Endpoints:
 *   GET  /                          → status do servidor
 *   GET  /flows                     → lista todos os flows disponíveis
 *   POST /webhook/:flowId           → dispara um flow via webhook
 *   POST /run/:flowId               → executa um flow diretamente (síncrono)
 *   GET  /queue/:name               → quantos jobs estão na fila
 */

const express = require('express');
const fs = require('fs');
const path = require('path');
const { runFlow } = require('../engine/runner');
const { enqueue, size } = require('../engine/queue');

const app = express();
const PORT = process.env.PORT || 3000;
const FLOWS_DIR = path.join(__dirname, '..', 'flows');

app.use(express.json());

// ─── Status ────────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    message: 'claude-flow está rodando',
    endpoints: {
      flows: 'GET /flows',
      webhook: 'POST /webhook/:flowId',
      run: 'POST /run/:flowId',
      queue: 'GET /queue/:name',
    },
  });
});

// ─── Lista flows ────────────────────────────────────────────────────────────
app.get('/flows', (req, res) => {
  if (!fs.existsSync(FLOWS_DIR)) return res.json([]);
  const files = fs.readdirSync(FLOWS_DIR).filter(f => f.endsWith('.json'));
  const flows = files.map(f => ({
    id: f.replace('.json', ''),
    file: f,
  }));
  res.json(flows);
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

// ─── Start ──────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n====================================`);
  console.log(` claude-flow server rodando`);
  console.log(` http://localhost:${PORT}`);
  console.log(`====================================\n`);
});
