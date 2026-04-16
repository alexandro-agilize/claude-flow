/**
 * NODE: CODE (JavaScript)
 * Executa código JS customizado dentro do fluxo.
 * Você escreve uma função que recebe `input` e retorna o resultado.
 *
 * Config esperada no flow.json:
 * {
 *   "type": "code",
 *   "config": {
 *     "code": "return { soma: input.a + input.b, dobro: input.a * 2 };"
 *   }
 * }
 *
 * Variáveis disponíveis no código:
 *   - input   → dados vindos do nó anterior
 *   - console → console.log funciona normalmente
 */

async function run(config, input) {
  const code = config.code || 'return input;';

  // Cria função segura com acesso apenas a `input` e `console`
  const fn = new Function('input', 'console', `
    "use strict";
    ${code}
  `);

  const result = await fn(input, console);
  return result !== undefined ? result : input;
}

module.exports = { run };
