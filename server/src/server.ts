import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRoutes from './api/routes';

dotenv.config();

export const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());

// Request logging in development
if (process.env.NODE_ENV !== 'test') {
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(`[HTTP] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`);
    });
    next();
  });
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'StockPulse Inventory & Order Engine',
  });
});

// API Routes
app.use('/api/v1', apiRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    error: 'NOT_FOUND',
    message: `Cannot ${req.method} ${req.path}`,
  });
});

// Start Server if executed directly
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`===============================================================`);
    console.log(`⚡ StockPulse API Server listening on http://localhost:${PORT}`);
    console.log(`⚡ Atomic Checkout Endpoint: POST http://localhost:${PORT}/api/v1/orders`);
    console.log(`===============================================================`);
  });
}

export default app;
