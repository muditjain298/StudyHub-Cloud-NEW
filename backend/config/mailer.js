const nodemailer = require('nodemailer');

const requiredMailConfig = ['EMAIL_USER', 'EMAIL_PASS'];

const createMailer = () => {
  const missing = requiredMailConfig.filter((key) => !process.env[key]);
  if (missing.length) {
    throw new Error(`Missing mail configuration: ${missing.join(', ')}`);
  }

  if (process.env.EMAIL_PASS.includes('replace_with') || process.env.EMAIL_PASS.includes('your_')) {
    throw new Error('EMAIL_PASS must be a Google App Password, not the placeholder value.');
  }

  const password = process.env.EMAIL_PASS.replace(/\s/g, '');

  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: Number(process.env.EMAIL_PORT || 465),
    secure: process.env.EMAIL_SECURE !== 'false',
    auth: {
      user: process.env.EMAIL_USER,
      pass: password,
    },
  });
};

module.exports = { createMailer };