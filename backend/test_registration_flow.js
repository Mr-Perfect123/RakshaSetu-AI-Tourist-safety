const { executeQuery } = require('./src/config/database');
const User = require('./src/models/User');
const AuthController = require('./src/controllers/authController');

async function testRegistrationFlow() {
  console.log('--- TESTING RAKSHASETU TOURIST REGISTRATION FLOW & EMERGENCY EMAIL FIX ---');

  const email1 = `testtourist_${Date.now()}_1@gmail.com`;
  const email2 = `testtourist_${Date.now()}_2@gmail.com`;
  const emergencyEmail = 'parent@gmail.com';

  const createMockRes = () => {
    const res = { statusCode: 200, body: null };
    res.status = function(code) {
      this.statusCode = code;
      return this;
    };
    res.json = function(data) {
      this.body = data;
      return this;
    };
    return res;
  };

  const runController = (fn, req, res) => {
    return new Promise((resolve, reject) => {
      const next = (err) => {
        if (err) reject(err);
        else resolve(res);
      };
      const origJson = res.json;
      res.json = function(data) {
        origJson.call(this, data);
        resolve(res);
      };
      fn(req, res, next);
    });
  };

  // Test 1: Tourist 1 registers with emergency contact email parent@gmail.com
  console.log(`\nTest 1: Registering Tourist 1 (${email1}) with Emergency Email (${emergencyEmail})...`);
  const req1 = {
    body: {
      full_name: 'Tourist One',
      email: email1,
      phone: `+9198${Math.floor(10000000 + Math.random() * 90000000)}`,
      password: 'Password@123',
      dob: '1995-05-15',
      emergency_contact_name: 'Parent Name',
      emergency_contact_phone: '+919811223344',
      emergency_contact_relationship: 'Parent',
      emergency_contact_email: emergencyEmail
    }
  };
  const res1 = createMockRes();
  await runController(AuthController.register, req1, res1);
  console.log('Result 1 status:', res1.statusCode, 'message:', res1.body?.message);

  if (res1.statusCode !== 201) {
    console.error('FAILED Test 1');
    process.exit(1);
  }

  // Test 2: Tourist 2 registers with DIFFERENT tourist email, but SAME emergency contact email (parent@gmail.com)
  console.log(`\nTest 2: Registering Tourist 2 (${email2}) with SAME Emergency Email (${emergencyEmail})...`);
  const req2 = {
    body: {
      full_name: 'Tourist Two',
      email: email2,
      phone: `+9198${Math.floor(10000000 + Math.random() * 90000000)}`,
      password: 'Password@123',
      dob: '1998-10-20',
      emergency_contact_name: 'Parent Name',
      emergency_contact_phone: '+919811223344',
      emergency_contact_relationship: 'Parent',
      emergency_contact_email: emergencyEmail
    }
  };
  const res2 = createMockRes();
  await runController(AuthController.register, req2, res2);
  console.log('Result 2 status:', res2.statusCode, 'message:', res2.body?.message);

  if (res2.statusCode !== 201) {
    console.error('FAILED Test 2');
    process.exit(1);
  }

  // Test 3: Tourist 3 registers with BLANK emergency contact email
  console.log(`\nTest 3: Registering Tourist 3 with BLANK Emergency Email...`);
  const req3 = {
    body: {
      full_name: 'Tourist Three',
      email: `testtourist_${Date.now()}_3@gmail.com`,
      phone: `+9198${Math.floor(10000000 + Math.random() * 90000000)}`,
      password: 'Password@123',
      dob: '2000-01-01',
      emergency_contact_name: 'Friend Name',
      emergency_contact_phone: '+919877665544',
      emergency_contact_relationship: 'Friend',
      emergency_contact_email: ''
    }
  };
  const res3 = createMockRes();
  await runController(AuthController.register, req3, res3);
  console.log('Result 3 status:', res3.statusCode, 'message:', res3.body?.message);

  if (res3.statusCode !== 201) {
    console.error('FAILED Test 3');
    process.exit(1);
  }

  // Test 4: Duplicate Tourist Account Email (email1 again)
  console.log(`\nTest 4: Attempting registration with Duplicate Tourist Account Email (${email1})...`);
  const req4 = {
    body: {
      full_name: 'Duplicate Tourist',
      email: email1,
      phone: `+9198${Math.floor(10000000 + Math.random() * 90000000)}`,
      password: 'Password@123',
      dob: '1995-05-15'
    }
  };
  const res4 = createMockRes();
  try {
    await runController(AuthController.register, req4, res4);
  } catch (err) {
    console.log('Captured expected error for duplicate tourist email:', err.message);
    if (err.message !== 'This email is already registered. Please login or use another email.') {
      console.error('Incorrect error message:', err.message);
      process.exit(1);
    }
  }

  console.log('\n--- ALL REGISTRATION & EMERGENCY EMAIL TESTS PASSED CLEANLY! ---');
  process.exit(0);
}

testRegistrationFlow();
