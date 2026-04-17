const { WebClient } = require('@slack/web-api');

async function resolveToken(config) {
  if (config.credentialId) {
    const prisma = require('../../db/client');
    const cred = await prisma.credential.findUnique({ where: { id: config.credentialId } });
    if (!cred) throw new Error(`Credencial "${config.credentialId}" não encontrada`);
    return JSON.parse(cred.data).botToken;
  }
  return process.env.SLACK_BOT_TOKEN;
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

  const token = await resolveToken(config);
  const client = new WebClient(token);
  const result = await client.chat.postMessage({ channel, text });

  return { ...input, slack: { ok: result.ok, ts: result.ts, channel: result.channel } };
}

module.exports = { run };
