const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const qrcodeLib = require('qrcode');

let latestQR = null;

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: false, // Set to true once WhatsApp is connected and stable
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
      '--disable-gpu',
    ],
  },
});

client.on('qr', (qr) => {
  latestQR = qr;
  qrcode.generate(qr, { small: true });
  console.log('📱 QR Code received. Scan it with WhatsApp or visit http://localhost:3001/qr');
});

client.on('ready', () => {
  latestQR = null;
  console.log('✅ WhatsApp client is ready! Bot is live.');
});

client.on('auth_failure', (msg) => {
  console.error('❌ WhatsApp authentication failure:', msg);
});

client.on('disconnected', (reason) => {
  console.warn('⚠️  WhatsApp client disconnected:', reason);
});

async function getQRCodeDataURL() {
  if (!latestQR) return null;
  return qrcodeLib.toDataURL(latestQR);
}

module.exports = { client, getQRCodeDataURL };
