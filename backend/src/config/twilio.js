const twilio = require('twilio');
require('dotenv').config();

let twilioClient = null;
const sid = process.env.TWILIO_ACCOUNT_SID;
const token = process.env.TWILIO_AUTH_TOKEN;

if (sid && sid !== 'mock' && token && token !== 'mock') {
  try {
    twilioClient = twilio(sid, token);
    console.log('[Twilio SMS] Initialized Twilio SMS Client successfully.');
  } catch (err) {
    console.warn(`[Twilio SMS Warning] Failed to initialize Twilio: ${err.message}`);
  }
} else {
  console.log('[Twilio SMS] Operating in simulated SMS dispatch mode.');
}

module.exports = twilioClient;
