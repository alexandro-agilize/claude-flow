/**
 * NODE: SWITCH
 * Direciona o fluxo para um caminho baseado no valor de uma variável.
 * Funciona como um switch/case do JS.
 *
 * Config esperada no flow.json:
 * {
 *   "type": "switch",
 *   "config": {
 *     "value": "input.status",    // expressão JS a avaliar
 *     "cases": ["200", "404", "500"]  // valores possíveis
 *   }
 * }
 *
 * No flow.json, as edges saindo deste nó devem ter:
 *   { "from": "id_do_switch", "to": "no_200",     "branch": "200" }
 *   { "from": "id_do_switch", "to": "no_404",     "branch": "404" }
 *   { "from": "id_do_switch", "to": "no_default", "branch": "default" }
 *
 * Adiciona `_branch` ao output com o valor que casou (ou "default").
 */

async function run(config, input) {
  const expression = config.value || '"default"';

  let value = 'default';
  try {
    const fn = new Function('input', `"use strict"; return String(${expression});`);
    value = fn(input);
  } catch (err) {
    console.error('[SWITCH] Erro ao avaliar expressão:', err.message);
  }

  const cases = (config.cases || []).map(String);
  const matched = cases.includes(value) ? value : 'default';

  return { ...input, _branch: matched };
}

module.exports = { run };
