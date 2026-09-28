const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const User = require('../src/models/User');
const { generateAccessToken } = require('../src/config/jwt');
const textBeeService = require('../src/services/textBeeService');

async function testSosTrigger() {
  console.log('--- 1. Fetch User 10 (Karan) ---');
  const user = await User.findById(10);
  console.log('User 10:', {
    id: user.id,
    name: user.full_name,
    phone: user.phone,
    emergency_contact_phone: user.emergency_contact_phone,
    emergency_contact_name: user.emergency_contact_name,
    emergency_contacts: user.emergency_contacts
  });

  // Clear deduplication cache to ensure fresh SMS dispatch
  textBeeService.clearDeduplicationCache();

  console.log('\n--- 2. Trigger SOS via HTTP API ---');
  const token = generateAccessToken(user);

  const res = await fetch('http://localhost:5005/api/v1/sos/trigger', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      latitude: 12.9716,
      longitude: 77.5946,
      address: 'MG Road, Bengaluru, Karnataka, India',
      triggerType: 'one_tap_sos'
    })
  });

  const data = await res.json();
  console.log('SOS Trigger HTTP Status:', res.status);
  console.log('SOS Trigger Response:', JSON.stringify(data, null, 2));

  // Give 4 seconds for asynchronous dispatch to complete and log
  await new Promise(r => setTimeout(r, 4000));
  console.log('\n--- 3. SOS Trigger Completed ---');
}

testSosTrigger().catch(console.error);
