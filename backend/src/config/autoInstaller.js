const path = require('path');
const fs = require('fs');
const { runMigrations } = require(path.join(__dirname, '../../../database/migration_runner.js'));

const initAutoSetup = async () => {
  const envPath = path.join(__dirname, '../../.env');
  const envExamplePath = path.join(__dirname, '../../.env.example');

  // 1. Initialize .env template from .env.example if missing
  if (!fs.existsSync(envPath)) {
    if (fs.existsSync(envExamplePath)) {
      console.log('[Auto-Installer] Creating initial .env from .env.example template. Please configure your environment credentials.');
      fs.copyFileSync(envExamplePath, envPath);
    } else {
      console.warn('[Auto-Installer] .env file not found. Ensure environment variables are configured.');
    }
  }

  // 2. Run database migrations and verify schema
  await runMigrations();
};

module.exports = initAutoSetup;
