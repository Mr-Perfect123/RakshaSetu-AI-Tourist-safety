const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const { initializeSocket } = require('./socket/sosSocket');
const { testConnection } = require('./config/database');
const logger = require('./utils/logger');
require('dotenv').config();

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

// Initialize Socket.io WebSockets
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

initializeSocket(io);

const initAutoSetup = require('./config/autoInstaller');

// Start HTTP & WebSocket Listener
server.listen(PORT, async () => {
  logger.info(`=======================================================`);
  logger.info(`🚨 RAKSHASETU EMERGENCY DISPATCH SERVER RUNNING 🚨`);
  logger.info(`Port: ${PORT} | Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`API Base URL: http://localhost:${PORT}/api/v1`);
  logger.info(`=======================================================`);

  await initAutoSetup();
  await testConnection();
});

module.exports = server;
