const express = require('express');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./config/db');
const seedAdmin = require('./config/seedAdmin');
const authRoutes = require('./routes/authRoutes');
const blogRoutes = require('./routes/blogRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware to ensure DB connection on every Vercel request
app.use(async (req, res, next) => {
  try {
    await connectDB();
    await seedAdmin();
  } catch (err) {
    console.error('DB middleware connection error:', err.message);
  }
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/upload', uploadRoutes);

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'YANF Express API',
    status: 'online',
    timestamp: new Date().toISOString()
  });
});

app.get('/api', (req, res) => {
  res.json({
    message: 'YANF REST API Endpoint online',
    status: 200
  });
});

// Start standalone server when run directly (not serverless)
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 YANF Express API Server running on port ${PORT}`);
  });
}

module.exports = app;
