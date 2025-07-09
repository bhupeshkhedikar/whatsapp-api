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

const client = twilio(accountSid, authToken);

module.exports = allowCors(async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { to, templateName, language, parameters } = req.body;

  if (!to || !templateName || !language || !Array.isArray(parameters)) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }

  try {
    const response = await client.messages.create({
      from: `whatsapp:${twilioWhatsAppNumber}`,
      to: `whatsapp:${to}`,
      contentTemplateSid: 'USdf0f12570e479b9f725e97a37ca76125', // Make sure this is your approved template SID in Twilio (not template name)
      contentVariables: JSON.stringify(
        parameters.reduce((acc, val, index) => {
          acc[String(index + 1)] = val;
          return acc;
        }, {})
      )
    });

    res.status(200).json({ success: true, sid: response.sid });
  } catch (error) {
    console.error('WhatsApp send error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});
