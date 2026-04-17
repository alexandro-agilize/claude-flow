const nodemailer = require('nodemailer');

let transporter;
function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host:   process.env.SMTP_HOST || 'smtp.gmail.com',
      port:   Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
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

  const mailOptions = {
    from: config.from || process.env.SMTP_USER,
    to,
    subject,
    [config.html ? 'html' : 'text']: body,
  };

  const info = await getTransporter().sendMail(mailOptions);

  return { ...input, email: { messageId: info.messageId, to, subject, accepted: info.accepted } };
}

module.exports = { run };
