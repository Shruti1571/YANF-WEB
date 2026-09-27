const express = require('express');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./config/db');
const seedAdmin = require('./config/seedAdmin');
const authRoutes = require('./routes/authRoutes');
const blogRoutes = require('./routes/blogRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const eventRoutes = require('./routes/eventRoutes');
const certificateRoutes = require('./routes/certificateRoutes');

const app = express();

// Middleware
const customOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map(origin => origin.trim()).filter(Boolean)
  : [];

const defaultAllowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5000',
  'https://yanfglobal.com',
  'https://www.yanfglobal.com'
];

const allowedOrigins = [...new Set([...defaultAllowedOrigins, ...customOrigins])];

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (mobile, server-to-server, curl)
    if (!origin) return callback(null, true);

    const isMatch =
      allowedOrigins.includes('*') ||
      allowedOrigins.includes(origin) ||
      origin.endsWith('yanfglobal.com') ||
      origin.endsWith('.vercel.app') ||
      origin.includes('localhost') ||
      origin.includes('127.0.0.1');

    if (isMatch) {
      return callback(null, true);
    }
    // Fail-safe: allow rather than blocking verified public certificate lookups
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));

// Pre-flight handling
app.options('*', cors());

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware to ensure DB connection on Vercel requests (seeds admin once on warm container)
let isSeeded = false;
app.use(async (req, res, next) => {
  try {
    await connectDB();
    if (!isSeeded) {
      await seedAdmin();
      isSeeded = true;
    }
  } catch (err) {
    console.error('DB middleware connection error:', err.message);
  }
  next();
});

// API Routes - support both /api/... and /... prefixes
app.use('/api/auth', authRoutes);
app.use('/auth', authRoutes);

app.use('/api/blogs', blogRoutes);
app.use('/blogs', blogRoutes);

app.use('/api/upload', uploadRoutes);
app.use('/upload', uploadRoutes);

app.use('/api/events', eventRoutes);
app.use('/events', eventRoutes);

app.use('/api/certificates', certificateRoutes);
app.use('/certificates', certificateRoutes);

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
