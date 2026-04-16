const jmespath = require('jmespath');
const _ = require('lodash');

async function run(config, input) {
  const mode = config.mode || 'jmespath';

  if (mode === 'jmespath') {
    const result = jmespath.search(input, config.expression || '@');
    return result !== null && result !== undefined ? result : input;
  }

  if (mode === 'pick') {
    const fields = config.fields || [];
    return _.pick(input, fields);
  }

  if (mode === 'omit') {
    const fields = config.fields || [];
    return _.omit(input, fields);
  }

  if (mode === 'set') {
    // config.path: 'a.b.c', config.value: any
    const value = config.expression
      ? new Function('input', '_', `"use strict"; return (${config.expression});`)(input, _)
      : config.value;
    return _.set({ ...input }, config.path, value);
  }

  if (mode === 'map') {
    const items = _.get(input, config.field || 'items', []);
    const fn = new Function('item', 'input', '_', `"use strict"; return (${config.mapper});`);
    const mapped = items.map(item => fn(item, input, _));
    return _.set({ ...input }, config.outputField || config.field || 'items', mapped);
  }

  if (mode === 'filter') {
    const items = _.get(input, config.field || 'items', []);
    const fn = new Function('item', 'input', '_', `"use strict"; return !!(${config.predicate});`);
    const filtered = items.filter(item => fn(item, input, _));
    return _.set({ ...input }, config.field || 'items', filtered);
  }

  return input;
}

module.exports = { run };
