/**
 * End-to-End SOS -> TextBee SMS Integration Test
 * Verifies full end-to-end pipeline:
 * Customer triggers SOS -> auth middleware -> sosController -> DB creation ->
 * exact customer's emergency contact lookup -> TextBee API dispatch -> 201 response.
 */

const assert = require('assert');
const http = require('http');
const request = require('supertest');
const app = require('../src/app');
const { generateAccessToken } = require('../src/config/jwt');
const { inMemoryStore } = require('../src/config/database');
const textBeeService = require('../src/services/textBeeService');

function createMockTextBeeGateway() {
  const capturedRequests = [];
  let requestWaiter = null;

  const server = http.createServer((req, res) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      let parsed = null;
      try { parsed = JSON.parse(body); } catch {}
      const record = { headers: req.headers, body: parsed };
      capturedRequests.push(record);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        message: 'SMS dispatched successfully via TextBee gateway',
        data: {
          smsBatchId: 'tb_batch_' + Date.now(),
          status: 'sent'
        }
      }));
      if (requestWaiter) {
        requestWaiter(record);
        requestWaiter = null;
      }
    });
  });

  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      resolve({
        url: `http://127.0.0.1:${port}/api/v1/gateway/send-sms`,
        capturedRequests,
        waitForNextRequest: () => new Promise(res => { requestWaiter = res; }),
        close: () => new Promise(res => server.close(res))
      });
    });
  });
}

async function runE2ETextBeeTest() {
  console.log('====================================================');
  console.log('🚀 RUNNING END-TO-END SOS -> TEXTBEE SMS PIPELINE TEST');
  console.log('====================================================\n');

  const gateway = await createMockTextBeeGateway();
  const origUrl = process.env.TEXTBEE_API_URL;
  const origKey = process.env.TEXTBEE_API_KEY;

  process.env.TEXTBEE_API_URL = gateway.url;
  process.env.TEXTBEE_API_KEY = 'live_textbee_api_key_demo';

  // 1. Setup Customer A (Karan) with Emergency Contact (+919876543210)
  const customerA = { id: 301, full_name: 'Karan Sharma', email: 'karan.sharma@example.com', phone: '+919988776655', role: 'Tourist', status: 'active' };
  inMemoryStore.users = inMemoryStore.users.filter(u => u.id !== 301);
  inMemoryStore.users.push(customerA);

  inMemoryStore.emergency_contacts = inMemoryStore.emergency_contacts.filter(c => c.user_id !== 301);
  inMemoryStore.emergency_contacts.push({
    id: 3011,
    user_id: 301,
    contact_name: 'Rajesh Sharma',
    contact_phone: '+919876543210', // Customer A's emergency contact
    relationship: 'Father',
    is_primary: 1
  });

  // 2. Setup Customer B (Priya) with Emergency Contact (+919812345678)
  const customerB = { id: 302, full_name: 'Priya Verma', email: 'priya.verma@example.com', phone: '+919988776644', role: 'Tourist', status: 'active' };
  inMemoryStore.users = inMemoryStore.users.filter(u => u.id !== 302);
  inMemoryStore.users.push(customerB);

  inMemoryStore.emergency_contacts = inMemoryStore.emergency_contacts.filter(c => c.user_id !== 302);
  inMemoryStore.emergency_contacts.push({
    id: 3021,
    user_id: 302,
    contact_name: 'Sunita Verma',
    contact_phone: '+919812345678', // Customer B's emergency contact
    relationship: 'Mother',
    is_primary: 1
  });

  const tokenA = generateAccessToken({ id: customerA.id, role: customerA.role });
  const tokenB = generateAccessToken({ id: customerB.id, role: customerB.role });

  textBeeService.clearDeduplicationCache();

  // ─── STEP 1: Customer A triggers SOS ───────────────────────────────────────
  console.log('1. Customer A (Karan Sharma) triggers emergency SOS...');
  const waitA = gateway.waitForNextRequest();

  const resA = await request(app)
    .post('/api/v1/sos/trigger')
    .set('Authorization', `Bearer ${tokenA}`)
    .send({
      latitude: 11.0168,
      longitude: 76.9558,
      address: 'Near Clock Tower, Coimbatore',
      triggerType: 'one_tap'
    });

  assert.strictEqual(resA.status, 201);
  assert.strictEqual(resA.body.success, true);
  console.log(`   ✅ SOS Created. Code: ${resA.body.data.sos_code}`);

  const reqA = await waitA;
  console.log(`   ✅ TextBee API received SMS for Customer A:`);
  console.log(`      Recipients: ${JSON.stringify(reqA.body.recipients)}`);
  console.log(`      Message: "${reqA.body.message}"`);

  // Verify recipient matches Customer A's emergency contact (+919876543210)
  assert.deepStrictEqual(reqA.body.recipients, ['+919876543210']);
  assert.ok(reqA.body.message.includes("It's emergency help me!"));
  assert.ok(reqA.body.message.includes('Karan Sharma'));
  assert.ok(reqA.body.message.includes('https://www.google.com/maps?q=11.0168,76.9558'));

  // ─── STEP 2: Customer B triggers SOS ───────────────────────────────────────
  console.log('\n2. Customer B (Priya Verma) triggers emergency SOS...');
  const waitB = gateway.waitForNextRequest();

  const resB = await request(app)
    .post('/api/v1/sos/trigger')
    .set('Authorization', `Bearer ${tokenB}`)
    .send({
      latitude: 28.6139,
      longitude: 77.2090,
      address: 'Connaught Place, New Delhi',
      triggerType: 'one_tap'
    });

  assert.strictEqual(resB.status, 201);
  assert.strictEqual(resB.body.success, true);
  console.log(`   ✅ SOS Created. Code: ${resB.body.data.sos_code}`);

  const reqB = await waitB;
  console.log(`   ✅ TextBee API received SMS for Customer B:`);
  console.log(`      Recipients: ${JSON.stringify(reqB.body.recipients)}`);
  console.log(`      Message: "${reqB.body.message}"`);

  // CRITICAL VERIFICATION: Recipient must be Customer B's contact (+919812345678) and NEVER Customer A's (+919876543210)!
  assert.deepStrictEqual(reqB.body.recipients, ['+919812345678']);
  assert.notDeepStrictEqual(reqB.body.recipients, ['+919876543210']);
  assert.ok(reqB.body.message.includes('Priya Verma'));

  // ─── STEP 3: Duplicate SOS Suppression ─────────────────────────────────────
  console.log('\n3. Customer B double-clicks SOS (rapid retry test)...');
  const preCount = gateway.capturedRequests.length;

  const resDup = await request(app)
    .post('/api/v1/sos/trigger')
    .set('Authorization', `Bearer ${tokenB}`)
    .send({
      latitude: 28.6139,
      longitude: 77.2090,
      address: 'Connaught Place, New Delhi',
      triggerType: 'one_tap'
    });

  assert.strictEqual(resDup.status, 201);
  // Allow time for async handler
  await new Promise(r => setTimeout(r, 100));
  // Gateway request count must NOT increase
  assert.strictEqual(gateway.capturedRequests.length, preCount);
  console.log('   ✅ Duplicate SMS was suppressed by cooldown cache (no extra gateway request).');

  await gateway.close();
  process.env.TEXTBEE_API_URL = origUrl;
  process.env.TEXTBEE_API_KEY = origKey;

  console.log('\n====================================================');
  console.log('🎉 ALL END-TO-END SOS -> TEXTBEE TESTS PASSED PERFECTLY!');
  console.log('====================================================\n');

  setTimeout(() => process.exit(0), 100);
}

runE2ETextBeeTest().catch(err => {
  console.error('E2E Test Failure:', err);
  process.exit(1);
});
