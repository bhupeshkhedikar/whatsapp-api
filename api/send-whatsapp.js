const twilio = require('twilio');

// Twilio credentials
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioWhatsAppNumber = process.env.TWILIO_WHATSAPP_NUMBER;

const allowCors = (handler) => {
  return async (req, res) => {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*'); // Change to your frontend URL in production
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

// Check if Twilio config is valid
if (!accountSid || !authToken || !twilioWhatsAppNumber) {
  module.exports = allowCors((req, res) => {
    res.status(500).json({
      success: false,
      error: 'Server configuration error: Missing Twilio credentials',
    });
  });
} else {
  const twilioClient = new twilio(accountSid, authToken);

  module.exports = allowCors(async (req, res) => {
    if (req.method !== 'POST') {
      return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const { to, templateName, parameters = [], language = 'en' } = req.body;

    if (!to || !templateName) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: "to" and "templateName"',
      });
    }

    try {
      await twilioClient.messages.create({
        from: `whatsapp:${twilioWhatsAppNumber}`,
        to: `whatsapp:${to}`,
        contentTemplateData: {
          template_name: templateName,
          language: { code: language },
          components: [
            {
              type: 'body',
              parameters: parameters.map((param) => ({
                type: 'text',
                text: param,
              })),
            },
          ],
        },
      });

      res.status(200).json({
        success: true,
        message: 'WhatsApp template message sent successfully!',
      });
    } catch (error) {
      console.error('Error sending template message:', error.message);
      res.status(500).json({ success: false, error: error.message });
    }
  });
}
