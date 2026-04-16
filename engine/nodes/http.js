/**
 * NODE: HTTP
 * Faz uma requisição HTTP (GET, POST, PUT, DELETE, PATCH)
 *
 * Config esperada no flow.json:
 * {
 *   "type": "http",
 *   "config": {
 *     "url": "https://api.exemplo.com/dados",
 *     "method": "GET",           // GET | POST | PUT | DELETE | PATCH
 *     "headers": { "Authorization": "Bearer {{token}}" },
 *     "body": { "chave": "valor" }  // só para POST/PUT/PATCH
 *   }
 * }
 *
 * Retorna: { status, headers, data }
 */

const axios = require('axios');

async function run(config, input) {
  const method = (config.method || 'GET').toLowerCase();
  const url = interpolate(config.url, input);
  const headers = config.headers || {};
  const body = config.body ? interpolate(JSON.stringify(config.body), input) : undefined;

  const response = await axios({
    method,
    url,
    headers,
    data: body ? JSON.parse(body) : undefined,
    validateStatus: () => true, // não lança erro para qualquer status
  });

  return {
    status: response.status,
    headers: response.headers,
    data: response.data,
  };
}

// Substitui {{variavel}} pelo valor de input.variavel
function interpolate(str, data) {
  if (typeof str !== 'string') return str;
  return str.replace(/\{\{(.+?)\}\}/g, (_, key) => {
    const val = key.trim().split('.').reduce((o, k) => o?.[k], data);
    return val !== undefined ? val : '';
  });
}

module.exports = { run };
