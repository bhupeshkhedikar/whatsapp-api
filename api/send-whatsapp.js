const twilio = require('twilio');

// Twilio credentials
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioWhatsAppNumber = process.env.TWILIO_WHATSAPP_NUMBER;

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Allow all origins (adjust for production)
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Handle CORS preflight requests (OPTIONS)
if (!accountSid || !authToken || !twilioWhatsAppNumber) {
  module.exports = (req, res) => {
    res.set(corsHeaders); // Set CORS headers
    res.status(500).json({ success: false, error: 'Server configuration error: Missing Twilio credentials' });
  };
} else {
  const twilioClient = new twilio(accountSid, authToken);

  module.exports = async (req, res) => {
    // Set CORS headers for all responses
    res.set(corsHeaders);

    // Handle CORS preflight (OPTIONS) requests
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    // Ensure the request method is POST
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
  };
}