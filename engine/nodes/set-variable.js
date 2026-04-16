async function run(config, input, context) {
  const name = config.name;
  if (!name) throw new Error('[SET-VARIABLE] "name" é obrigatório');

  let value;
  if (config.expression) {
    const fn = new Function('input', `"use strict"; return (${config.expression});`);
    value = fn(input);
  } else {
    value = config.value;
  }

  if (context) context.variables[name] = value;

  return { ...input, [name]: value };
}

module.exports = { run };
