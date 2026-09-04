require('dotenv').config();

const NODE_ENV = process.env.NODE_ENV || 'development';
const isProduction = NODE_ENV === 'production';

// Critical required environment variables
const REQUIRED_VARS = [
  'JWT_SECRET'
];

const WEAK_PATTERNS = [
  'secret',
  'password',
  '123456',
  'raksha',
  'jwt_secret',
  'placeholder',
  'your_secret'
];

// Startup validation for sensitive secrets
for (const varName of REQUIRED_VARS) {
  const val = process.env[varName];
  if (!val || typeof val !== 'string' || val.trim() === '') {
    throw new Error(`[Configuration Error] Critical environment variable '${varName}' is required but not set.`);
  }

  if (isProduction && varName === 'JWT_SECRET') {
    if (val.length < 32) {
      throw new Error(`[Configuration Error] 'JWT_SECRET' must be at least 32 characters long in production.`);
    }
    const lowerVal = val.toLowerCase();
    if (WEAK_PATTERNS.some(pat => lowerVal.includes(pat))) {
      throw new Error(`[Configuration Error] Insecure or default pattern detected in 'JWT_SECRET'. Please configure a strong random secret.`);
    }
  }
}


const config = {
  port: parseInt(process.env.PORT, 10) || 5005,
  nodeEnv: NODE_ENV,
  isProduction,
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
  adminUrl: process.env.ADMIN_URL || 'http://localhost:5173',
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'rakshasetu_db',
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT, 10) || 20
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  },
  google: {
    mapsApiKey: process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_PLACES_API_KEY || null,
    geminiApiKey: process.env.GEMINI_API_KEY || null,
    geminiModel: process.env.GEMINI_MODEL || 'gemini-1.5-flash'
  }
};

module.exports = config;
