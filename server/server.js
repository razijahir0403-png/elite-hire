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

dotenv.config({ path: path.resolve(__dirname, '.env') });

const app = express();

if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

app.use(corsMiddleware);
app.use(securityMiddleware);
app.use(express.json({ limit: '1mb' }));
app.use(activityLogger);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    message: 'Elite Hire Consultancy API is running',
    database: require('mongoose').connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date(),
  });
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/requestinfos', requestInfoRoutes);
app.use('/api/activitylogs', activityLogRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/payment-tracker', paymentTrackerRoutes);

// Optional: serve built React app from same host (single-server deploy)
if (process.env.SERVE_CLIENT === 'true') {
  app.use(express.static(path.join(__dirname, '../client/dist')));

  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.resolve(__dirname, '../client', 'dist', 'index.html'));
  });
}

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    if (process.env.SEED_ON_START !== 'false') {
      await seedDB();
    }

    await new Promise((resolve, reject) => {
      const server = app.listen(PORT, () => {
        process.stderr.write(
          `Server listening on port ${PORT} (${process.env.NODE_ENV || 'development'})\n`
        );
        resolve(server);
      });

      server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          reject(
            new Error(
              `Port ${PORT} is already in use. Stop the other process or set PORT in environment variables.`
            )
          );
          return;
        }
        reject(err);
      });
    });
  } catch (error) {
    process.stderr.write(`Failed to start server: ${error.message}\n`);
    process.exit(1);
  }
};

startServer();
