require('dotenv').config();

const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const shipmentRoutes = require('./routes/shipments');

const app = express();

const PORT = process.env.PORT || 3000;

// Trust proxy when deployed behind a reverse proxy/platform.
app.set('trust proxy', 1);

// Basic security and request handling.
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

// Health check.
app.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'logistics-portal-api',
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// API routes.
app.use('/api/auth', authRoutes);
app.use('/api/shipments', shipmentRoutes);

// 404 handler.
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'API endpoint not found'
  });
});

// Central error handler.
app.use((err, req, res, next) => {
  console.error('[SERVER ERROR]', err);

  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// Validate required production configuration.
if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  console.error('[SERVER] JWT_SECRET is required in production.');
  process.exit(1);
}

app.listen(PORT, () => {
  console.log(`[SERVER] Logistics Portal API running on port ${PORT}`);
  console.log(`[SERVER] Health check: /health`);
});
