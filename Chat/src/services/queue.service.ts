import * as amqp from 'amqplib';

export interface ConfirmationUpdatedEvent {
  conversationId: string;
  confirmation: any;
  /** Which booking transition happened, e.g. QUOTED / ACCEPTED / PAID. */
  event?: string;
}

class QueueService {
  private connection: any = null;
  private channel: any = null;
  private readonly exchangeName = 'chat_events';

  async connect(): Promise<void> {
    try {
      const rabbitmqUrl = process.env.RABBITMQ_URL;
      this.connection = await amqp.connect(rabbitmqUrl, { heartbeat: 60 });
      this.channel = await this.connection.createChannel();

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

      await this.channel.assertExchange(this.exchangeName, 'topic', { durable: true });

      console.log('=====> Connected to RabbitMQ and chat_events exchange created');
    } catch (error) {
      console.error('error==> Failed to connect to RabbitMQ:', error);
      this.connection = null;
      this.channel = null;
    }
  }

  /**
   * Subscribe to `confirmation.updated` events published by the Core service, so a
   * booking-confirmation change (which core can no longer broadcast directly, since
   * it doesn't hold the socket connections anymore) can still reach connected clients.
   */
  async consumeConfirmationUpdates(onEvent: (event: ConfirmationUpdatedEvent) => void): Promise<void> {
    if (!this.channel) {
      console.error('error==> Cannot consume chat_events - no RabbitMQ channel');
      return;
    }

    const { queue } = await this.channel.assertQueue('chat_confirmation_updates', { durable: true });
    await this.channel.bindQueue(queue, this.exchangeName, 'confirmation.updated');

    this.channel.consume(queue, (msg: amqp.ConsumeMessage | null) => {
      if (!msg) return;

      try {
        const event = JSON.parse(msg.content.toString()) as ConfirmationUpdatedEvent;
        onEvent(event);
        this.channel!.ack(msg);
      } catch (error) {
        console.error('error==> Failed to process confirmation.updated event:', error);
        this.channel!.nack(msg, false, false);
      }
    });
  }

  async close(): Promise<void> {
    try {
      if (this.channel) await this.channel.close();
      if (this.connection) await this.connection.close();
    } catch (error) {
      console.error('Error closing RabbitMQ connection:', error);
    }
  }

  setupGracefulShutdown(): void {
    process.on('SIGINT', async () => {
      await this.close();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      await this.close();
      process.exit(0);
    });
  }
}

export const queueService = new QueueService();
