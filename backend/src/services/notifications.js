let clientRef = null;

/**
 * Set the WhatsApp client reference after initialization.
 * Called from index.js after client is ready.
 */
function setClient(client) {
  clientRef = client;
}

/**
 * Send a WhatsApp message to a phone number.
 * Phone should be without @c.us suffix.
 */
async function sendWhatsAppMessage(phone, message) {
  if (!clientRef) {
    console.warn('WhatsApp client not initialized. Cannot send message to', phone);
    return;
  }
  try {
    const chatId = phone.includes('@c.us') ? phone : `${phone}@c.us`;
    await clientRef.sendMessage(chatId, message);
    console.log(`Message sent to ${phone}`);
  } catch (err) {
    console.error(`Failed to send message to ${phone}:`, err.message);
  }
}

module.exports = { setClient, sendWhatsAppMessage };
