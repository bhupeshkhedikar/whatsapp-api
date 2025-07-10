const twilio = require('twilio');

// Twilio credentials
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioWhatsAppNumber = process.env.TWILIO_WHATSAPP_NUMBER;

const allowCors = (handler) => {
  return async (req, res) => {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*'); // You can change '*' to 'http://localhost:3001' for tighter security
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'X-CSRF-Token, X-Requested-With, Accept, Content-Type, Authorization'
    );

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    return await handler(req, res);
  };
};

if (!accountSid || !authToken || !twilioWhatsAppNumber) {
  module.exports = allowCors((req, res) => {
    res.status(500).json({ success: false, error: 'Server configuration error: Missing Twilio credentials' });
  });
} else {
  const twilioClient = new twilio(accountSid, authToken);

  module.exports = allowCors(async (req, res) => {
    if (req.method !== 'POST') {
      return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const { to, message } = req.body;

    if (!to || !message) {
      return res.status(400).json({ success: false, error: 'Missing required fields: to and message' });
    }

    try {
      await twilioClient.messages.create({
        body: message,
        from: twilioWhatsAppNumber,
        to: `whatsapp:${to}`,
      });
      res.status(200).json({ success: true, message: 'WhatsApp notification sent' });
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });
}
