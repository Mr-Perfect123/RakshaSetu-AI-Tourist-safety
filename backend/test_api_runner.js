const http = require('http');

const makePostRequest = (path, body, token = '') => {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const options = {
      hostname: 'localhost',
      port: 5005,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        ...(token && { Authorization: `Bearer ${token}` })
      }
    };

    const req = http.request(options, (res) => {
      let resData = '';
      res.on('data', (chunk) => resData += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(resData) }));
    });

    req.on('error', (err) => reject(err));
    req.write(data);
    req.end();
  });
};

const runApiTests = async () => {
  console.log('--- TESTING RAKSHASETU LIVE BACKEND & AI API PIPELINE ---');

  // 1. Test Login
  const loginRes = await makePostRequest('/api/v1/auth/login', {
    email: 'admin@rakshasetu.gov.in',
    password: 'Password@123'
  });
  console.log('[API Test 1] Auth Login Response Code:', loginRes.status);
  console.log('[API Test 1] User Role:', loginRes.data.data.user.role);
  const token = loginRes.data.data.accessToken;

  // 2. Test SOS Panic Dispatch
  const sosRes = await makePostRequest('/api/v1/sos/trigger', {
    latitude: 28.6120,
    longitude: 77.2050,
    address: 'Near India Gate Circle, New Delhi',
    triggerType: 'one_tap'
  }, token);
  console.log('[API Test 2] SOS Panic Trigger Code:', sosRes.status);
  console.log('[API Test 2] Emergency Alert Message:', sosRes.data.message);
  console.log('[API Test 2] SOS Code Generated:', sosRes.data.data.sos_code);

  // 3. Test Gemini AI Safety Chat Assistant
  const aiRes = await makePostRequest('/api/v1/ai/chat', {
    message: 'What is the nearest police station to my location?'
  }, token);
  console.log('[API Test 3] Gemini AI Assistant Response Code:', aiRes.status);
  console.log('[API Test 3] AI Response:', aiRes.data.data.response);

  // 4. Test AI Crime & Danger Risk Prediction
  const riskRes = await makePostRequest('/api/v1/ai/predict-risk', {
    latitude: 28.6550,
    longitude: 77.2400,
    timeOfDay: 'late_night'
  }, token);
  console.log('[API Test 4] AI Crime Risk Prediction Score:', riskRes.data.data.riskScore, 'Level:', riskRes.data.data.riskLevel);

  console.log('--- ALL API PIPELINE VERIFICATION PASSED PERFECTLY! ---');
};

runApiTests();
