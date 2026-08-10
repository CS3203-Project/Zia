import 'dotenv/config';
import { prisma } from './src/utils/database.js';
import { queueService } from './src/services/queue.service.js';
import express, { type Application } from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
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

const connectedUsers = new Map<string, string>(); // userId -> socketId
const activeConversations = new Map<string, string>(); // userId -> conversationId

messagingIo.on('connection', (socket) => {
  const socketUserId = socket.data.userId as string;
  connectedUsers.set(socketUserId, socket.id);
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
    activeConversations.set(socketUserId, conversationId);
    socket.emit('conversation:entered', { success: true, conversationId });
  });

  socket.on('conversation:leave', () => {
    const conversationId = activeConversations.get(socketUserId);
    activeConversations.delete(socketUserId);
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

      const recipientSocketId = connectedUsers.get(data.toId);
      if (recipientSocketId) {
        messagingIo.to(recipientSocketId).emit('message:received', message);

        const recipientActiveConversation = activeConversations.get(data.toId);
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

      const senderSocketId = connectedUsers.get(updatedMessage.fromId);
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

  socket.on('users:online', () => {
    socket.emit('users:online-list', Array.from(connectedUsers.keys()));
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
    connectedUsers.delete(socketUserId);
    activeConversations.delete(socketUserId);
    messagingIo.emit('user:offline', { userId: socketUserId, status: 'offline' });
  });
});

/**
 * Re-broadcasts a booking-confirmation update to whichever connected user is actively
 * viewing that conversation. Triggered by a `confirmation.updated` RabbitMQ event
 * published by the Core service, since Core no longer holds these socket connections.
 */
function broadcastConfirmationUpdate(conversationId: string, confirmation: any) {
  for (const [userId, activeConvId] of activeConversations.entries()) {
    if (activeConvId === conversationId) {
      const socketId = connectedUsers.get(userId);
      if (socketId) {
        messagingIo.to(socketId).emit('confirmation_updated', { conversationId, confirmation });
      }
    }
  }
}

app.use(cors({ origin: true, credentials: true }));

const limiter = rateLimit({
  windowMs: 30 * 60 * 1000,
  max: 10000,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === 'OPTIONS',
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
