import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Route imports
import guestRoutes from './routes/guests.js';
import rideRoutes from './routes/rides.js';
import smsRoutes from './routes/sms.js';
import calendarRoutes from './routes/calendar.js';
import hotelRoutes from './routes/hotels.js';
import authRoutes from './routes/auth.js';
import analyticsRoutes from './routes/analytics.js';
import reminderRoutes from './routes/reminders.js';
import { startReminderScheduler } from './services/reminders.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // For Twilio webhooks

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/guests', guestRoutes);
app.use('/api/rides', rideRoutes);
app.use('/api/sms', smsRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/hotels', hotelRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/reminders', reminderRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, () => {
  console.log(`🚗 Valet Service API running on port ${PORT}`);
  
  // Start the reminder scheduler (checks every minute)
  startReminderScheduler(60000);
});

export default app;
