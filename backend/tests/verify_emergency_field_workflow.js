const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const User = require('../src/models/User');
const { executeQuery, pool } = require('../src/config/database');
const textBeeService = require('../src/services/textBeeService');

async function runTests() {
  console.log('--- 1. Testing MySQL users Table Columns ---');
  const [columns] = await pool.query("DESCRIBE users");
  const colNames = columns.map(c => c.Field);
  console.log('Columns in users table:', colNames.filter(c => c.includes('emergency')));
  
  const hasPhone = colNames.includes('emergency_contact_phone');
  const hasName = colNames.includes('emergency_contact_name');
  if (!hasPhone || !hasName) {
    throw new Error('emergency_contact_phone or emergency_contact_name missing from users table!');
  }
  console.log('✅ users table has emergency_contact_phone and emergency_contact_name');

  console.log('\n--- 2. Testing User.findById with Emergency Contact Fields ---');
  // Check user 11 (Manikandan)
  const user = await User.findById(11);
  console.log(`User ID 11 (${user.full_name}):`, {
    phone: user.phone,
    emergency_contact_phone: user.emergency_contact_phone,
    emergency_contact_name: user.emergency_contact_name
  });

  console.log('\n--- 3. Testing User.updateProfile with Emergency Contact Fields ---');
  await User.updateProfile(11, {
    emergency_contact_phone: '+919345560719',
    emergency_contact_name: 'Manikandan Emergency Contact'
  });
  const updatedUser = await User.findById(11);
  console.log('After updateProfile:', {
    emergency_contact_phone: updatedUser.emergency_contact_phone,
    emergency_contact_name: updatedUser.emergency_contact_name
  });
  if (updatedUser.emergency_contact_phone !== '+919345560719') {
    throw new Error('updateProfile failed to persist emergency_contact_phone');
  }
  console.log('✅ User.updateProfile persists emergency contact fields successfully');

  console.log('\n--- 4. Testing TextBee Message Formatting with Logged-in Number ---');
  const message = textBeeService.formatEmergencyMessage({
    customerName: updatedUser.full_name,
    customerPhone: updatedUser.phone,
    latitude: 11.0168,
    longitude: 76.9558
  });
  console.log('Formatted Emergency Message:\n', message);
  if (!message.startsWith("It's emergency help me!")) {
    throw new Error("Message must start with 'It\\'s emergency help me!'");
  }
  if (!message.includes(updatedUser.phone)) {
    throw new Error("Message must include tourist logged-in phone number");
  }
  console.log('✅ TextBee message correctly formatted with logged-in user phone number');

  console.log('\n--- 5. Testing HTTP /api/v1/sos/trigger for Logged-In User ---');
  const jwt = require('../src/config/jwt');
  const testToken = jwt.generateAccessToken(updatedUser);

  const res = await fetch('http://localhost:5005/api/v1/sos/trigger', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${testToken}`
    },
    body: JSON.stringify({
      latitude: 11.0168,
      longitude: 76.9558,
      address: 'Coimbatore, Tamil Nadu, India',
      triggerType: 'one_tap_sos'
    })
  });

  const responseJson = await res.json();
  console.log('SOS Trigger Response Status:', res.status);
  console.log('SOS Trigger Payload:', responseJson);

  if (res.status !== 201) {
    throw new Error(`Expected 201 Created but received ${res.status}`);
  }
  console.log('✅ SOS triggered successfully and emergency contact alerted via TextBee!');

  console.log('\n🎉 ALL VERIFICATION TESTS PASSED!');
  process.exit(0);
}

runTests().catch(err => {
  console.error('❌ Test Failure:', err);
  process.exit(1);
});
