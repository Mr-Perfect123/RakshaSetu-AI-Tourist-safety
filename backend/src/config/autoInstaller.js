const path = require('path');
const fs = require('fs');
const { runMigrations } = require(path.join(__dirname, '../../../database/migration_runner.js'));

const initAutoSetup = async () => {
  const envPath = path.join(__dirname, '../../.env');
  
  // 1. Auto-generate .env if missing
  if (!fs.existsSync(envPath)) {
    console.log('[Auto-Installer] Creating default .env configuration file...');
    const defaultEnv = `PORT=5005
NODE_ENV=development
CLIENT_URL=http://localhost:3000
ADMIN_URL=http://localhost:5173

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=Karan@skcet23
DB_NAME=rakshasetu_db
DB_PORT=3306
DB_CONNECTION_LIMIT=20

JWT_SECRET=rakshasetu_super_secret_jwt_access_key_2026
JWT_REFRESH_SECRET=rakshasetu_super_secret_jwt_refresh_key_2026
JWT_EXPIRES_IN=1d
JWT_REFRESH_EXPIRES_IN=7d

GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-flash-latest
`;
    fs.writeFileSync(envPath, defaultEnv, 'utf8');
  }

  // 2. Auto-run database migrations and verify schema
  await runMigrations();
};

module.exports = initAutoSetup;
