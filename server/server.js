const path = require('path');
const express = require('express');
const dotenv = require('dotenv');

const connectDB = require('./config/db');
const seedDB = require('./utils/seeder');

const corsMiddleware = require('./config/cors');
const { securityMiddleware, authLimiter } = require('./config/security');

const { notFound, errorHandler } = require('./middleware/errorHandler');
const activityLogger = require('./middleware/activityLogger');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const roleRoutes = require('./routes/roleRoutes');
const requestInfoRoutes = require('./routes/requestInfoRoutes');
const activityLogRoutes = require('./routes/activityLogRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const paymentTrackerRoutes = require('./routes/paymentTrackerRoutes');

dotenv.config({
  path: path.resolve(__dirname, '.env'),
});

const app = express();

// Trust proxy for Render / production hosting
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Middlewares
app.use(corsMiddleware);
app.use(securityMiddleware);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(activityLogger);

// Root Route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Elite Hire Consultancy Backend Running Successfully',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date(),
  });
});

// Health Check Route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'healthy',
    message: 'Elite Hire Consultancy API is running',
    database:
      require('mongoose').connection.readyState === 1
        ? 'connected'
        : 'disconnected',
    timestamp: new Date(),
  });
});

// API Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/requestinfos', requestInfoRoutes);
app.use('/api/activitylogs', activityLogRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/payment-tracker', paymentTrackerRoutes);

// Optional React frontend serving
if (process.env.SERVE_CLIENT === 'true') {
  const clientPath = path.join(__dirname, '../client/dist');

  app.use(express.static(clientPath));

  app.get('*', (req, res, next) => {
    // Skip API routes
    if (req.path.startsWith('/api')) {
      return next();
    }

    res.sendFile(path.resolve(clientPath, 'index.html'));
  });
}

// 404 Handler
app.use(notFound);

// Global Error Handler
app.use(errorHandler);

// Port
const PORT = process.env.PORT || 5000;

// Start Server
const startServer = async () => {
  try {
    // Connect MongoDB
    await connectDB();

    // Seed DB if enabled
    if (process.env.SEED_ON_START !== 'false') {
      await seedDB();
    }

    const server = app.listen(PORT, () => {
      console.log(
        `🚀 Server running on port ${PORT} (${process.env.NODE_ENV || 'development'})`
      );
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use.`);
      } else {
        console.error('❌ Server Error:', err.message);
      }

      process.exit(1);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();