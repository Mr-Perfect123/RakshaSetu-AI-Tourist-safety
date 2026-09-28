/**
 * Comprehensive Test Suite for TextBee SMS Gateway Integration in RakshaSetu
 * Covers Section 13 Tests 1 through 6, dynamic customer-to-emergency-contact binding,
 * E.164 normalization, and non-blocking failure isolation.
 */

const assert = require('assert');
const http = require('http');
const request = require('supertest');
const app = require('../src/app');
const { generateAccessToken } = require('../src/config/jwt');
const { inMemoryStore } = require('../src/config/database');
const textBeeService = require('../src/services/textBeeService');

let passed = 0;
let failed = 0;

async function runTest(testName, fn) {
  try {
    await fn();
    console.log(`  ✅ PASS: ${testName}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${testName}\n     ${err.message}`);
    failed++;
  }
}

function createMockTextBeeServer() {
  let resolver = null;
  let promise = new Promise(res => { resolver = res; });

  const server = http.createServer((req, res) => {
    const headers = req.headers;
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      let parsed = null;
      try { parsed = JSON.parse(body); } catch {}
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        message: 'SMS request queued successfully',
        data: { smsBatchId: 'tb_batch_test_' + Date.now(), status: 'queued' }
      }));
      if (resolver) resolver({ headers, body: parsed });
    });
  });

  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      resolve({
        url: `http://127.0.0.1:${port}/api/v1/gateway/send-sms`,
        waitForRequest: () => promise,
        resetPromise: () => {
          promise = new Promise(res => { resolver = res; });
        },
        close: () => new Promise(res => server.close(res))
      });
    });
  });
}

async function runAllTests() {
  console.log('====================================================');
  console.log('🧪 RAKSHASETU TEXTBEE SMS INTEGRATION TEST SUITE');
  console.log('====================================================\n');

  // ----------------------------------------------------
  // UNIT TESTS: E.164 Phone Normalization (Section 5)
  // ----------------------------------------------------
  console.log('--- E.164 Phone Number Normalization Tests ---');

  await runTest('10-digit Indian number normalized to E.164 (9876543210 -> +919876543210)', () => {
    const res = textBeeService.normalizeToE164('9876543210');
    assert.strictEqual(res.valid, true);
    assert.strictEqual(res.formattedNumber, '+919876543210');
  });

  await runTest('+91 prefixed number (+919876543210 -> +919876543210)', () => {
    const res = textBeeService.normalizeToE164('+919876543210');
    assert.strictEqual(res.valid, true);
    assert.strictEqual(res.formattedNumber, '+919876543210');
  });

  await runTest('91 prefixed without plus (919876543210 -> +919876543210)', () => {
    const res = textBeeService.normalizeToE164('919876543210');
    assert.strictEqual(res.valid, true);
    assert.strictEqual(res.formattedNumber, '+919876543210');
  });

  await runTest('Trunk 0 prefix (09876543210 -> +919876543210)', () => {
    const res = textBeeService.normalizeToE164('09876543210');
    assert.strictEqual(res.valid, true);
    assert.strictEqual(res.formattedNumber, '+919876543210');
  });

  await runTest('International prefix 00 (00919876543210 -> +919876543210)', () => {
    const res = textBeeService.normalizeToE164('00919876543210');
    assert.strictEqual(res.valid, true);
    assert.strictEqual(res.formattedNumber, '+919876543210');
  });

  await runTest('Accidental duplicate 91 (+91919876543210 -> +919876543210)', () => {
    const res = textBeeService.normalizeToE164('+91919876543210');
    assert.strictEqual(res.valid, true);
    assert.strictEqual(res.formattedNumber, '+919876543210');
  });

  await runTest('Formatted with spaces and hyphens (+91 98765-43210 -> +919876543210)', () => {
    const res = textBeeService.normalizeToE164('+91 98765-43210');
    assert.strictEqual(res.valid, true);
    assert.strictEqual(res.formattedNumber, '+919876543210');
  });

  await runTest('Valid international number (+14155550199 -> +14155550199)', () => {
    const res = textBeeService.normalizeToE164('+14155550199');
    assert.strictEqual(res.valid, true);
    assert.strictEqual(res.formattedNumber, '+14155550199');
  });

  await runTest('Invalid short number rejected (12345)', () => {
    const res = textBeeService.normalizeToE164('12345');
    assert.strictEqual(res.valid, false);
    assert.ok(res.error.includes('Emergency contact phone number is invalid'));
  });

  // ----------------------------------------------------
  // UNIT TESTS: SMS Content Formatting (Section 6)
  // ----------------------------------------------------
  console.log('\n--- SMS Content Formatting Tests ---');

  await runTest('Emergency message WITH GPS location link', () => {
    const msg = textBeeService.formatEmergencyMessage({
      customerName: 'Aarav Patel',
      latitude: 28.6139,
      longitude: 77.2090
    });
    assert.strictEqual(
      msg,
      "It's emergency help me! RakshaSetu SOS ALERT: Aarav Patel has triggered an emergency SOS. Current location: https://www.google.com/maps?q=28.6139,77.209. Please contact them immediately."
    );
  });

  await runTest('Emergency message WITHOUT GPS location link', () => {
    const msg = textBeeService.formatEmergencyMessage({
      customerName: 'Aarav Patel'
    });
    assert.strictEqual(
      msg,
      "It's emergency help me! RakshaSetu SOS ALERT: Aarav Patel has triggered an emergency SOS. Please contact them immediately."
    );
  });

  // ----------------------------------------------------
  // SECTION 13: SCENARIO TESTS 1-6
  // ----------------------------------------------------
  console.log('\n--- Section 13 Scenario Tests (1 through 6) ---');

  // TEST 1: Customer A triggers SOS -> TextBee receives Customer A's emergency contact (+919876543210)
  await runTest('TEST 1: Customer A clicks SOS -> SMS sent to Customer A emergency contact (+919876543210)', async () => {
    const mockServer = await createMockTextBeeServer();
    const origUrl = process.env.TEXTBEE_API_URL;
    const origKey = process.env.TEXTBEE_API_KEY;

    process.env.TEXTBEE_API_URL = mockServer.url;
    process.env.TEXTBEE_API_KEY = 'real_textbee_api_key_cust_a';

    // Setup Customer A (User 201) in DB/store with contact +919876543210
    const customerA = { id: 201, full_name: 'Customer A Sharma', email: 'custA@example.com', phone: '+919000000001', role: 'Tourist', status: 'active' };
    inMemoryStore.users = inMemoryStore.users.filter(u => u.id !== 201);
    inMemoryStore.users.push(customerA);

    inMemoryStore.emergency_contacts = inMemoryStore.emergency_contacts.filter(c => c.user_id !== 201);
    inMemoryStore.emergency_contacts.push({
      id: 2011,
      user_id: 201,
      contact_name: 'Contact of Customer A',
      contact_phone: '+919876543210', // Customer A's stored emergency contact
      relationship: 'Brother',
      is_primary: 1
    });

    const tokenA = generateAccessToken({ id: customerA.id, role: customerA.role });
    textBeeService.clearDeduplicationCache();

    // Trigger SOS via existing API
    const res = await request(app)
      .post('/api/v1/sos/trigger')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        latitude: 28.6139,
        longitude: 77.2090,
        address: 'India Gate, New Delhi',
        triggerType: 'one_tap'
      });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.success, true);

    // Wait for the async dispatch to arrive at the mock server
    const reqData = await mockServer.waitForRequest();

    assert.strictEqual(reqData.headers['x-api-key'], 'real_textbee_api_key_cust_a');
    assert.strictEqual(reqData.headers['content-type'], 'application/json');
    assert.deepStrictEqual(reqData.body.recipients, ['+919876543210']);
    assert.ok(reqData.body.message.includes('Customer A Sharma'));
    assert.ok(reqData.body.message.includes('https://www.google.com/maps?q=28.6139,77.209'));

    await mockServer.close();
    process.env.TEXTBEE_API_URL = origUrl;
    process.env.TEXTBEE_API_KEY = origKey;
  });

  // TEST 2: Customer B triggers SOS -> SMS MUST go to Customer B's contact (+919812345678), NOT Customer A's!
  await runTest('TEST 2: Customer B clicks SOS -> SMS MUST go to Customer B emergency contact (+919812345678)', async () => {
    const mockServer = await createMockTextBeeServer();
    const origUrl = process.env.TEXTBEE_API_URL;
    const origKey = process.env.TEXTBEE_API_KEY;

    process.env.TEXTBEE_API_URL = mockServer.url;
    process.env.TEXTBEE_API_KEY = 'real_textbee_api_key_cust_b';

    // Setup Customer B (User 202) in DB/store with contact +919812345678
    const customerB = { id: 202, full_name: 'Customer B Verma', email: 'custB@example.com', phone: '+919000000002', role: 'Tourist', status: 'active' };
    inMemoryStore.users = inMemoryStore.users.filter(u => u.id !== 202);
    inMemoryStore.users.push(customerB);

    inMemoryStore.emergency_contacts = inMemoryStore.emergency_contacts.filter(c => c.user_id !== 202);
    inMemoryStore.emergency_contacts.push({
      id: 2021,
      user_id: 202,
      contact_name: 'Contact of Customer B',
      contact_phone: '+919812345678', // Customer B's stored emergency contact
      relationship: 'Mother',
      is_primary: 1
    });

    const tokenB = generateAccessToken({ id: customerB.id, role: customerB.role });
    textBeeService.clearDeduplicationCache();

    // Trigger SOS for Customer B
    const res = await request(app)
      .post('/api/v1/sos/trigger')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({
        latitude: 11.0168,
        longitude: 76.9558,
        address: 'Coimbatore, Tamil Nadu',
        triggerType: 'one_tap'
      });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.success, true);

    const reqData = await mockServer.waitForRequest();

    // CRITICAL ASSERTION: Recipient must be Customer B's contact (+919812345678) and NEVER Customer A's (+919876543210)!
    assert.deepStrictEqual(reqData.body.recipients, ['+919812345678']);
    assert.notDeepStrictEqual(reqData.body.recipients, ['+919876543210']);
    assert.ok(reqData.body.message.includes('Customer B Verma'));

    await mockServer.close();
    process.env.TEXTBEE_API_URL = origUrl;
    process.env.TEXTBEE_API_KEY = origKey;
  });

  // TEST 3: Invalid Emergency Number
  await runTest('TEST 3: Invalid emergency number -> No SMS attempted, clear error logged, SOS safe', async () => {
    textBeeService.clearDeduplicationCache();
    const result = await textBeeService.sendEmergencySMS({
      customerId: 203,
      customerName: 'Customer Invalid',
      recipientPhone: '12345', // Malformed invalid number
      latitude: 28.6139,
      longitude: 77.2090
    });

    assert.strictEqual(result.success, false);
    assert.strictEqual(result.skipped, true);
    assert.ok(result.error.includes('Emergency contact phone number is invalid'));
  });

  // TEST 4: Missing Emergency Contact
  await runTest('TEST 4: Missing emergency contact -> Handled gracefully, SOS created successfully', async () => {
    // User with no emergency contacts registered
    const customerNoContact = { id: 204, full_name: 'Customer No Contact', email: 'no_contact@example.com', role: 'Tourist', status: 'active' };
    inMemoryStore.users.push(customerNoContact);
    inMemoryStore.emergency_contacts = inMemoryStore.emergency_contacts.filter(c => c.user_id !== 204);

    const token = generateAccessToken({ id: customerNoContact.id, role: customerNoContact.role });

    const res = await request(app)
      .post('/api/v1/sos/trigger')
      .set('Authorization', `Bearer ${token}`)
      .send({
        latitude: 28.6139,
        longitude: 77.2090,
        address: 'Delhi',
        triggerType: 'one_tap'
      });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.success, true);
  });

  // TEST 5: TextBee API Gateway Failure (HTTP 500 / 401)
  await runTest('TEST 5: TextBee API failure -> Handled safely, SOS system does not crash', async () => {
    const errorServer = http.createServer((req, res) => {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, message: 'Internal Gateway Error' }));
    });
    await new Promise(r => errorServer.listen(0, '127.0.0.1', r));
    const port = errorServer.address().port;

    const origUrl = process.env.TEXTBEE_API_URL;
    const origKey = process.env.TEXTBEE_API_KEY;

    process.env.TEXTBEE_API_URL = `http://127.0.0.1:${port}/api/v1/gateway/send-sms`;
    process.env.TEXTBEE_API_KEY = 'test_key';

    textBeeService.clearDeduplicationCache();

    const result = await textBeeService.sendEmergencySMS({
      customerId: 205,
      customerName: 'Customer Test 5',
      recipientPhone: '+919876543210',
      latitude: 28.6139,
      longitude: 77.2090
    });

    assert.strictEqual(result.success, false);
    assert.strictEqual(result.statusCode, 500);
    assert.strictEqual(result.status, 'gateway_error');

    await new Promise(r => errorServer.close(r));
    process.env.TEXTBEE_API_URL = origUrl;
    process.env.TEXTBEE_API_KEY = origKey;
  });

  // TEST 6: Double-Click / Duplicate SOS Protection
  await runTest('TEST 6: Double-click / duplicate SOS -> Suppresses duplicate SMS within cooldown', async () => {
    let callCount = 0;
    const countServer = http.createServer((req, res) => {
      callCount++;
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, data: { smsBatchId: `batch_${callCount}` } }));
    });
    await new Promise(r => countServer.listen(0, '127.0.0.1', r));
    const port = countServer.address().port;

    const origUrl = process.env.TEXTBEE_API_URL;
    const origKey = process.env.TEXTBEE_API_KEY;

    process.env.TEXTBEE_API_URL = `http://127.0.0.1:${port}/api/v1/gateway/send-sms`;
    process.env.TEXTBEE_API_KEY = 'test_key';

    textBeeService.clearDeduplicationCache();

    // First SOS dispatch
    const res1 = await textBeeService.sendEmergencySMS({
      customerId: 206,
      customerName: 'Customer Rapid',
      recipientPhone: '+919876543210',
      sosCode: 'SOS-DUP-TEXTBEE',
      sosId: 901
    });

    assert.strictEqual(res1.success, true);
    assert.strictEqual(callCount, 1);

    // Immediate duplicate retry for the SAME SOS and contact
    const res2 = await textBeeService.sendEmergencySMS({
      customerId: 206,
      customerName: 'Customer Rapid',
      recipientPhone: '+919876543210',
      sosCode: 'SOS-DUP-TEXTBEE',
      sosId: 901
    });

    assert.strictEqual(res2.success, true);
    assert.strictEqual(res2.duplicateSuppressed, true);
    // Verifies gateway was NOT hit twice
    assert.strictEqual(callCount, 1);

    await new Promise(r => countServer.close(r));
    process.env.TEXTBEE_API_URL = origUrl;
    process.env.TEXTBEE_API_KEY = origKey;
  });

  // ----------------------------------------------------
  // SUMMARY
  // ----------------------------------------------------
  console.log('\n====================================================');
  console.log(`📊 TEXTBEE TEST RESULTS: ${passed} passed, ${failed} failed`);
  console.log('====================================================\n');

  setTimeout(() => {
    process.exit(failed > 0 ? 1 : 0);
  }, 100);
}

runAllTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
