import 'dotenv/config';
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

async function generatePrismaClient() {
  // Check if Prisma client already exists
  const prismaClientPath = join(process.cwd(), 'node_modules', '.prisma', 'client');

  if (existsSync(prismaClientPath)) {
    console.log('=====> Prisma client already exists, skipping generation');
    return;
  }

  const maxRetries = 3;
  for (let i = 0; i < maxRetries; i++) {
    try {
      console.log(`Running \`prisma generate\` (attempt ${i + 1}/${maxRetries})...`);
      execSync('npx prisma generate', { stdio: 'inherit' });
      console.log('=====> Prisma generate completed successfully');
      return;
    } catch (err: any) {
      console.warn(`=====> Attempt ${i + 1} failed:`, err.message || err);

      if (i < maxRetries - 1) {
        console.log(`=====> Waiting 2 seconds before retry...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      } else {
        console.warn('=====> Warning: Could not run `prisma generate` after all retries.');
        console.warn('=====> This is likely due to OneDrive file locking.');
        console.warn('=====> To fix this issue, try one of these solutions:');
        console.warn('=====> 1. Run PowerShell as Administrator and execute: npx prisma generate');
        console.warn('=====> 2. Pause OneDrive sync temporarily');
        console.warn('=====> 3. Move the project outside OneDrive folder');
      }
    }
  }
}

await generatePrismaClient();

import { prisma } from './src/utils/database.js';
import { redis } from './src/utils/redis.js';
import { queueService } from './src/services/queue.service.js';
import express, { type Application } from 'express';
import cors, { type CorsOptions } from 'cors';
import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import userRoutes from './src/routes/user.route.js';
import providerRoutes from './src/routes/provider.route.js';
import companyRoutes from './src/routes/company.route.js';
import servicesRoutes from './src/routes/services.route.js';
import categoryRoutes from './src/routes/category.route.js';
import adminRoutes from './src/Admin/routes/admin.route.js';
import confirmationRoutes from './src/routes/confirmation.route.js';
import bookingRoutes from './src/routes/booking.route.js';
import reviewRoutes from './src/routes/review.route.js';
import serviceReviewRoutes from './src/routes/serviceReview.route.js';
import serviceRequestRoutes from './src/routes/serviceRequest.route.js';
import notificationRoutes from './src/routes/notification.route.js';
import internalRoutes from './src/routes/internal.route.js';
import scheduleRoutes from './src/routes/schedule.route.js';
import healthRoutes from './src/routes/health.route.js';
import errorHandler from './src/middlewares/errorHandler.middleware.js';

// Simple database test function
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

// CORS configuration (must run before any rate limiting or routes)
const corsOptions: CorsOptions = {
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['*'],
  credentials: true,
};
app.use(cors(corsOptions));

// Rate limiting — backed by Redis (shared across all pods) instead of the default
// in-memory store, which only counted requests hitting that one process. With N
// replicas the in-memory version let each pod give every client its own separate
// quota (an effective N× multiplier), and reset the count on every pod restart/deploy.
const limiter = rateLimit({
  windowMs: 30 * 60 * 1000, // 30 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX || '1000', 10),
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  // Do not rate-limit CORS preflight requests
  skip: (req) => req.method === 'OPTIONS',
  store: new RedisStore({
    sendCommand: (...args: string[]) => redis.call(...(args as [string, ...string[]])) as Promise<any>,
  }),
});

// Apply rate limiting to all routes
app.use(limiter);

// Uploaded images/videos are served from S3-compatible object storage now (see
// src/utils/s3.ts) — no local /uploads static route or disk volume needed anymore.
// Increase JSON payload limit for file uploads
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/api/users', userRoutes);
app.use('/api/providers', providerRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/bookings', bookingRoutes);
// Superseded by /api/bookings - kept mounted so older clients don't hard-fail
// mid-deploy, but the booking panel no longer calls it.
app.use('/api/confirmations', confirmationRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/service-reviews', serviceReviewRoutes);
app.use('/api/service-requests', serviceRequestRoutes);
app.use('/api/notifications', notificationRoutes);

app.use('/api/schedule', scheduleRoutes);
app.use('/internal', internalRoutes);
app.use('/', healthRoutes);

// Must be registered after every route — see the comment in errorHandler.middleware.ts.
app.use(errorHandler);

const PORT: number = parseInt(process.env.PORT || '3000', 10);

// Start server with basic database test
async function startServer() {
  console.log('=====> Starting server...');

  const dbConnected = await testDatabaseConnection();

  if (!dbConnected) {
    console.error('=====> Server startup aborted due to database connection failure');
    process.exit(1);
  }

  // Initialize queue service
  try {
    await queueService.connect();
    queueService.setupGracefulShutdown();
    console.log('=====> RabbitMQ connection established');
  } catch (error) {
    console.error('=====> RabbitMQ connection failed, emails will not be sent:', error);
    // Don't exit - continue without email functionality
  }

  // Booking reminders now run as a Kubernetes CronJob (src/jobs/send-booking-reminders.ts)
  // instead of an in-process node-cron timer, to avoid duplicate sends once this
  // service is scaled to multiple replicas.

  app.listen(PORT, () => {
    console.log(`=====> Core service running on port ${PORT}`);
  });
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('==xx== Received SIGINT, shutting down...');
  await queueService.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('==xx== Received SIGTERM, shutting down...');
  await queueService.close();
  process.exit(0);
});

// Start the server
startServer().catch((error) => {
  console.error('=====> Failed to start server:', error);
  process.exit(1);
});
