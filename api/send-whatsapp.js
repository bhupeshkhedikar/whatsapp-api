const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;
const client = twilio(accountSid, authToken);

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

  // Validate required fields
  if (!to) {
    return res.status(400).json({ success: false, error: 'Missing "to" number' });
  }
  if (!contentSid) {
    return res.status(400).json({ success: false, error: 'Missing contentSid' });
  }
  if (!contentVariables || typeof contentVariables !== 'object') {
    return res.status(400).json({ success: false, error: 'Missing or invalid contentVariables' });
  }

  // Validate phone number format
  const phoneRegex = /^\+[1-9]\d{1,14}$/;
  if (!phoneRegex.test(to)) {
    return res.status(400).json({ success: false, error: 'Invalid phone number format' });
  }

  try {
    const message = await client.messages.create({
      to: `whatsapp:${to}`,
      messagingServiceSid,
      contentSid,
      contentVariables: JSON.stringify(contentVariables), // Ensure contentVariables is stringified
    });

    res.status(200).json({ success: true, sid: message.sid });
  } catch (error) {
    console.error('Twilio Error:', error);
    
    // More specific error handling
    let errorMessage = error.message;
    if (error.code === 21211) {
      errorMessage = 'Invalid phone number';
    } else if (error.code === 21608) {
      errorMessage = 'Messaging Service not properly configured';
    }
    
    res.status(500).json({ 
      success: false, 
      error: errorMessage,
      code: error.code,
      details: error.moreInfo 
    });
  }
});