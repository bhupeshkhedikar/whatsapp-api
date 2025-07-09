const twilio = require('twilio');

// Twilio credentials
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID; // YOUR WhatsApp Messaging Service SID

// CORS wrapper
const allowCors = handler => async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*'); // restrict this in production
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,PUT,DELETE');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-Requested-With'
  );

  if (req.method === 'OPTIONS') return res.status(200).end();
  return handler(req, res);
};

const client = twilio(accountSid, authToken);

module.exports = allowCors(async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { to, templateName, language, parameters } = req.body;
  if (!to || !templateName || !language || !Array.isArray(parameters)) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: to, templateName, language, parameters[]',
    });
  }

  try {
    const message = await client.messages.create({
      to: `whatsapp:${to}`,
      messagingServiceSid,
      content: JSON.stringify({
        template_name: templateName,
        template_language: { code: language },
        template_components: [
          {
            type: 'body',
            parameters: parameters.map(p => ({ type: 'text', text: p })),
          },
        ],
      }),
    });

    res.status(200).json({ success: true, sid: message.sid });
  } catch (err) {
    console.error('WhatsApp template send error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});
