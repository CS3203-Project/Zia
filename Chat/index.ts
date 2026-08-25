import 'dotenv/config';
import { prisma } from './src/utils/database.js';
import { queueService } from './src/services/queue.service.js';
import express, { type Application } from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { RedisStore } from 'rate-limit-redis';
import { redis } from './src/utils/redis.js';
import messagingRoutes from './src/routes/messaging.route.js';
import internalRoutes from './src/routes/internal.route.js';

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

const io = new SocketIOServer(server, {
  cors: { origin: true, credentials: true },
});

// Socket.IO Redis adapter — routes io.to(socketId)/room emits through Redis pub/sub so
// they reach the right socket regardless of which pod actually holds that connection.
// Without this, once this service runs more than one replica, a user connected to pod A
// is invisible to `io.to(...)` calls issued from pod B. The adapter needs a dedicated
// subscriber connection (per the socket.io-redis-adapter docs), hence the duplicate().
const pubClient = redis;
const subClient = pubClient.duplicate();
io.adapter(createAdapter(pubClient, subClient));

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

    const authToken = typeof socket.handshake.auth?.token === 'string' ? socket.handshake.auth.token : null;
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

// Presence state lives in Redis (not process memory) so it's shared across all pods —
// a user connected to one pod must still be discoverable/reachable from any other pod.
const CONNECTED_USERS_KEY = 'chat:connected_users'; // Redis hash: userId -> socketId
const ACTIVE_CONVERSATIONS_KEY = 'chat:active_conversations'; // Redis hash: userId -> conversationId

messagingIo.on('connection', async (socket) => {
  const socketUserId = socket.data.userId as string;
  await redis.hset(CONNECTED_USERS_KEY, socketUserId, socket.id);
  console.log(`Client connected: ${socket.id} (user ${socketUserId})`);
  messagingIo.emit('user:online', { userId: socketUserId, status: 'online' });

  socket.on('user:join', () => {
    socket.emit('user:joined', { success: true, userId: socketUserId });
  });

  socket.on('conversation:enter', async (data: { conversationId: string }) => {
    const { conversationId } = data;
    const conversation = await prisma.conversation.findUnique({ where: { id: conversationId } });
    if (!conversation || !conversation.userIds.includes(socketUserId)) {
      socket.emit('message:error', { error: 'Not authorized for this conversation' });
      return;
    }
    await redis.hset(ACTIVE_CONVERSATIONS_KEY, socketUserId, conversationId);
    socket.emit('conversation:entered', { success: true, conversationId });
  });

  socket.on('conversation:leave', async () => {
    const conversationId = await redis.hget(ACTIVE_CONVERSATIONS_KEY, socketUserId);
    await redis.hdel(ACTIVE_CONVERSATIONS_KEY, socketUserId);
    console.log(`User ${socketUserId} left conversation ${conversationId}`);
    socket.emit('conversation:left', { success: true });
  });

  socket.on('message:send', async (data: { content: string; toId: string; conversationId: string }) => {
    try {
      const conversation = await prisma.conversation.findUnique({ where: { id: data.conversationId } });
      if (!conversation || !conversation.userIds.includes(socketUserId) || !conversation.userIds.includes(data.toId)) {
        socket.emit('message:error', { error: 'Not authorized for this conversation' });
        return;
      }

      const message = await prisma.message.create({
        data: {
          content: data.content,
          fromId: socketUserId,
          toId: data.toId,
          conversationId: data.conversationId,
        },
      });

      socket.emit('message:sent', message);

      const recipientSocketId = await redis.hget(CONNECTED_USERS_KEY, data.toId);
      if (recipientSocketId) {
        messagingIo.to(recipientSocketId).emit('message:received', message);

        const recipientActiveConversation = await redis.hget(ACTIVE_CONVERSATIONS_KEY, data.toId);
        if (recipientActiveConversation === message.conversationId) {
          try {
            await prisma.message.update({
              where: { id: message.id },
              data: { receivedAt: new Date() },
            });

            socket.emit('message:read-receipt', {
              messageId: message.id,
              readBy: data.toId,
              readAt: new Date().toISOString(),
            });

            messagingIo.to(recipientSocketId).emit('message:auto-read', {
              messageId: message.id,
              conversationId: message.conversationId,
            });
          } catch (error) {
            console.error('Error auto-marking as read:', error);
          }
        }
      }

      socket.emit('message:success', { success: true, message });
    } catch (error: any) {
      console.error('Error sending message:', error);
      socket.emit('message:error', { error: error.message });
    }
  });

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

      const senderSocketId = await redis.hget(CONNECTED_USERS_KEY, updatedMessage.fromId);
      if (senderSocketId) {
        messagingIo.to(senderSocketId).emit('message:read-receipt', {
          messageId,
          readBy: socketUserId,
          readAt: updatedMessage.receivedAt,
        });
      }

      socket.emit('message:marked-read', { messageId, success: true });
    } catch (error: any) {
      console.error(`Error marking message as read: ${error.message}`);
      socket.emit('message:error', { error: error.message });
    }
  });

  socket.on('conversation:mark-read', async (data: { conversationId: string }) => {
    try {
      const { conversationId } = data;
      const conversation = await prisma.conversation.findUnique({ where: { id: conversationId } });
      if (!conversation || !conversation.userIds.includes(socketUserId)) {
        socket.emit('message:error', { error: 'Not authorized for this conversation' });
        return;
      }

      await prisma.message.updateMany({
        where: { conversationId, toId: socketUserId, receivedAt: null },
        data: { receivedAt: new Date() },
      });

      socket.emit('conversation:marked-read', { conversationId, success: true });
    } catch (error: any) {
      console.error(`Error marking conversation as read: ${error.message}`);
      socket.emit('message:error', { error: error.message });
    }
  });

  socket.on('users:online', async () => {
    socket.emit('users:online-list', await redis.hkeys(CONNECTED_USERS_KEY));
  });

  socket.on('disconnect', async () => {
    console.log(`Client disconnected: ${socket.id}`);
    await redis.hdel(CONNECTED_USERS_KEY, socketUserId);
    await redis.hdel(ACTIVE_CONVERSATIONS_KEY, socketUserId);
    messagingIo.emit('user:offline', { userId: socketUserId, status: 'offline' });
  });
});

/**
 * Re-broadcasts a booking-confirmation update to whichever connected user is actively
 * viewing that conversation. Triggered by a `confirmation.updated` RabbitMQ event
 * published by the Core service, since Core no longer holds these socket connections.
 */
async function broadcastConfirmationUpdate(conversationId: string, confirmation: any) {
  const activeConversations = await redis.hgetall(ACTIVE_CONVERSATIONS_KEY);
  for (const [userId, activeConvId] of Object.entries(activeConversations)) {
    if (activeConvId === conversationId) {
      const socketId = await redis.hget(CONNECTED_USERS_KEY, userId);
      if (socketId) {
        messagingIo.to(socketId).emit('confirmation_updated', { conversationId, confirmation });
      }
    }
  }
}

app.use(cors({ origin: true, credentials: true }));

// Rate limiting — backed by Redis (shared across all pods) instead of the default
// in-memory store, which only counted requests hitting that one process. With N
// replicas the in-memory version let each pod give every client its own separate
// quota (an effective N× multiplier), and reset the count on every pod restart/deploy.
const limiter = rateLimit({
  windowMs: 30 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX || '1000', 10),
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === 'OPTIONS',
  store: new RedisStore({
    sendCommand: (...args: string[]) => redis.call(...(args as [string, ...string[]])) as Promise<any>,
  }),
});
app.use(limiter);

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'chat' }));

app.use('/messaging', messagingRoutes);
app.use('/internal', internalRoutes);

const PORT: number = parseInt(process.env.PORT || '3001', 10);

async function startServer() {
  const dbConnected = await testDatabaseConnection();

  if (!dbConnected) {
    console.error('=====> Server startup aborted due to database connection failure');
    process.exit(1);
  }

  try {
    await queueService.connect();
    await queueService.consumeConfirmationUpdates(({ conversationId, confirmation }) => {
      broadcastConfirmationUpdate(conversationId, confirmation);
    });
    queueService.setupGracefulShutdown();
    console.log('=====> RabbitMQ connection established, listening for confirmation updates');
  } catch (error) {
    console.error('=====> RabbitMQ connection failed:', error);
  }

  server.listen(PORT, () => {
    console.log(`=====> Chat service running on port ${PORT}`);
    console.log(`=====> Socket.IO messaging namespace available at /messaging`);
  });
}

startServer().catch((error) => {
  console.error('=====> Failed to start chat service:', error);
  process.exit(1);
});
