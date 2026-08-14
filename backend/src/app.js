const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const routes = require('./routes');
const { globalRateLimiter } = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Security HTTP headers
app.use(helmet());

// Enable Cross-Origin Resource Sharing
app.use(
  cors({
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
  })
);

// HTTP Request Logger
app.use(morgan('dev'));

// Body Parser Middleware
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Static Media File Directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Security Rate Limiting
app.use('/api', globalRateLimiter);

// Root API Status Endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'ONLINE',
    service: 'RakshaSetu AI Tourist Safety & Emergency Dispatch API Engine',
    version: '1.0.0',
    documentation: 'RakshaSetu Multi-Tenant Protection Network',
    healthCheck: '/api/v1/health',
    timestamp: new Date().toISOString()
  });
});

// API v1 Routes
app.use('/api/v1', routes);

// Global Error Handler
app.use(errorHandler);

module.exports = app;
