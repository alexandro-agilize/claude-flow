const { Pool } = require('pg');

const pools = {};
function getPool(url) {
  if (!pools[url]) pools[url] = new Pool({ connectionString: url });
  return pools[url];
}

async function resolveUrl(config) {
  if (config.credentialId) {
    const prisma = require('../../db/client');
    const cred = await prisma.credential.findUnique({ where: { id: config.credentialId } });
    if (!cred) throw new Error(`Credencial "${config.credentialId}" não encontrada`);
    return JSON.parse(cred.data).url;
  }
  return config.url || process.env.POSTGRES_URL;
}

function interpolate(str, data) {
  if (typeof str !== 'string') return str;
  return str.replace(/\{\{(.+?)\}\}/g, (_, key) => {
    const val = key.trim().split('.').reduce((o, k) => o?.[k], data);
    return val !== undefined ? val : '';
  });
}

async function run(config, input) {
  const url   = await resolveUrl(config);
  const query = interpolate(config.query || '', input);

  if (!url)   throw new Error('Postgres: "url" ou POSTGRES_URL obrigatório');
  if (!query) throw new Error('Postgres: campo "query" obrigatório');

  // Named params: {{param}} in query already interpolated; positional params from config.params array
  const params = Array.isArray(config.params)
    ? config.params.map(p => (typeof p === 'string' ? interpolate(p, input) : p))
    : [];

  const client = await getPool(url).connect();
  try {
    const result = await client.query(query, params.length ? params : undefined);
    return { ...input, postgres: { rows: result.rows, rowCount: result.rowCount, command: result.command } };
  } finally {
    client.release();
  }
}

module.exports = { run };
