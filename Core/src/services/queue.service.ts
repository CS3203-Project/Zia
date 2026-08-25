import * as amqp from 'amqplib';

export interface EmailEvent {
  type:
    | 'BOOKING_CONFIRMATION'
    | 'BOOKING_REMINDER'
    | 'BOOKING_CANCELLATION_MODIFICATION'
    | 'NEW_MESSAGE_OR_REVIEW'
    | 'ACCOUNT_VERIFICATION'
    | 'PASSWORD_RESET'
    | 'OTHER';
  data: {
    conversationId?: string;
    scheduleId?: string;
    customerEmail: string;
    providerEmail: string;
    customerName: string;
    providerName: string;
    serviceName?: string;
    startDate?: string;
    endDate?: string;
    serviceFee?: number;
    currency?: string;
    message?: string;
    reviewData?: any;
    metadata?: Record<string, any>;
  };
  timestamp: string;
}

class QueueService {
  private connection: any = null;
  private channel: any = null;
  private readonly exchangeName = 'email_notifications';
  private readonly chatExchangeName = 'chat_events';
  private isConnecting = false;
  private readonly routingKeys = {
    BOOKING_CONFIRMATION: 'email.booking.confirmation',
    BOOKING_REMINDER: 'email.booking.reminder',
    BOOKING_CANCELLATION_MODIFICATION: 'email.booking.modification',
    NEW_MESSAGE_OR_REVIEW: 'email.message.review',
    ACCOUNT_VERIFICATION: 'email.account.verify',
    PASSWORD_RESET: 'email.account.reset',
    OTHER: 'email.other'
  };

  async connect(): Promise<void> {
    if (this.isConnecting) {
      console.log('=====> Connection already in progress, waiting...');
      return;
    }

    try {
      this.isConnecting = true;
      const rabbitmqUrl = process.env.RABBITMQ_URL;
      
      // Add connection options for better stability
      this.connection = await amqp.connect(rabbitmqUrl, {
        heartbeat: 60, // 60 seconds heartbeat
        connection_timeout: 30000, // 30 seconds connection timeout
      });
      
      this.channel = await this.connection.createChannel();

      // Handle connection errors
      this.connection.on('error', (err: any) => {
        console.error('error==> RabbitMQ connection error:', err);
        this.connection = null;
        this.channel = null;
      });

      this.connection.on('close', () => {
        console.log('=====> RabbitMQ connection closed');
        this.connection = null;
        this.channel = null;
      });

      // Handle channel errors
      this.channel.on('error', (err: any) => {
        console.error('error==> RabbitMQ channel error:', err);
        this.channel = null;
      });

      this.channel.on('close', () => {
        console.log('=====> RabbitMQ channel closed');
        this.channel = null;
      });

      // Declare exchanges
      await this.channel.assertExchange(this.exchangeName, 'topic', {
        durable: true
      });
      await this.channel.assertExchange(this.chatExchangeName, 'topic', {
        durable: true
      });

      console.log('=====> Connected to RabbitMQ and exchanges created');
    } catch (error) {
      console.error('error==> Failed to connect to RabbitMQ:', error);
      this.connection = null;
      this.channel = null;
      // Don't throw error to prevent server crash
      console.error('error==> Email notifications will be disabled until connection is restored');
    } finally {
      this.isConnecting = false;
    }
  }

  async publishEmailEvent(event: EmailEvent): Promise<void> {
    // Check if connection is available, if not, try to reconnect
    if (!this.channel || !this.connection) {
      console.log('=====> RabbitMQ connection not available, attempting to reconnect...');
      await this.connect();
    }

    // If still no connection after reconnect attempt, skip email
    if (!this.channel) {
      console.error('error==> Email notification skipped - RabbitMQ connection unavailable');
      return;
    }

    try {
      const routingKey = this.routingKeys[event.type];
      const message = Buffer.from(JSON.stringify(event));

      const published = this.channel!.publish(
        this.exchangeName,
        routingKey,
        message,
        {
          persistent: true,
          timestamp: Date.now(),
          messageId: `${event.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        }
      );

      if (published) {
        console.log(`=====> Email event published: ${event.type} for conversation ${event.data.conversationId}`);
      } else {
        throw new Error('Failed to publish message to queue');
      }
    } catch (error) {
      console.error('error==> Error publishing email event:', error);
      
      // Reset connection on error
      this.connection = null;
      this.channel = null;
      
      // Don't throw error to prevent breaking the main confirmation flow
      console.error('error==> Email notification failed but continuing with main operation');
    }
  }

  /**
   * Publishes a confirmation update so the Chat service (which now owns the socket
   * connections) can re-broadcast it to whichever party is actively viewing the
   * conversation. Replaces the old in-process broadcastConfirmationUpdate() call,
   * which only worked when confirmation logic and chat sockets shared one process.
   */
  async publishConfirmationUpdate(conversationId: string, confirmation: any, event?: string): Promise<void> {
    if (!this.channel || !this.connection) {
      await this.connect();
    }

    if (!this.channel) {
      console.error('error==> Confirmation update not published - RabbitMQ connection unavailable');
      return;
    }

    try {
      // `event` lets the Chat service turn this into a system message in the thread,
      // so each side sees the other's booking actions inline as they happen.
      const message = Buffer.from(JSON.stringify({ conversationId, confirmation, event }));
      this.channel.publish(this.chatExchangeName, 'confirmation.updated', message, {
        persistent: true,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error('error==> Error publishing confirmation update:', error);
    }
  }

  async sendBookingConfirmation(data: {
    conversationId: string;
    scheduleId: string;
    customerEmail: string;
    providerEmail: string;
    customerName: string;
    providerName: string;
    serviceName: string;
    startDate: string;
    endDate: string;
    serviceFee?: number;
    currency?: string;
  }): Promise<void> {
    const event: EmailEvent = {
      type: 'BOOKING_CONFIRMATION',
      data,
      timestamp: new Date().toISOString()
    };
    
    await this.publishEmailEvent(event);
  }

  async sendBookingModification(data: {
    conversationId: string;
    scheduleId: string;
    customerEmail: string;
    providerEmail: string;
    customerName: string;
    providerName: string;
    serviceName: string;
    startDate?: string;
    endDate?: string;
    serviceFee?: number;
    currency?: string;
    message?: string;
  }): Promise<void> {
    const event: EmailEvent = {
      type: 'BOOKING_CANCELLATION_MODIFICATION',
      data,
      timestamp: new Date().toISOString()
    };
    
    await this.publishEmailEvent(event);
  }

  async sendBookingReminder(data: {
    conversationId?: string;
    scheduleId: string;
    customerEmail: string;
    providerEmail: string;
    customerName: string;
    providerName: string;
    serviceName: string;
    startDate: string;
    endDate: string;
    serviceFee?: number;
    currency?: string;
  }): Promise<void> {
    const event: EmailEvent = {
      type: 'BOOKING_REMINDER',
      data,
      timestamp: new Date().toISOString()
    };

    await this.publishEmailEvent(event);
  }

  async sendMessageOrReviewNotification(data: {
    conversationId?: string;
    customerEmail: string;
    providerEmail: string;
    customerName: string;
    providerName: string;
    message?: string;
    reviewData?: any;
    notificationType: 'MESSAGE' | 'REVIEW';
    metadata?: Record<string, any>;
  }): Promise<void> {
    const event: EmailEvent = {
      type: 'NEW_MESSAGE_OR_REVIEW',
      data: {
        ...data,
        serviceName: data.notificationType === 'REVIEW' ? 'Service Review' : 'New Message'
      },
      timestamp: new Date().toISOString()
    };

    await this.publishEmailEvent(event);
  }

  /**
   * Account emails (verify address, reset password). These carry a one-time link
   * and are addressed to a single recipient, unlike the booking mails above which
   * always involve both parties.
   */
  async sendAccountEmail(data: {
    type: 'ACCOUNT_VERIFICATION' | 'PASSWORD_RESET';
    to: string;
    name: string;
    actionUrl: string;
  }): Promise<void> {
    const event: EmailEvent = {
      type: data.type,
      data: {
        customerEmail: data.to,
        providerEmail: data.to,
        customerName: data.name,
        providerName: data.name,
        metadata: { actionUrl: data.actionUrl },
      },
      timestamp: new Date().toISOString(),
    };

    await this.publishEmailEvent(event);
  }

  async close(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close();
      }
      if (this.connection) {
        await this.connection.close();
      }
    } catch (error) {
      console.error('Error closing RabbitMQ connection:', error);
    }
  }

  // Graceful shutdown
  setupGracefulShutdown(): void {
    process.on('SIGINT', async () => {
      console.log('==xx== Gracefully shutting down RabbitMQ connection...');
      await this.close();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.log('==xx== Gracefully shutting down RabbitMQ connection...');
      await this.close();
      process.exit(0);
    });
  }
}

export const queueService = new QueueService();
