const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { executeQuery, pool } = require('../src/config/database');
const User = require('../src/models/User');
const EmergencyContact = require('../src/models/EmergencyContact');
const textBeeService = require('../src/services/textBeeService');
const NotificationService = require('../src/services/notificationService');

async function testMultiContact() {
  console.log('--- 1. Testing Database emergency_contacts JSON array for users ---');
  const users = await executeQuery('SELECT id, full_name, phone, emergency_contact_name, emergency_contact_phone, emergency_contacts FROM users WHERE id IN (10, 11)');
  console.log('Database users query:', JSON.stringify(users, null, 2));

  console.log('\n--- 2. Testing User.findById parsing ---');
  const user10 = await User.findById(10);
  console.log('User 10 emergency_contacts type:', Array.isArray(user10.emergency_contacts) ? 'Array' : typeof user10.emergency_contacts);
  console.log('User 10 emergency_contacts:', user10.emergency_contacts);

  console.log('\n--- 3. Testing EmergencyContact.findByUserId ---');
  const contactsFromTable = await EmergencyContact.findByUserId(10);
  console.log('Emergency contacts from table for User 10:', contactsFromTable);

  console.log('\n--- 4. Testing Multi-Recipient Emergency SMS Dispatch Simulation ---');
  // Clear deduplication cache so this test can run fresh
  textBeeService.clearDeduplicationCache();

  // Extract all contact phones
  const contactPhones = (user10.emergency_contacts || []).map(c => c.phone);
  console.log('Testing dispatch to numbers:', contactPhones);

  const testResult = await textBeeService.sendEmergencySMS({
    customerId: user10.id,
    customerName: user10.full_name,
    customerPhone: user10.phone,
    recipientPhones: contactPhones,
    latitude: 12.9716,
    longitude: 77.5946,
    sosCode: 'SOS-TEST-MULTI'
  });

  console.log('Test dispatch result:', JSON.stringify(testResult, null, 2));

  if (pool && pool.end) {
    await pool.end();
  }
}

testMultiContact().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
