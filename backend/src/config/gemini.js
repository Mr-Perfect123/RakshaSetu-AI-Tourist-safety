const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

let apiKey = process.env.GEMINI_API_KEY || '';
if (!apiKey || apiKey === 'mock_gemini_api_key' || apiKey === 'your_gemini_api_key_here') {
  apiKey = null;
}

let genAI = null;
let model = null;

if (apiKey) {
  try {
    genAI = new GoogleGenerativeAI(apiKey);
    model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-flash-latest' });
    console.log('[Gemini AI] Initialized Google Gemini API Client successfully.');
  } catch (err) {
    console.warn('[Gemini AI Warning] Initialization failed. Falling back to local AI safety intelligence engine.');
  }
} else {
  console.log('[Gemini AI] Operating with local safety intelligence engine (Mock/Offline mode).');
}

module.exports = {
  genAI,
  model
};
