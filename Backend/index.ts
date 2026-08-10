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
import { queueService } from './src/services/queue.service.js';
import { scheduledJobsService } from './src/services/scheduled-jobs.service.js';
import express, { type Application } from 'express';
import cors, { type CorsOptions } from 'cors';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import userRoutes from './src/routes/user.route.js';
import providerRoutes from './src/routes/provider.route.js';
import companyRoutes from './src/routes/company.route.js';
import servicesRoutes from './src/routes/services.route.js';
import categoryRoutes from './src/routes/category.route.js';
import adminRoutes from './src/Admin/routes/admin.route.js';
import confirmationRoutes from './src/routes/confirmation.route.js';
import reviewRoutes from './src/routes/review.route.js';
import serviceReviewRoutes from './src/routes/serviceReview.route.js';
import serviceRequestRoutes from './src/routes/serviceRequest.route.js';
import paymentRoutes from './src/routes/payment.route.js';
import notificationRoutes from './src/routes/notification.route.js';

import scheduleRoutes from './src/routes/schedule.route.js';

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
const server = createServer(app);

// Socket.IO setup with messaging namespace
const io = new SocketIOServer(server, {
  cors: {
    origin: true, // reflect request origin (allows all origins)
    credentials: true,
  },
});

// Get the messaging namespace
const messagingIo = io.of('/messaging');
const jwtSecret = process.env.JWT_SECRET;

function getBearerToken(headerValue?: string | string[]): string | null {
  if (!headerValue) return null;
  const header = Array.isArray(headerValue) ? headerValue[0] : headerValue;
  if (!header?.startsWith('Bearer ')) return null;
  return header.slice(7);
}

messagingIo.use((socket, next) => {
  try {
    if (!jwtSecret) {
      return next(new Error('Socket auth unavailable'));
    }

    const authToken = typeof socket.handshake.auth?.token === 'string'
      ? socket.handshake.auth.token
      : null;
    const headerToken = getBearerToken(socket.handshake.headers.authorization);
    const token = authToken || headerToken;

    if (!token) {
      return next(new Error('Unauthorized: token missing'));
    }

    const decoded = jwt.verify(token, jwtSecret) as jwt.JwtPayload & { id?: string };
    if (!decoded?.id) {
      return next(new Error('Unauthorized: invalid token payload'));
    }

    socket.data.userId = decoded.id;
    return next();
  } catch (error) {
    return next(new Error('Unauthorized: token invalid'));
  }
});

// Socket.IO connection handling for messaging namespace
const connectedUsers = new Map<string, string>(); // userId -> socketId
const activeConversations = new Map<string, string>(); // userId -> conversationId

messagingIo.on('connection', (socket) => {
  const socketUserId = socket.data.userId as string;
  connectedUsers.set(socketUserId, socket.id);
  console.log(`Client connected: ${socket.id} (user ${socketUserId})`);
  messagingIo.emit('user:online', { userId: socketUserId, status: 'online' });

  // Handle user join
  socket.on('user:join', () => {
    socket.emit('user:joined', { success: true, userId: socketUserId });
  });

  // Handle conversation enter
  socket.on('conversation:enter', async (data: { conversationId: string }) => {
    const { conversationId } = data;
    const conversation = await prisma.conversation.findUnique({ where: { id: conversationId } });
    if (!conversation || !conversation.userIds.includes(socketUserId)) {
      socket.emit('message:error', { error: 'Not authorized for this conversation' });
      return;
    }
    activeConversations.set(socketUserId, conversationId);
    console.log(`User ${socketUserId} entered conversation ${conversationId}`);
    
    socket.emit('conversation:entered', { success: true, conversationId });
  });

  // Handle conversation leave
  socket.on('conversation:leave', () => {
    const conversationId = activeConversations.get(socketUserId);
    activeConversations.delete(socketUserId);
    console.log(`User ${socketUserId} left conversation ${conversationId}`);
    
    socket.emit('conversation:left', { success: true });
  });

  // Handle message send
  socket.on('message:send', async (data: { content: string; toId: string; conversationId: string }) => {
    try {
      const conversation = await prisma.conversation.findUnique({ where: { id: data.conversationId } });
      if (!conversation || !conversation.userIds.includes(socketUserId) || !conversation.userIds.includes(data.toId)) {
        socket.emit('message:error', { error: 'Not authorized for this conversation' });
        return;
      }

      // Create message in database
      const message = await prisma.message.create({
        data: {
          content: data.content,
          fromId: socketUserId,
          toId: data.toId,
          conversationId: data.conversationId,
        },
      });

      console.log('Message saved to DB:', message);
      
      // Emit to sender (confirmation)
      socket.emit('message:sent', message);
      
      // Emit to recipient if they're online
      const recipientSocketId = connectedUsers.get(data.toId);
      if (recipientSocketId) {
        console.log(`Recipient ${data.toId} is online, socket: ${recipientSocketId}`);
        messagingIo.to(recipientSocketId).emit('message:received', message);
        console.log(`Message delivered to recipient ${data.toId}`);
        
        // Auto-mark as read if recipient is actively viewing this conversation
        const recipientActiveConversation = activeConversations.get(data.toId);
        if (recipientActiveConversation === message.conversationId) {
          try {
            await prisma.message.update({
              where: { id: message.id },
              data: { receivedAt: new Date() },
            });
            console.log(`Auto-marked message ${message.id} as read for actively viewing user ${data.toId}`);
            
            // Emit read receipt to sender
            socket.emit('message:read-receipt', {
              messageId: message.id,
              readBy: data.toId,
              readAt: new Date().toISOString()
            });
            
            // Also emit to recipient that message was auto-marked as read
            messagingIo.to(recipientSocketId).emit('message:auto-read', {
              messageId: message.id,
              conversationId: message.conversationId
            });
          } catch (error) {
            console.error('Error auto-marking as read:', error);
          }
        }
      } else {
        console.log(`Recipient ${data.toId} is offline`);
      }
      
      socket.emit('message:success', { success: true, message });
    } catch (error: any) {
      console.error('Error sending message:', error);
      socket.emit('message:error', { error: error.message });
    }
  });

  // Handle mark message as read
  socket.on('message:mark-read', async (data: { messageId: string }) => {
    try {
      const { messageId } = data;
      const message = await prisma.message.findUnique({ where: { id: messageId } });
      if (!message || message.toId !== socketUserId) {
        socket.emit('message:error', { error: 'Not authorized to mark this message as read' });
        return;
      }
      
      const updatedMessage = await prisma.message.update({
        where: { id: messageId },
        data: { receivedAt: new Date() },
      });
      
      // Emit read receipt to sender if they're online
      const senderSocketId = connectedUsers.get(updatedMessage.fromId);
      if (senderSocketId) {
        messagingIo.to(senderSocketId).emit('message:read-receipt', {
          messageId,
          readBy: socketUserId,
          readAt: updatedMessage.receivedAt
        });
      }
      
      socket.emit('message:marked-read', { messageId, success: true });
    } catch (error: any) {
      console.error(`Error marking message as read: ${error.message}`);
      socket.emit('message:error', { error: error.message });
    }
  });

  // Handle mark conversation as read
  socket.on('conversation:mark-read', async (data: { conversationId: string }) => {
    try {
      const { conversationId } = data;
      const conversation = await prisma.conversation.findUnique({ where: { id: conversationId } });
      if (!conversation || !conversation.userIds.includes(socketUserId)) {
        socket.emit('message:error', { error: 'Not authorized for this conversation' });
        return;
      }
      
      await prisma.message.updateMany({
        where: {
          conversationId,
          toId: socketUserId,
          receivedAt: null,
        },
        data: { receivedAt: new Date() },
      });
      
      socket.emit('conversation:marked-read', { 
        conversationId, 
        success: true 
      });
    } catch (error: any) {
      console.error(`Error marking conversation as read: ${error.message}`);
      socket.emit('message:error', { error: error.message });
    }
  });

  // Handle get online users
  socket.on('users:online', () => {
    const onlineUserIds = Array.from(connectedUsers.keys());
    socket.emit('users:online-list', onlineUserIds);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
    connectedUsers.delete(socketUserId);
    activeConversations.delete(socketUserId);
    console.log(`User ${socketUserId} disconnected`);
    messagingIo.emit('user:offline', { userId: socketUserId, status: 'offline' });
  });
});

// Broadcast confirmation update function
function broadcastConfirmationUpdate(conversationId: string, confirmation: any) {
  // Find all users in this conversation
  for (const [userId, activeConvId] of activeConversations.entries()) {
    if (activeConvId === conversationId) {
      const socketId = connectedUsers.get(userId);
      if (socketId) {
        messagingIo.to(socketId).emit('confirmation_updated', { conversationId, confirmation });
      }
    }
  }
  console.log(`Broadcasted confirmation update for conversation ${conversationId}`);
}

// Make broadcastConfirmationUpdate available globally for routes
(global as any).broadcastConfirmationUpdate = broadcastConfirmationUpdate;

// CORS configuration (must run before any rate limiting or routes)
const corsOptions: CorsOptions = {
  origin: true, 
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['*'], 
  credentials: true,
};
app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: 30 * 60 * 1000, // 30 minutes
  max: 10000, // increased limit for development
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  // Do not rate-limit CORS preflight requests
  skip: (req) => req.method === 'OPTIONS',
});

// Apply rate limiting to all routes
app.use(limiter);

// Stripe webhook must receive the raw body for signature verification.
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

// Increase JSON payload limit for file uploads
app.use('/uploads', express.static(join(process.cwd(), 'uploads')));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/api/users', userRoutes);
app.use('/api/providers', providerRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/confirmations', confirmationRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/service-reviews', serviceReviewRoutes);
app.use('/api/service-requests', serviceRequestRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/notifications', notificationRoutes);

app.use('/api/schedule', scheduleRoutes);

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

  // Start scheduled jobs
  try {
    scheduledJobsService.startAllJobs();
    console.log('=====> Scheduled jobs started');
  } catch (error) {
    console.error('=====> Failed to start scheduled jobs:', error);
    // Don't exit - continue without scheduled jobs
  }
  
  server.listen(PORT, () => {
    console.log(`=====> Server running on port ${PORT}`);
    console.log(`=====> Socket.IO messaging server available at /messaging`);
  });
}

// Graceful shutdown for scheduled jobs
process.on('SIGINT', async () => {
  console.log('==xx== Received SIGINT, shutting down scheduled jobs...');
  scheduledJobsService.stopAllJobs();
  await queueService.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('==xx== Received SIGTERM, shutting down scheduled jobs...');
  scheduledJobsService.stopAllJobs();
  await queueService.close();
  process.exit(0);
});

// Start the server
startServer().catch((error) => {
  console.error('=====> Failed to start server:', error);
  process.exit(1);
});
