const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;
const client = twilio(accountSid, authToken);

// Allow CORS for frontend
const allowCors = handler => async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  return handler(req, res);
};

module.exports = allowCors(async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { to, contentSid, contentVariables } = req.body;

  if (!to || !contentSid || !contentVariables) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }

  try {
    const message = await client.messages.create({
      to: `whatsapp:${to}`,
      messagingServiceSid,
      contentSid,
      contentVariables,
    });

    res.status(200).json({ success: true, sid: message.sid });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});
