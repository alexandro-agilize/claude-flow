/**
 * WORKER — Processa jobs da fila continuamente
 *
 * Como usar:
 *   node engine/worker.js
 *   node engine/worker.js --queue minha-fila
 */

const { dequeue, size } = require('./queue');
const { runFlow } = require('./runner');
const { getFlow } = require('../db/flows');
const { createExecution, finishExecution, failExecution, logNode } = require('../db/executions');

const QUEUE_NAME = process.argv.includes('--queue')
  ? process.argv[process.argv.indexOf('--queue') + 1]
  : 'flow-executions';

console.log(`\n====================================`);
console.log(` Worker iniciado`);
console.log(` Fila: ${QUEUE_NAME}`);
console.log(` Aguardando jobs...`);
console.log(`====================================\n`);

async function processNext() {
  const job = dequeue(QUEUE_NAME);

  if (!job) {
    setTimeout(processNext, 1000);
    return;
  }

  console.log(`\n[JOB] Processando: ${job.flowId}`);

  const flow = await getFlow(job.flowId).catch(() => null);
  if (!flow) {
    console.error(`[ERRO] Flow não encontrado: ${job.flowId}`);
    setImmediate(processNext);
    return;
  }

  // Retoma execução criada no webhook ou cria uma nova
  let executionId = job.executionId;
  try {
    if (executionId) {
      const prisma = require('../db/client');
      await prisma.execution.update({
        where: { id: executionId },
        data: { status: 'running' },
      });
    } else {
      const execution = await createExecution(job.flowId, job.input || {});
      executionId = execution.id;
    }
  } catch (err) {
    console.warn('[DB] Falha ao atualizar execução:', err.message);
  }

  const hooks = executionId ? {
    onNodeComplete: (nodeId, nodeType, info) =>
      logNode(executionId, nodeId, nodeType, info),
  } : {};

  try {
    const result = await runFlow(flow, job.input || {}, null, hooks);
    if (executionId) await finishExecution(executionId, result).catch(() => {});
    console.log(`\n[OK] Resultado:`, JSON.stringify(result, null, 2));
  } catch (err) {
    if (executionId) await failExecution(executionId, err).catch(() => {});
    console.error(`\n[ERRO]`, err.message);
  }

  setImmediate(processNext);
}

processNext();
