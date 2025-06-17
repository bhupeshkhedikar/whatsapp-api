require('dotenv').config(); // Add this to load .env file
const express = require('express');
const twilio = require('twilio');
const cors = require('cors');

// Initialize Express app
const app = express();
app.use(express.json());
app.use(cors()); // Enable CORS for frontend requests

// Twilio credentials
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioWhatsAppNumber = process.env.TWILIO_WHATSAPP_NUMBER;

// Validate environment variables
if (!accountSid || !authToken || !twilioWhatsAppNumber) {
  console.error('Missing Twilio environment variables');
  app.post('/send-whatsapp', (req, res) => {
    res.status(500).json({ success: false, error: 'Server configuration error: Missing Twilio credentials' });
  });
} else {
  const twilioClient = new twilio(accountSid, authToken);

  app.post('/send-whatsapp', async (req, res) => {
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
  });
}

// Export the app for Vercel
module.exports = app;