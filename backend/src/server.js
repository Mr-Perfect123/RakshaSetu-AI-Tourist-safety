const path = require('path');
const dotenv = require('dotenv');
// Ensure environment variables are loaded immediately before any application module is evaluated
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const { initializeSocket } = require('./socket/sosSocket');
const { testConnection } = require('./config/database');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

// Initialize Socket.io WebSockets with dynamic origin support
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5000',
  'http://localhost:5005',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5000',
  'http://127.0.0.1:5005'
];

if (process.env.CLIENT_URL) allowedOrigins.push(process.env.CLIENT_URL.trim().replace(/\/+$/, ''));
if (process.env.ADMIN_URL) allowedOrigins.push(process.env.ADMIN_URL.trim().replace(/\/+$/, ''));
if (process.env.ALLOWED_ORIGINS) {
  process.env.ALLOWED_ORIGINS.split(',').forEach(o => {
    if (o.trim()) allowedOrigins.push(o.trim().replace(/\/+$/, ''));
  });
}

const isOriginAllowed = (origin) => {
  if (!origin) return true;
  const normalized = origin.replace(/\/+$/, '');
  if (allowedOrigins.includes(normalized)) return true;
  if (normalized.endsWith('.vercel.app') || normalized.endsWith('.onrender.com')) return true;
  if (process.env.NODE_ENV !== 'production') return true;
  return false;
};

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Socket CORS policy blocked access from origin: ${origin}`));
      }
    },
    methods: ['GET', 'POST'],
    credentials: true
  }
});

initializeSocket(io);

const initAutoSetup = require('./config/autoInstaller');

// Handle server startup errors gracefully (e.g. EADDRINUSE)
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    logger.error(`[Server Error] Port ${PORT} is already in use by another process. Please stop existing Node instances on port ${PORT}.`);
    process.exit(1);
  } else {
    logger.error(`[Server Error] Server encounter failure: ${err.message}`);
  }
});

// Start HTTP & WebSocket Listener
server.listen(PORT, async () => {
  logger.info(`=======================================================`);
  logger.info(`🚨 RAKSHASETU EMERGENCY DISPATCH SERVER RUNNING 🚨`);
  logger.info(`Port: ${PORT} | Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`API Base URL: http://localhost:${PORT}/api/v1`);
  logger.info(`=======================================================`);

  await initAutoSetup();
  await testConnection();

  // Trigger startup synchronization of global safety feeds
  try {
    const SafetyDataSyncService = require('./services/safetyDataSyncService');
    await SafetyDataSyncService.syncAllSources();
  } catch (err) {
    logger.warn(`[Sync Warning] Startup safety sync failed: ${err.message}`);
  }
});

module.exports = server;
