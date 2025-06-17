const express = require('express');
const twilio = require('twilio');

// Initialize Express app
const app = express();
app.use(express.json());

// Twilio credentials (store these in environment variables on Vercel)
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioClient = new twilio(accountSid, authToken);

// Endpoint to send WhatsApp message
app.post('/send-whatsapp', async (req, res) => {
  const { to, message } = req.body;

  if (!to || !message) {
    return res.status(400).json({ success: false, error: 'Missing required fields: to and message' });
  }

  try {
    await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_WHATSAPP_NUMBER, // e.g., whatsapp:+14155238886
      to: `whatsapp:${to}`,
    });
    res.status(200).json({ success: true, message: 'WhatsApp notification sent' });
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Export the app for Vercel
module.exports = app;