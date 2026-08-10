import crypto from 'crypto';
import { PaymentStatus } from '@prisma/client';
import { config } from 'dotenv';
import { prisma } from '../utils/database.js';
import coreClient from './coreClient.service.js';

config();

export interface PayHereCheckoutFields {
  sandbox: boolean;
  merchant_id: string;
  return_url: string;
  cancel_url: string;
  notify_url: string;
  order_id: string;
  items: string;
  amount: string;
  currency: string;
  hash: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  custom_1: string;
}

export interface PayHereNotifyBody {
  merchant_id: string;
  order_id: string;
  payment_id: string;
  payhere_amount: string;
  payhere_currency: string;
  status_code: string;
  md5sig: string;
  [key: string]: unknown;
}

function md5(input: string): string {
  return crypto.createHash('md5').update(input).digest('hex').toUpperCase();
}

class PayHereService {
  private merchantId: string;
  private merchantSecret: string;
  private mode: 'sandbox' | 'live';
  private appId?: string;
  private appSecret?: string;
  private oauthToken?: { token: string; expiresAt: number };

  constructor() {
    if (!process.env.PAYHERE_MERCHANT_ID || !process.env.PAYHERE_MERCHANT_SECRET) {
      throw new Error('PAYHERE_MERCHANT_ID / PAYHERE_MERCHANT_SECRET are not defined in environment variables');
    }

    this.merchantId = process.env.PAYHERE_MERCHANT_ID;
    this.merchantSecret = process.env.PAYHERE_MERCHANT_SECRET;
    this.mode = process.env.PAYHERE_MODE === 'live' ? 'live' : 'sandbox';
    this.appId = process.env.PAYHERE_APP_ID;
    this.appSecret = process.env.PAYHERE_APP_SECRET;
  }

  private get apiBase(): string {
    return this.mode === 'live' ? 'https://www.payhere.lk' : 'https://sandbox.payhere.lk';
  }

  private generateCheckoutHash(orderId: string, amount: number, currency: string): string {
    const formattedAmount = amount.toFixed(2);
    return md5(this.merchantId + orderId + formattedAmount + currency + md5(this.merchantSecret));
  }

  /**
   * Create a PENDING payment record and return the payload for payhere.startPayment().
   * Service/user details are fetched from the core service (Payment no longer owns those tables).
   */
  async createCheckoutPayload(
    serviceId: string,
    providerId: string,
    userId: string,
    amount: number,
    currency: string = 'lkr'
  ): Promise<{ paymentId: string; orderId: string; payhereFields: PayHereCheckoutFields }> {
    try {
      const [user, service] = await Promise.all([
        coreClient.getUser(userId),
        coreClient.getService(serviceId),
      ]);

      if (!service) {
        throw new Error('Service not found');
      }

      const platformFeePercentage = 0.05;
      const platformFee = Math.round(amount * platformFeePercentage);
      const providerAmount = amount - platformFee;

      const payment = await prisma.payment.create({
        data: {
          serviceId,
          providerId,
          userId,
          gateway: 'payhere',
          amount,
          platformFee,
          providerAmount,
          currency: currency.toLowerCase(),
          status: PaymentStatus.PENDING,
        },
      });

      // order_id must be known before the hash is generated, so use the payment's own id
      await prisma.payment.update({
        where: { id: payment.id },
        data: { payhereOrderId: payment.id },
      });

      const orderId = payment.id;
      const formattedCurrency = currency.toUpperCase();
      const hash = this.generateCheckoutHash(orderId, amount, formattedCurrency);

      const payhereFields: PayHereCheckoutFields = {
        sandbox: this.mode === 'sandbox',
        merchant_id: this.merchantId,
        return_url: process.env.PAYHERE_RETURN_URL || '',
        cancel_url: process.env.PAYHERE_CANCEL_URL || '',
        notify_url: process.env.PAYHERE_NOTIFY_URL || '',
        order_id: orderId,
        items: service.title || 'Zia service booking',
        amount: amount.toFixed(2),
        currency: formattedCurrency,
        hash,
        first_name: user?.firstName || 'N/A',
        last_name: user?.lastName || 'N/A',
        email: user?.email || '',
        phone: user?.phone || '0000000000',
        address: user?.address || user?.location || 'N/A',
        city: 'Colombo',
        country: 'Sri Lanka',
        custom_1: payment.id,
      };

      return { paymentId: payment.id, orderId, payhereFields };
    } catch (error) {
      console.error('Error creating PayHere checkout payload:', error);
      throw error instanceof Error ? error : new Error('Failed to create checkout');
    }
  }

  /**
   * Verify the md5sig sent by PayHere's notify_url callback
   */
  verifyNotifySignature(body: PayHereNotifyBody): boolean {
    const localSig = md5(
      this.merchantId +
        body.order_id +
        body.payhere_amount +
        body.payhere_currency +
        body.status_code +
        md5(this.merchantSecret)
    );

    return localSig === body.md5sig;
  }

  /**
   * Apply a verified notify_url callback to the Payment record
   */
  async handleNotify(body: PayHereNotifyBody) {
    const payment = await prisma.payment.findUnique({
      where: { payhereOrderId: body.order_id },
    });

    if (!payment) {
      throw new Error('Payment not found for order_id ' + body.order_id);
    }

    let status: PaymentStatus;
    let paidAt: Date | undefined;

    switch (body.status_code) {
      case '2':
        status = PaymentStatus.SUCCEEDED;
        paidAt = new Date();
        break;
      case '0':
        status = PaymentStatus.PENDING;
        break;
      case '-1':
        status = PaymentStatus.CANCELED;
        break;
      case '-2':
        status = PaymentStatus.FAILED;
        break;
      case '-3':
        status = PaymentStatus.REFUNDED;
        break;
      default:
        status = PaymentStatus.PENDING;
    }

    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status,
        paidAt,
        payherePaymentId: body.payment_id,
      },
    });

    if (status === PaymentStatus.SUCCEEDED) {
      await this.updateProviderEarnings(payment.providerId, Number(payment.providerAmount || 0));
    }

    return updatedPayment;
  }

  private async updateProviderEarnings(providerId: string, amount: number) {
    try {
      const existingEarnings = await prisma.providerEarnings.findUnique({
        where: { providerId },
      });

      if (existingEarnings) {
        await prisma.providerEarnings.update({
          where: { providerId },
          data: {
            totalEarnings: { increment: amount },
            availableBalance: { increment: amount },
          },
        });
      } else {
        await prisma.providerEarnings.create({
          data: {
            providerId,
            totalEarnings: amount,
            availableBalance: amount,
            pendingBalance: 0,
            totalWithdrawn: 0,
          },
        });
      }
    } catch (error) {
      console.error('Error updating provider earnings:', error);
      throw new Error('Failed to update provider earnings');
    }
  }

  async getPaymentStatus(paymentId: string) {
    const payment = await prisma.payment.findUnique({ where: { id: paymentId } });

    if (!payment) {
      throw new Error('Payment not found');
    }

    return payment;
  }

  async getPaymentHistory(filter: { userId?: string; providerId?: string }, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const where = filter.providerId ? { providerId: filter.providerId } : { userId: filter.userId };

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.payment.count({ where }),
    ]);

    return { payments, total };
  }

  async getProviderEarnings(providerId: string) {
    const earnings = await prisma.providerEarnings.findUnique({ where: { providerId } });

    if (!earnings) {
      return prisma.providerEarnings.create({
        data: {
          providerId,
          totalEarnings: 0,
          availableBalance: 0,
          pendingBalance: 0,
          totalWithdrawn: 0,
          currency: 'lkr',
        },
      });
    }

    return earnings;
  }

  private async getOAuthToken(): Promise<string> {
    if (!this.appId || !this.appSecret) {
      throw new Error('Refund automation not configured — PAYHERE_APP_ID/PAYHERE_APP_SECRET missing');
    }

    if (this.oauthToken && this.oauthToken.expiresAt > Date.now()) {
      return this.oauthToken.token;
    }

    const authHeader = Buffer.from(`${this.appId}:${this.appSecret}`).toString('base64');

    const response = await fetch(`${this.apiBase}/merchant/v1/oauth/token`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${authHeader}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
      throw new Error(`Failed to obtain PayHere OAuth token: ${response.status}`);
    }

    const data = (await response.json()) as { access_token: string };
    this.oauthToken = { token: data.access_token, expiresAt: Date.now() + 590 * 1000 };

    return data.access_token;
  }

  /**
   * Refund via PayHere's Refund API (requires PAYHERE_APP_ID/PAYHERE_APP_SECRET)
   */
  async refundPayment(paymentId: string, amount?: number, description: string = 'Refund') {
    try {
      const payment = await prisma.payment.findUnique({ where: { id: paymentId } });

      if (!payment) {
        throw new Error('Payment not found');
      }

      if (!payment.payherePaymentId) {
        throw new Error('PayHere payment id not found — payment has not been confirmed yet');
      }

      const token = await this.getOAuthToken();

      const response = await fetch(`${this.apiBase}/merchant/v1/payment/refund`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payment_id: payment.payherePaymentId,
          description,
          ...(amount ? { amount } : {}),
        }),
      });

      const refund = await response.json();

      if (!response.ok || refund.status !== 1) {
        throw new Error(refund.msg || 'PayHere refund request failed');
      }

      const refundStatus =
        amount && amount < payment.amount.toNumber() ? PaymentStatus.PARTIALLY_REFUNDED : PaymentStatus.REFUNDED;

      const updatedPayment = await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: refundStatus,
          refundedAt: new Date(),
        },
      });

      if (payment.providerAmount) {
        const refundAmount = amount || payment.providerAmount.toNumber();
        await this.updateProviderEarnings(payment.providerId, -refundAmount);
      }

      return { payment: updatedPayment, refund };
    } catch (error) {
      console.error('Error processing refund:', error);
      throw error instanceof Error ? error : new Error('Failed to process refund');
    }
  }
}

export default new PayHereService();
