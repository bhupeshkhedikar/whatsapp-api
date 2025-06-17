const twilio = require('twilio');

// Twilio credentials
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioWhatsAppNumber = process.env.TWILIO_WHATSAPP_NUMBER;

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Validate environment variables
if (!accountSid || !authToken || !twilioWhatsAppNumber) {
  module.exports = (req, res) => {
    res.set(corsHeaders);
    res.status(500).json({ success: false, error: 'Server configuration error: Missing Twilio credentials' });
  };
} else {
  let twilioClient;
  try {
    twilioClient = new twilio(accountSid, authToken);
  } catch (error) {
    console.error('Error initializing Twilio client:', error);
    module.exports = (req, res) => {
      res.set(corsHeaders);
      res.status(500).json({ success: false, error: 'Failed to initialize Twilio client' });
    };
    return;
  }

  module.exports = async (req, res) => {
    res.set(corsHeaders);

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const { to, message } = req.body;

    if (!to || !message) {
      return res.status(400).json({ success: false, error: 'Missing required fields: to and message' });
    }

    try {
      const twilioResponse = await twilioClient.messages.create({
        body: message,
        from: twilioWhatsAppNumber,
        to: `whatsapp:${to}`,
      });
      console.log('Twilio response:', twilioResponse); // Add logging
      res.status(200).json({ success: true, message: 'WhatsApp notification sent' });
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  };
}