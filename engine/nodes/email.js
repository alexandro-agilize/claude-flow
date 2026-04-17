const nodemailer = require('nodemailer');

const transporterCache = {};

async function resolveSmtp(config) {
  if (config.credentialId) {
    const prisma = require('../../db/client');
    const cred = await prisma.credential.findUnique({ where: { id: config.credentialId } });
    if (!cred) throw new Error(`Credencial "${config.credentialId}" não encontrada`);
    return JSON.parse(cred.data);
  }
  return {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 587,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  };
}

async function getTransporter(config) {
  const key = config.credentialId || '__env__';
  if (!transporterCache[key]) {
    const smtp = await resolveSmtp(config);
    transporterCache[key] = nodemailer.createTransport({
      host:   smtp.host || 'smtp.gmail.com',
      port:   Number(smtp.port) || 587,
      secure: Number(smtp.port) === 465,
      auth: { user: smtp.user, pass: smtp.pass },
    });
  }
  return transporterCache[key];
}

function interpolate(str, data) {
  if (typeof str !== 'string') return str;
  return str.replace(/\{\{(.+?)\}\}/g, (_, key) => {
    const val = key.trim().split('.').reduce((o, k) => o?.[k], data);
    return val !== undefined ? val : '';
  });
}

async function run(config, input) {
  const to      = interpolate(config.to || '', input);
  const subject = interpolate(config.subject || '(sem assunto)', input);
  const body    = interpolate(config.body || '', input);

  if (!to) throw new Error('Email: campo "to" obrigatório');

  const smtp = await resolveSmtp(config);
  const mailOptions = {
    from: config.from || smtp.user || process.env.SMTP_USER,
    to,
    subject,
    [config.html ? 'html' : 'text']: body,
  };

  const transport = await getTransporter(config);
  const info = await transport.sendMail(mailOptions);

  return { ...input, email: { messageId: info.messageId, to, subject, accepted: info.accepted } };
}

module.exports = { run };
