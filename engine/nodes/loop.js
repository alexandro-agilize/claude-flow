const fs = require('fs');
const path = require('path');

async function run(config, input) {
  const items = config.field ? (input[config.field] || []) : (config.items || input.items || []);

  if (!Array.isArray(items)) {
    throw new Error(`[LOOP] "${config.field || 'items'}" não é um array`);
  }

  const results = [];

  if (config.flowId) {
    // Lazy require to avoid circular dependency
    const { runFlow } = require('../runner');
    const flowFile = path.join(__dirname, '..', '..', 'flows', `${config.flowId}.json`);
    const flow = JSON.parse(fs.readFileSync(flowFile, 'utf8'));

    const parallel = config.parallel === true;
    if (parallel) {
      const settled = await Promise.allSettled(
        items.map((item, index) => runFlow(flow, { ...input, item, _index: index }))
      );
      for (const r of settled) {
        results.push(r.status === 'fulfilled' ? r.value : { _error: r.reason?.message });
      }
    } else {
      for (let i = 0; i < items.length; i++) {
        const result = await runFlow(flow, { ...input, item: items[i], _index: i });
        results.push(result);
      }
    }
  } else if (config.code) {
    const fn = new Function('item', 'input', 'index', `"use strict"; ${config.code}`);
    for (let i = 0; i < items.length; i++) {
      const result = await fn(items[i], input, i);
      results.push(result !== undefined ? result : items[i]);
    }
  } else {
    return { ...input, results: items };
  }

  return { ...input, results };
}

module.exports = { run };
