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
    if (req.method === 'OPTIONS') return res.status(200).end();
    return await handler(req, res);
  };
};

if (!accountSid || !authToken || !twilioWhatsAppNumber) {
  module.exports = allowCors((req, res) => {
    res.status(500).json({ success: false, error: 'Missing Twilio credentials' });
  });
} else {
  const client = new twilio(accountSid, authToken);

  module.exports = allowCors(async (req, res) => {
    if (req.method !== 'POST') {
      return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const { to, templateName, language = 'mr', parameters = [] } = req.body;

    if (!to || !templateName) {
      return res.status(400).json({ success: false, error: 'Missing "to" or "templateName" fields' });
    }

    try {
      const message = await client.messages.create({
        from: `whatsapp:${twilioWhatsAppNumber}`,
        to: `whatsapp:${to}`,
        contentSid: undefined,
        contentVariables: undefined,
        contentTemplateData: undefined,

        // Template message setup
        contentSid: undefined,
        body: undefined, // no plain body
        messagingServiceSid: undefined,
        provideFeedback: false,

        contentTemplateData: undefined,
        persistentAction: undefined,

        content: {
          template_name: templateName,
          language: { code: language },
          components: [
            {
              type: 'body',
              parameters: parameters.map((p) => ({ type: 'text', text: p })),
            },
          ],
        },
      });

      res.status(200).json({ success: true, sid: message.sid });
    } catch (error) {
      console.error('Error sending template message:', error.message);
      res.status(500).json({ success: false, error: error.message });
    }
  });
}
