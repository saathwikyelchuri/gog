require('dotenv').config();
const express = require('express');
const cors = require('cors');
const uploadRoutes = require('./routes/upload');
const queryRoutes = require('./routes/query');
const preloadRoutes = require('./routes/preload');

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'BI Dashboard API is running 🚀' });
});

// Routes
app.use('/api/upload', uploadRoutes);
app.use('/api/query', queryRoutes);
app.use('/api/preload', preloadRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    details: process.env.NODE_ENV !== 'production' ? err.stack : undefined
  });
});

app.listen(PORT, () => {
  console.log(`✅ BI Dashboard backend running at http://localhost:${PORT}`);
});
