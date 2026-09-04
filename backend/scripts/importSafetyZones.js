/**
 * Standalone CLI Script to import curated safety zones into MySQL
 * Usage: node backend/scripts/importSafetyZones.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const SeedCuratedSafetyZones = require('../src/services/safety/seedCuratedSafetyZones');
const { testConnection } = require('../src/config/database');

async function run() {
  console.log('=== RAKSHASETU SAFETY DATA MIGRATION RUNNER ===');
  await testConnection();
  const res = await SeedCuratedSafetyZones.seedCuratedZones();
  console.log(`Result: ${res.seeded} seeded, ${res.skipped} skipped/already present.`);
  process.exit(0);
}

run().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
