const Anthropic = require('@anthropic-ai/sdk');

let client;
function getClient() {
  if (!client) client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return client;
}

async function run(config, input) {
  const model = config.model || 'claude-sonnet-4-6';
  const userContent = interpolate(config.prompt || JSON.stringify(input), input);

  const params = {
    model,
    max_tokens: config.maxTokens || 1024,
    messages: [{ role: 'user', content: userContent }],
  };

  if (config.system) {
    // Cache system prompts — they're static per node config
    params.system = [{ type: 'text', text: interpolate(config.system, input), cache_control: { type: 'ephemeral' } }];
  }

  const response = await getClient().messages.create(params);
  const text = response.content[0]?.text || '';

  return { ...input, claude: { text, model: response.model, usage: response.usage }, output: text };
}

function interpolate(str, data) {
  if (typeof str !== 'string') return str;
  return str.replace(/\{\{(.+?)\}\}/g, (_, key) => {
    const val = key.trim().split('.').reduce((o, k) => o?.[k], data);
    return val !== undefined ? val : '';
  });
}

module.exports = { run };
