require('dotenv').config();

const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const shipmentRoutes = require('./routes/shipments');

const app = express();

const PORT = process.env.PORT || 3000;

// Trust proxy when deployed behind a reverse proxy.
app.set('trust proxy', 1);

// Basic middleware.
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// General API rate limit.
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests. Please try again later.'
  }
});

app.use('/api', apiLimiter);

// Stricter login protection.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many login attempts. Please try again later.'
  }
});

app.use('/api/auth/login', loginLimiter);

// Health check.
app.get('/health', (req, res) => {
  return res.json({
    success: true,
    message: 'Logistics Portal API is running',
    timestamp: new Date().toISOString()
  });
});

// API routes.
app.use('/api/auth', authRoutes);
app.use('/api/shipments', shipmentRoutes);

// 404 handler.
app.use((req, res) => {
  return res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Global error handler.
app.use((err, req, res, next) => {
  console.error('[SERVER] Unhandled error:', err);

  return res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

app.listen(PORT, () => {
  console.log('==========================================');
  console.log('     LOGISTICS PORTAL API');
  console.log('==========================================');
  console.log(`[SERVER] Running on port ${PORT}`);
  console.log(`[SERVER] Health: http://localhost:${PORT}/health`);
  console.log(`[SERVER] Auth:   http://localhost:${PORT}/api/auth`);
  console.log(`[SERVER] Ships:  http://localhost:${PORT}/api/shipments`);
  console.log('==========================================');
});

module.exports = app;
