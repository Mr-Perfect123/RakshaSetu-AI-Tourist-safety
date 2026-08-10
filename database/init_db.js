const path = require('path');
const mysql = require(path.join(__dirname, '../backend/node_modules/mysql2/promise'));
const fs = require('fs');
require(path.join(__dirname, '../backend/node_modules/dotenv')).config({ path: path.join(__dirname, '../backend/.env') });

const initDatabase = async () => {
  try {
    console.log('[MySQL Init] Connecting to MySQL server on host:', process.env.DB_HOST);
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'Karan@skcet23',
      multipleStatements: true
    });

    console.log('[MySQL Init] Connected successfully! Executing database DDL script rakshasetu_db.sql...');
    const sqlScriptPath = path.join(__dirname, 'rakshasetu_db.sql');
    const sqlScript = fs.readFileSync(sqlScriptPath, 'utf8');

    await connection.query(sqlScript);
    console.log('[MySQL Init] 🎉 Database rakshasetu_db created and populated with all 18 tables and seed data!');
    await connection.end();
  } catch (err) {
    console.error('[MySQL Init Error]', err.message);
  }
};

initDatabase();
