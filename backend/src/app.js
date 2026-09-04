const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const routes = require('./routes');
const { globalRateLimiter } = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Security HTTP headers with cross-origin asset support
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Dynamic CORS origin resolver supporting Tourist & Admin deployments
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
  if (!origin) return true; // Allow non-browser requests (e.g. mobile apps, curl, server-to-server)
  const normalized = origin.replace(/\/+$/, '');
  if (allowedOrigins.includes(normalized)) return true;
  // Allow all Vercel and Render deployments
  if (normalized.endsWith('.vercel.app') || normalized.endsWith('.onrender.com')) return true;
  if (process.env.NODE_ENV !== 'production') return true;
  return false;
};

app.use(
  cors({
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS policy blocked access from origin: ${origin}`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
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

const fs = require('fs');

// API v1 Routes
app.use('/api/v1', routes);

// Serve Admin Dashboard build if present
const adminDistPath = path.join(__dirname, '../../admin-dashboard/dist');
if (fs.existsSync(adminDistPath)) {
  app.use('/admin', express.static(adminDistPath));
  app.get('/admin/*', (req, res) => {
    res.sendFile(path.join(adminDistPath, 'index.html'));
  });
}

// Serve Tourist Frontend build if present
const frontendDistPath = path.join(__dirname, '../../frontend/dist');
if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads') || req.path.startsWith('/admin')) {
      return next();
    }
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
}

// Global Error Handler
app.use(errorHandler);

module.exports = app;
