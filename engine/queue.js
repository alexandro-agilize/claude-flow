/**
 * QUEUE — Sistema de filas via arquivos .jsonl
 * Permite que workers em worktrees diferentes se comuniquem.
 * Cada linha do arquivo é um job JSON independente.
 */

const fs = require('fs');
const path = require('path');

const QUEUE_DIR = path.join(__dirname, '..', 'queue');

function ensureQueueDir() {
  if (!fs.existsSync(QUEUE_DIR)) {
    fs.mkdirSync(QUEUE_DIR, { recursive: true });
  }
}

/**
 * Adiciona um job à fila.
 * @param {string} queueName  - Nome da fila (ex: "flow-executions")
 * @param {object} job        - Dados do job
 */
function enqueue(queueName, job) {
  ensureQueueDir();
  const file = path.join(QUEUE_DIR, `${queueName}.jsonl`);
  const line = JSON.stringify({ ...job, enqueuedAt: new Date().toISOString() });
  fs.appendFileSync(file, line + '\n');
}

/**
 * Lê e remove o próximo job da fila (FIFO).
 * @param {string} queueName
 * @returns {object|null}
 */
function dequeue(queueName) {
  ensureQueueDir();
  const file = path.join(QUEUE_DIR, `${queueName}.jsonl`);
  if (!fs.existsSync(file)) return null;

  const lines = fs.readFileSync(file, 'utf8').split('\n').filter(Boolean);
  if (lines.length === 0) return null;

  const job = JSON.parse(lines[0]);
  fs.writeFileSync(file, lines.slice(1).join('\n') + (lines.length > 1 ? '\n' : ''));
  return job;
}

/**
 * Retorna quantos jobs estão na fila.
 */
function size(queueName) {
  const file = path.join(QUEUE_DIR, `${queueName}.jsonl`);
  if (!fs.existsSync(file)) return 0;
  return fs.readFileSync(file, 'utf8').split('\n').filter(Boolean).length;
}

module.exports = { enqueue, dequeue, size };
