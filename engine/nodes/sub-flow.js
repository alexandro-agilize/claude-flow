const { getFlow } = require('../../db/flows');

async function run(config, input) {
  // Lazy-require to avoid circular dependency (runner → sub-flow → runner)
  const { runFlow } = require('../runner');

  const flowId = config.flowId;
  if (!flowId) throw new Error('Sub-flow: campo "flowId" obrigatório');

  const flow = await getFlow(flowId);
  if (!flow) throw new Error(`Sub-flow: flow "${flowId}" não encontrado`);

  const subInput = config.passInput !== false ? input : (config.staticInput || {});
  const result   = await runFlow(flow, subInput);

  const outputField = config.outputField || 'subflow';
  return { ...input, [outputField]: result };
}

module.exports = { run };
