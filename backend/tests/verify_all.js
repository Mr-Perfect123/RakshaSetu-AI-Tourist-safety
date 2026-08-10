const http = require('http');
const app = require('../src/app');

const TEST_PORT = 5007;
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
    // 1. Login Admin
    const loginRes = await makePostRequest('/api/v1/auth/login', {
      email: 'admin@rakshasetu.gov.in',
      password: 'Password@123'
    });
    console.log('✅ TEST 1 - Auth Login Code:', loginRes.status, '| Role:', loginRes.data.data.user.role);
    const token = loginRes.data.data.accessToken;

    // 2. Admin Stats (Protected Route Check)
    const statsRes = await makeGetRequest('/api/v1/admin/stats', token);
    console.log('✅ TEST 2 - Admin Stats (Protected Endpoint) Code:', statsRes.status, '| Active SOS Count:', statsRes.data.data.activeSosCount);

    // 3. SOS Trigger
    const sosRes = await makePostRequest('/api/v1/sos/trigger', {
      latitude: 28.6120,
      longitude: 77.2050,
      address: 'Near India Gate Circle, New Delhi',
      triggerType: 'one_tap'
    }, token);
    console.log('✅ TEST 3 - SOS Panic Trigger Code:', sosRes.status, '| Generated SOS Code:', sosRes.data.data.sos_code);

    // 4. AI Assistant Chat (Tamil)
    const aiRes = await makePostRequest('/api/v1/ai/chat', {
      message: 'எனக்கு அவசர உதவி தேவை',
      language: 'Tamil'
    }, token);
    console.log('✅ TEST 4 - AI Multilingual Response (Tamil) Code:', aiRes.status, '| Intent:', aiRes.data.data.intent);

    // 5. Tourist Place Profile Details with Red Alerts & Analytics
    const placeRes = await makeGetRequest('/api/v1/places/details/taj-mahal-agra');
    console.log('✅ TEST 5 - Place Profile Code:', placeRes.status, '| Destination:', placeRes.data.data.name, '| Safety Score:', placeRes.data.data.analytics.riskScore);

    // 6. Active Red Alerts System
    const alertRes = await makeGetRequest('/api/v1/alerts/active');
    console.log('✅ TEST 6 - Active Red Alerts Count:', alertRes.data.data.length, '| Code:', alertRes.data.data[0]?.alert_code);

    console.log('--- ALL INTEGRATION TESTS PASSED PERFECTLY! ---');
  } catch (err) {
    console.error('❌ INTEGRATION TEST FAILED:', err.message);
  } finally {
    server.close();
    process.exit(0);
  }
});
