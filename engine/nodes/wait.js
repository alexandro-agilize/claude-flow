/**
 * NODE: WAIT
 * Pausa o fluxo por um tempo determinado antes de continuar.
 *
 * Config esperada no flow.json:
 * {
 *   "type": "wait",
 *   "config": {
 *     "ms": 2000      // milissegundos (2000 = 2 segundos)
 *   }
 * }
 *
 * Retorna o input inalterado após o tempo de espera.
 */

async function run(config, input) {
  const ms = config.ms || 1000;
  console.log(`[WAIT] Aguardando ${ms}ms...`);
  await new Promise(resolve => setTimeout(resolve, ms));
  return input;
}

module.exports = { run };
