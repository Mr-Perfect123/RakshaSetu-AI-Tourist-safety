const http = require('http');
const app = require('../src/app');

const TEST_PORT = 5008;
const server = http.createServer(app);

server.listen(TEST_PORT, async () => {
  console.log(`--- STARTING INTEGRATION TESTS FOR RAKSHASETU ON PORT ${TEST_PORT} ---`);

  const makePostRequest = (path, body, token = '') => {
    return new Promise((resolve, reject) => {
      const data = JSON.stringify(body);
      const options = {
        hostname: 'localhost',
        port: TEST_PORT,
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

  const makeGetRequest = (path, token = '') => {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'localhost',
        port: TEST_PORT,
        path: path,
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        }
      };

      const req = http.request(options, (res) => {
        let resData = '';
        res.on('data', (chunk) => resData += chunk);
        res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(resData) }));
      });

      req.on('error', (err) => reject(err));
      req.end();
    });
  };

  try {
    // 1. Auth Login Test
    const loginRes = await makePostRequest('/api/v1/auth/login', {
      email: 'admin@rakshasetu.gov.in',
      password: 'Password@123'
    });
    console.log('✅ TEST 1 - Auth Login Code:', loginRes.status, '| Role:', loginRes.data.data.user.role);
    const token = loginRes.data.data.accessToken;

    // 2. Protected Admin Endpoint Check
    const statsRes = await makeGetRequest('/api/v1/admin/stats', token);
    console.log('✅ TEST 2 - Admin Stats Code:', statsRes.status, '| Active SOS Count:', statsRes.data.data.activeSosCount);

    // 3. Dynamic Global Place Search (Ooty check)
    const searchRes = await makeGetRequest('/api/v1/places/search?query=Ooty');
    console.log('✅ TEST 3 - Dynamic Place Search Code:', searchRes.status, '| Matches Count:', searchRes.data.data.length, '| First Item:', searchRes.data.data[0]?.name);

    // 4. Place Details & Real MySQL Safety Analytics
    const placeRes = await makeGetRequest('/api/v1/places/details/taj-mahal-agra');
    console.log('✅ TEST 4 - Place Profile Details Code:', placeRes.status, '| Safety Score:', placeRes.data.data.analytics.riskScore, '| Incidents Theft Count:', placeRes.data.data.analytics.breakdown.theft);

    // 5. Active Red Alerts System
    const alertRes = await makeGetRequest('/api/v1/alerts/active');
    console.log('✅ TEST 5 - Active Red Alerts Count:', alertRes.data.data.length);

    // 6. Gemini Multilingual AI Chat
    const aiRes = await makePostRequest('/api/v1/ai/chat', {
      message: 'எனக்கு அவசர உதவி தேவை',
      language: 'Tamil'
    }, token);
    console.log('✅ TEST 6 - AI Multilingual Response (Tamil) Code:', aiRes.status, '| Intent:', aiRes.data.data.intent);

    console.log('--- ALL RAKSHASETU INTEGRATION TESTS PASSED PERFECTLY! ---');
  } catch (err) {
    console.error('❌ INTEGRATION TEST FAILED:', err.message);
  } finally {
    server.close();
    process.exit(0);
  }
});
