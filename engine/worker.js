/**
 * WORKER — Processa jobs da fila continuamente
 * Este é o processo que roda em terminais separados (e em worktrees separados).
 * Cada worker pega um job da fila, executa o fluxo, e repete.
 *
 * Como usar:
 *   node engine/worker.js
 *   node engine/worker.js --queue minha-fila   (fila customizada)
 */

const { dequeue, size } = require('./queue');
const { runFlow } = require('./runner');
const fs = require('fs');
const path = require('path');

const QUEUE_NAME = process.argv.includes('--queue')
  ? process.argv[process.argv.indexOf('--queue') + 1]
  : 'flow-executions';

const FLOWS_DIR = path.join(__dirname, '..', 'flows');

console.log(`\n====================================`);
console.log(` Worker iniciado`);
console.log(` Fila: ${QUEUE_NAME}`);
console.log(` Aguardando jobs...`);
console.log(`====================================\n`);

async function processNext() {
  const job = dequeue(QUEUE_NAME);

  if (!job) {
    // Fila vazia — aguarda 1 segundo e tenta novamente
    setTimeout(processNext, 1000);
    return;
  }

  console.log(`\n[JOB] Processando: ${job.flowId}`);
  console.log(`[JOB] Input:`, JSON.stringify(job.input, null, 2));

  try {
    const flowFile = path.join(FLOWS_DIR, `${job.flowId}.json`);
    if (!fs.existsSync(flowFile)) {
      throw new Error(`Flow não encontrado: ${job.flowId}.json`);
    }

    const flow = JSON.parse(fs.readFileSync(flowFile, 'utf8'));
    const result = await runFlow(flow, job.input || {});

    console.log(`\n[OK] Resultado:`, JSON.stringify(result, null, 2));
  } catch (err) {
    console.error(`\n[ERRO]`, err.message);
  }

  // Processa próximo job imediatamente
  setImmediate(processNext);
}

processNext();
