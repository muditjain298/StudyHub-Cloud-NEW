require('dotenv').config();
const { createMailer } = require('./config/mailer');

console.log('EMAIL_USER loaded:', !!process.env.EMAIL_USER);
console.log('EMAIL_PASS loaded:', Boolean(process.env.EMAIL_PASS) && !process.env.EMAIL_PASS.includes('replace_with'));

let transporter;
try {
  transporter = createMailer();
} catch (error) {
  console.error(`❌ ${error.message}`);
  process.exitCode = 1;
}

if (transporter) {
  transporter.verify()
    .then(() => console.log('✅ Gmail SMTP login OK'))
    .catch((err) => {
      console.error('❌ code:', err.code);
      console.error('❌ responseCode:', err.responseCode);
      console.error('❌ message:', err.message);
      process.exitCode = 1;
    });
}