const https = require('https');

const apiKey = process.env.GEMINI_API_KEY || '';
const prompt = "Explain how AI works in a few words";

const payload = JSON.stringify({
  contents: [
    {
      parts: [
        {
          text: prompt
        }
      ]
    }
  ]
});

const options = {
  hostname: 'generativelanguage.googleapis.com',
  path: '/v1beta/models/gemini-flash-latest:generateContent',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-goog-api-key': apiKey,
    'Content-Length': Buffer.byteLength(payload)
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log('Status Code:', res.statusCode);
    console.log('Response:', data);
  });
});

req.on('error', (err) => console.error('Error:', err.message));
req.write(payload);
req.end();
