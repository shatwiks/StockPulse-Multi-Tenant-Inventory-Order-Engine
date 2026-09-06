import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import apiRoutes from './api/routes';
import {
  getApiDocsUiHandler,
  getOpenApiSpecHandler,
  getSwaggerUiHandler,
} from './docs/docs.controller';

dotenv.config();

export const app = express();
const PORT = process.env.PORT || 3001;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

// 1. Enterprise Security Headers (Helmet)
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// 2. Strict CORS Origin Configuration (No wildcard *)
const allowedOrigins = [
  CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  'http://127.0.0.1:3002',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser agents (curl, postman, server-to-server) without origin
      if (!origin) {
        return callback(null, true);
      }

      // In development / test, permit any localhost or 127.0.0.1 port (e.g. Next.js on 3000-3005)
      if (process.env.NODE_ENV !== 'production') {
        const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:[0-9]+)?$/.test(origin);
        if (isLocalhost) {
          return callback(null, true);
        }
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// 3. Rate Limiting Middleware (Brute-force & DoS mitigation)
const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'TOO_MANY_REQUESTS',
    message: 'Rate limit exceeded. Please retry after 15 minutes.',
  },
});
app.use('/api/', apiRateLimiter);

// 4. Request Body Parsers with 1MB Payload Limit
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

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

// Root Landing / Service Info
app.get('/', (req, res) => {
  if (req.accepts('html')) {
    return res.redirect('/docs');
  }
  res.json({
    service: 'StockPulse Multi-Tenant Inventory & Order Engine API',
    status: 'healthy',
    version: '2.4.0',
    documentation: '/docs',
    endpoints: {
      health: '/health',
      apiDocs: '/docs',
      openApiJson: '/api/v1/openapi.json',
      apiV1: '/api/v1',
    },
    clientApp: CLIENT_URL || 'http://localhost:3000',
  });
});

app.get('/api', (req, res) => {
  res.redirect('/docs');
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'StockPulse Inventory & Order Engine',
  });
});

// Interactive OpenAPI 3.0 Documentation Consoles
app.get('/docs', getApiDocsUiHandler);
app.get('/api/docs', getApiDocsUiHandler);
app.get('/swagger', getSwaggerUiHandler);
app.get('/api/swagger', getSwaggerUiHandler);
app.get('/api/v1/openapi.json', getOpenApiSpecHandler);

// API Routes
app.use('/api/v1', apiRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Cannot ${req.method} ${req.path}`,
    },
    message: `Cannot ${req.method} ${req.path}`,
  });
});

// Start Server if executed directly
const isDirectExecution =
  require.main === module ||
  (process.argv[1] && (process.argv[1].endsWith('server.ts') || process.argv[1].endsWith('server.js')));

if (process.env.NODE_ENV !== 'test' && isDirectExecution) {
  app.listen(PORT, () => {
    console.log(`===============================================================`);
    console.log(`⚡ StockPulse API Server listening on http://localhost:${PORT}`);
    console.log(`⚡ Atomic Checkout Endpoint: POST http://localhost:${PORT}/api/v1/orders`);
    console.log(`===============================================================`);
  });
}

export default app;
