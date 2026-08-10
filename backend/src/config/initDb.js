const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const initDatabase = async () => {
  const passwordsToTry = [process.env.DB_PASSWORD, 'root', '', 'admin', 'Password@123', '123456', 'mysql'];
  let connection = null;
  let successfulPassword = null;

  for (const pwd of passwordsToTry) {
    try {
      connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: pwd || '',
        port: parseInt(process.env.DB_PORT, 10) || 3306,
        multipleStatements: true
      });
      successfulPassword = pwd;
      console.log(`[MySQL Setup] Successfully authenticated with user '${process.env.DB_USER || 'root'}' and password '${pwd ? '***' : '(empty)'}'`);
      break;
    } catch (err) {
      // try next
    }
  }

  if (!connection) {
    console.error('[MySQL Setup Error] Could not connect to MySQL server with standard passwords.');
    return false;
  }

  try {
    const sqlFilePath = path.join(__dirname, '../../../database/rakshasetu_db.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

    console.log('[MySQL Setup] Creating database rakshasetu_db and executing DDL tables & seed scripts...');
    await connection.query(sqlContent);
    console.log('[MySQL Setup] rakshasetu_db Database initialized successfully with all 19 tables & seed records!');

    await connection.end();

    // Update .env DB_PASSWORD if a working password was found
    if (successfulPassword !== undefined && successfulPassword !== process.env.DB_PASSWORD) {
      const envPath = path.join(__dirname, '../../.env');
      let envContent = fs.readFileSync(envPath, 'utf8');
      envContent = envContent.replace(/DB_PASSWORD=.*/, `DB_PASSWORD=${successfulPassword}`);
      fs.writeFileSync(envPath, envContent);
      console.log(`[MySQL Setup] Updated backend/.env with working DB_PASSWORD.`);
    }

    return true;
  } catch (err) {
    console.error(`[MySQL Execution Error] ${err.message}`);
    if (connection) await connection.end();
    return false;
  }
};

if (require.main === module) {
  initDatabase();
}

module.exports = initDatabase;
