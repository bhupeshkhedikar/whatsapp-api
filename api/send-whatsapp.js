const twilio = require('twilio');

// Twilio credentials
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioWhatsAppNumber = process.env.TWILIO_WHATSAPP_NUMBER;

const allowCors = (handler) => {
  return async (req, res) => {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'X-CSRF-Token, X-Requested-With, Accept, Content-Type, Authorization'
    );
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    return await handler(req, res);
  };
};

if (!accountSid || !authToken || !twilioWhatsAppNumber) {
  module.exports = allowCors((req, res) => {
    res.status(500).json({ success: false, error: 'Missing Twilio credentials' });
  });
} else {
  const twilioClient = twilio(accountSid, authToken);

  module.exports = allowCors(async (req, res) => {
    if (req.method !== 'POST') {
      return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const { to, templateName, language, parameters } = req.body;

    if (!to || !templateName || !language || !parameters || !Array.isArray(parameters)) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: to, templateName, language, parameters[]',
      });
    }

    try {
      const response = await twilioClient.messages.create({
        from: `whatsapp:${twilioWhatsAppNumber}`,
        to: `whatsapp:${to}`,
        contentSid: process.env.TWILIO_TEMPLATE_CONTENT_SID, // Only if using Content API (Twilio Conversations)
        contentVariables: JSON.stringify({
          1: parameters[0],
          2: parameters[1],
          3: parameters[2],
          4: parameters[3],
          5: parameters[4],
          6: parameters[5],
          7: parameters[6],
          8: parameters[7],
          9: parameters[8],
          10: parameters[9],
          11: parameters[10],
          12: parameters[11]
        }),
        // OR — Use messagingServiceSid and template_name (for classic messaging API)
        provideFeedback: false,
        statusCallback: '', // optional callback URL
        // you can also try `messagingServiceSid` instead of `from`
      });

      res.status(200).json({ success: true, messageSid: response.sid });
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });
}
