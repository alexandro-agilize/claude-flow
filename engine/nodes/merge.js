async function run(config, input, context, nodeId) {
  if (!context) return input;

  if (!context.mergeAccumulators) context.mergeAccumulators = {};

  const acc = context.mergeAccumulators[nodeId] || [];
  acc.push(input);
  context.mergeAccumulators[nodeId] = acc;

  const expected = (context.incomingCount && context.incomingCount[nodeId]) || 1;

  if (acc.length < expected) {
    return { _mergePending: true };
  }

  // All branches arrived — merge and clear accumulator
  const inputs = context.mergeAccumulators[nodeId];
  delete context.mergeAccumulators[nodeId];

  const strategy = config.strategy || 'spread';

  if (strategy === 'spread') return Object.assign({}, ...inputs);
  if (strategy === 'array') return { items: inputs };
  if (strategy === 'first') return inputs[0];
  if (strategy === 'last') return inputs[inputs.length - 1];

  return Object.assign({}, ...inputs);
}

module.exports = { run };
