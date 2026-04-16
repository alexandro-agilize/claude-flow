/**
 * NODE: IF
 * Redireciona o fluxo baseado em uma condição verdadeira ou falsa.
 * Retorna o input inalterado, mas adiciona `_branch: "true"` ou `_branch: "false"`.
 * O runner usa esse valor para decidir qual edge seguir.
 *
 * Config esperada no flow.json:
 * {
 *   "type": "if",
 *   "config": {
 *     "condition": "input.status === 200"
 *   }
 * }
 *
 * No flow.json, as edges saindo deste nó devem ter:
 *   { "from": "id_do_if", "to": "proximo_no", "branch": "true" }
 *   { "from": "id_do_if", "to": "outro_no",   "branch": "false" }
 */

async function run(config, input) {
  const condition = config.condition || 'false';

  let result = false;
  try {
    const fn = new Function('input', `"use strict"; return !!(${condition});`);
    result = fn(input);
  } catch (err) {
    console.error('[IF] Erro ao avaliar condição:', err.message);
    result = false;
  }

  return { ...input, _branch: result ? 'true' : 'false' };
}

module.exports = { run };
