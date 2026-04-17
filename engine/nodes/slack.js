const { WebClient } = require('@slack/web-api');

let client;
function getClient() {
  if (!client) client = new WebClient(process.env.SLACK_BOT_TOKEN);
  return client;
}

function interpolate(str, data) {
  if (typeof str !== 'string') return str;
  return str.replace(/\{\{(.+?)\}\}/g, (_, key) => {
    const val = key.trim().split('.').reduce((o, k) => o?.[k], data);
    return val !== undefined ? val : '';
  });
}

async function run(config, input) {
  const channel = interpolate(config.channel || '', input);
  const text    = interpolate(config.text || JSON.stringify(input), input);

  if (!channel) throw new Error('Slack: campo "channel" obrigatório');

  const result = await getClient().chat.postMessage({ channel, text });

  return { ...input, slack: { ok: result.ok, ts: result.ts, channel: result.channel } };
}

module.exports = { run };
