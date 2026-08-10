import { prisma } from '../utils/database.js';
import coreClient from './coreClient.service.js';

class AnalyticsService {
  async getPaymentStatistics(): Promise<{
    totalRevenue: number;
    totalTransactions: number;
    averageTransactionValue: number;
    successfulTransactions: number;
    failedTransactions: number;
    pendingTransactions: number;
    totalPlatformFees: number;
    totalProviderEarnings: number;
  }> {
    const payments = await prisma.payment.findMany({
      select: { amount: true, platformFee: true, providerAmount: true, status: true },
    });

    const totalTransactions = payments.length;
    const totalRevenue = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const totalPlatformFees = payments.reduce((sum, p) => sum + Number(p.platformFee || 0), 0);
    const totalProviderEarnings = payments.reduce((sum, p) => sum + Number(p.providerAmount || 0), 0);

    const successfulTransactions = payments.filter((p) => p.status === 'SUCCEEDED').length;
    const failedTransactions = payments.filter((p) => p.status === 'FAILED').length;
    const pendingTransactions = payments.filter((p) => p.status === 'PENDING').length;

    const averageTransactionValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

    return {
      totalRevenue,
      totalTransactions,
      averageTransactionValue,
      successfulTransactions,
      failedTransactions,
      pendingTransactions,
      totalPlatformFees,
      totalProviderEarnings,
    };
  }

  async getRevenueByDateRange(startDate: Date, endDate: Date): Promise<{ date: string; revenue: number; transactions: number }[]> {
    const payments = await prisma.payment.findMany({
      where: { createdAt: { gte: startDate, lte: endDate }, status: 'SUCCEEDED' },
      select: { amount: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    const revenueByDate = new Map<string, { revenue: number; transactions: number }>();

    payments.forEach((payment) => {
      const dateStr = payment.createdAt.toISOString().split('T')[0];
      if (dateStr) {
        const existing = revenueByDate.get(dateStr) || { revenue: 0, transactions: 0 };
        existing.revenue += Number(payment.amount);
        existing.transactions += 1;
        revenueByDate.set(dateStr, existing);
      }
    });

    return Array.from(revenueByDate.entries()).map(([date, data]) => ({ date, ...data }));
  }

  async getTopProvidersByRevenue(limit: number = 10): Promise<{
    providerId: string;
    providerName: string;
    totalRevenue: number;
    totalTransactions: number;
  }[]> {
    const providerRevenue = await prisma.payment.groupBy({
      by: ['providerId'],
      where: { status: 'SUCCEEDED' },
      _sum: { amount: true },
      _count: { id: true },
      orderBy: { _sum: { amount: 'desc' } },
      take: limit,
    });

    return Promise.all(
      providerRevenue.map(async (revenue) => {
        const provider = await coreClient.getProvider(revenue.providerId);
        const user = provider ? await coreClient.getUser(provider.userId) : null;

        return {
          providerId: revenue.providerId,
          providerName: user ? `${user.firstName} ${user.lastName}` : 'Unknown Provider',
          totalRevenue: Number(revenue._sum.amount || 0),
          totalTransactions: revenue._count.id,
        };
      })
    );
  }

  async getPaymentStatusDistribution(): Promise<{ status: string; count: number; percentage: number }[]> {
    const statusCounts = await prisma.payment.groupBy({ by: ['status'], _count: { id: true } });
    const totalPayments = statusCounts.reduce((sum, s) => sum + s._count.id, 0);

    return statusCounts.map((s) => ({
      status: s.status,
      count: s._count.id,
      percentage: totalPayments > 0 ? (s._count.id / totalPayments) * 100 : 0,
    }));
  }

  async getRecentPayments(limit: number = 20): Promise<{
    id: string;
    amount: number;
    currency: string;
    status: string;
    serviceName: string;
    providerName: string;
    customerName: string;
    createdAt: Date;
  }[]> {
    const payments = await prisma.payment.findMany({ take: limit, orderBy: { createdAt: 'desc' } });

    return Promise.all(
      payments.map(async (payment) => {
        const [service, provider, customer] = await Promise.all([
          coreClient.getService(payment.serviceId),
          coreClient.getProvider(payment.providerId),
          coreClient.getUser(payment.userId),
        ]);
        const providerUser = provider ? await coreClient.getUser(provider.userId) : null;

        return {
          id: payment.id,
          amount: Number(payment.amount),
          currency: payment.currency,
          status: payment.status,
          serviceName: service?.title || 'Unknown Service',
          providerName: providerUser ? `${providerUser.firstName} ${providerUser.lastName}` : 'Unknown Provider',
          customerName: customer ? `${customer.firstName} ${customer.lastName}` : 'Unknown Customer',
          createdAt: payment.createdAt,
        };
      })
    );
  }

  async getMonthlyRevenueComparison(): Promise<{ currentMonth: number; previousMonth: number; growthPercentage: number }> {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const [currentMonthRevenue, previousMonthRevenue] = await Promise.all([
      prisma.payment.aggregate({
        where: { createdAt: { gte: currentMonthStart }, status: 'SUCCEEDED' },
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: { createdAt: { gte: previousMonthStart, lte: previousMonthEnd }, status: 'SUCCEEDED' },
        _sum: { amount: true },
      }),
    ]);

    const currentMonth = Number(currentMonthRevenue._sum.amount || 0);
    const previousMonth = Number(previousMonthRevenue._sum.amount || 0);
    const growthPercentage = previousMonth > 0 ? ((currentMonth - previousMonth) / previousMonth) * 100 : 0;

    return { currentMonth, previousMonth, growthPercentage };
  }
}

export default new AnalyticsService();
