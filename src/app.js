const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const gameRoutes = require('./routes/game');
const contentRoutes = require('./routes/content');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Middleware
app.use(cors({
  origin: '*', // Allow all origins in dev, change to Vercel URL in production
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/content', contentRoutes);

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({ error: 'route_not_found' });
});

// Centralized error handler
app.use(errorHandler);

module.exports = app;
