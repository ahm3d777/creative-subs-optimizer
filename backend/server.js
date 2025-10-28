require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const db = require('./src/config/database');
const alertService = require('./src/services/alertService');

// Import routes
const authRoutes = require('./src/routes/auth');
const subscriptionRoutes = require('./src/routes/subscriptions');
const analyticsRoutes = require('./src/routes/analytics');
const userRoutes = require('./src/routes/users');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Creative Subs Optimizer API is running' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/users', userRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!', 
    message: process.env.NODE_ENV === 'development' ? err.message : undefined 
  });
});

// Initialize database and start server
db.initialize()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🗄️  Database initialized successfully`);
      
      // Start cron jobs for alerts
      startCronJobs();
    });
  })
  .catch((err) => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });

// Cron job to check for alerts daily at 9 AM
function startCronJobs() {
  // Run daily at 9:00 AM
  cron.schedule('0 9 * * *', () => {
    console.log('🔔 Running daily alert check...');
    alertService.checkAndSendAlerts();
  });
  
  // Also run on startup (for testing)
  if (process.env.NODE_ENV === 'development') {
    console.log('🔔 Running initial alert check...');
    setTimeout(() => alertService.checkAndSendAlerts(), 5000);
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n📴 Shutting down gracefully...');
  db.close();
  process.exit(0);
});

module.exports = app;
