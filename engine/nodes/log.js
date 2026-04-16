const fs = require('fs');
const path = require('path');

const LOGS_DIR = path.join(__dirname, '..', '..', 'logs');

async function run(config, input, context) {
  const level = config.level || 'info';
  const message = config.message ? interpolate(config.message, input) : JSON.stringify(input, null, 2);

  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(config.includeInput ? { data: input } : {}),
  };

  console.log(`[LOG:${level.toUpperCase()}] ${message}`);

  if (context) context.logs.push(entry);

  if (config.persist !== false) {
    if (!fs.existsSync(LOGS_DIR)) fs.mkdirSync(LOGS_DIR, { recursive: true });
    const logFile = path.join(LOGS_DIR, `${config.file || 'execution'}.jsonl`);
    fs.appendFileSync(logFile, JSON.stringify(entry) + '\n');
  }

  return { ...input, _log: entry };
}

function interpolate(str, data) {
  if (typeof str !== 'string') return str;
  return str.replace(/\{\{(.+?)\}\}/g, (_, key) => {
    const val = key.trim().split('.').reduce((o, k) => o?.[k], data);
    return val !== undefined ? val : '';
  });
}

module.exports = { run };
