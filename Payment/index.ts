import 'dotenv/config';
import { prisma } from './src/utils/database.js';
import express, { type Application } from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import paymentRoutes from './src/routes/payment.route.js';
import adminRoutes from './src/routes/admin.route.js';

async function testDatabaseConnection() {
  try {
    await prisma.$queryRaw`SELECT 1 as test`;
    console.log('=====> Database connection successful');
    return true;
  } catch (error: any) {
    console.error('=====> Database connection failed:', error.message);
    return false;
  }
}

const app: Application = express();

app.use(cors({ origin: true, credentials: true }));

const limiter = rateLimit({
  windowMs: 30 * 60 * 1000,
  max: 10000,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === 'OPTIONS',
});
app.use(limiter);

// PayHere's notify_url IPN is application/x-www-form-urlencoded, same as normal form posts —
// no raw-body/signature-header special-casing needed (unlike Stripe's webhook).
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'payment' }));

app.use('/api/payments', paymentRoutes);
// Payment-data admin analytics — reachable at /api/admin/analytics/* via a specific
// ingress rule that takes precedence over the general /api/admin -> core-service rule.
app.use('/api/admin', adminRoutes);

const PORT: number = parseInt(process.env.PORT || '3002', 10);

async function startServer() {
  const dbConnected = await testDatabaseConnection();

  if (!dbConnected) {
    console.error('=====> Server startup aborted due to database connection failure');
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`=====> Payment service running on port ${PORT}`);
  });
}

startServer().catch((error) => {
  console.error('=====> Failed to start payment service:', error);
  process.exit(1);
});
