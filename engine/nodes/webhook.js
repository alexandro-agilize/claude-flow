/**
 * NODE: WEBHOOK
 * Ponto de entrada do fluxo — recebe requisições HTTP externas.
 * Este nó é especial: ele não é executado pelo runner, mas sim pelo server.
 * Quando uma requisição chega em POST /webhook/:flowId, o server inicia o fluxo
 * passando os dados recebidos como input inicial.
 *
 * Config esperada no flow.json:
 * {
 *   "type": "webhook",
 *   "config": {
 *     "method": "POST",    // método HTTP esperado (padrão: POST)
 *     "respondWith": "lastNode"  // "lastNode" | "received" | "noResponse"
 *   }
 * }
 *
 * Input gerado automaticamente pelo server:
 * { body, query, headers, method, timestamp }
 */

async function run(config, input) {
  // O webhook já recebeu os dados via HTTP — só os repassa para o próximo nó
  return input;
}

module.exports = { run };
