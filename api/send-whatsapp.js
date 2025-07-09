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
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Content-Type, Authorization');
    if (req.method === 'OPTIONS') return res.status(200).end();
    return await handler(req, res);
  };
};

const client = twilio(accountSid, authToken);

module.exports = allowCors(async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { to, templateName, parameters = [], language = 'mr' } = req.body;

  if (!to || !templateName) {
    return res.status(400).json({ success: false, error: 'Missing "to" or "templateName"' });
  }

  try {
    await client.messages.create({
      from: `whatsapp:${twilioWhatsAppNumber}`,
      to: `whatsapp:${to}`,
      // Template message structure
      contentSid: undefined,
      body: undefined, // must not use this when using templates
      // new API style (as of 2024)
      contentTemplateData: {
        template_name: templateName,
        language: { code: language },
        components: [
          {
            type: 'body',
            parameters: parameters.map((p) => ({
              type: 'text',
              text: p
            }))
          }
        ]
      }
    });

    res.status(200).json({ success: true, message: 'Template message sent!' });
  } catch (error) {
    console.error('Error sending WhatsApp template:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});
