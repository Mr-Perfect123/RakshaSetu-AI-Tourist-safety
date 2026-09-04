const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const initDatabase = async () => {
  const host = process.env.DB_HOST || 'localhost';
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const port = parseInt(process.env.DB_PORT, 10) || 3306;

  let connection = null;

  try {
    connection = await mysql.createConnection({
      host,
      user,
      password,
      port,
      multipleStatements: true
    });

    console.log(`[MySQL Setup] Successfully connected to MySQL server '${host}:${port}' as user '${user}'.`);

    const sqlFilePath = path.join(__dirname, '../../../database/rakshasetu_db.sql');
    if (fs.existsSync(sqlFilePath)) {
      const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
      console.log('[MySQL Setup] Creating database rakshasetu_db and executing DDL tables & seed scripts...');
      await connection.query(sqlContent);
      console.log('[MySQL Setup] rakshasetu_db Database initialized successfully with all 19 tables & seed records!');
    }

    await connection.end();
    return true;
  } catch (err) {
    console.error(`[MySQL Setup Error] ${err.message}`);
    if (connection) await connection.end();
    return false;
  }
};

if (require.main === module) {
  initDatabase();
}

module.exports = initDatabase;
