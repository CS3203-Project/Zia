import { Request, Response } from 'express';
import analyticsService from '../services/analytics.service.js';

class AdminController {
  async getPaymentAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const [statistics, statusDistribution, monthlyComparison] = await Promise.all([
        analyticsService.getPaymentStatistics(),
        analyticsService.getPaymentStatusDistribution(),
        analyticsService.getMonthlyRevenueComparison(),
      ]);

      res.status(200).json({
        success: true,
        message: 'Payment analytics retrieved successfully',
        data: { statistics, statusDistribution, monthlyComparison },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
  }

  async getRevenueChart(req: Request, res: Response): Promise<void> {
    try {
      const { startDate, endDate } = req.query;
      let start = new Date();
      let end = new Date();

      if (startDate && endDate) {
        start = new Date(startDate as string);
        end = new Date(endDate as string);
      } else {
        start = new Date();
        start.setDate(start.getDate() - 30);
      }

      const revenueData = await analyticsService.getRevenueByDateRange(start, end);
      res.status(200).json({ success: true, message: 'Revenue chart data retrieved successfully', data: revenueData });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
  }

  async getTopProviders(req: Request, res: Response): Promise<void> {
    try {
      const { limit = 10 } = req.query;
      const topProviders = await analyticsService.getTopProvidersByRevenue(Number(limit));
      res.status(200).json({ success: true, message: 'Top providers retrieved successfully', data: topProviders });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
  }

  async getRecentPayments(req: Request, res: Response): Promise<void> {
    try {
      const { limit = 20 } = req.query;
      const recentPayments = await analyticsService.getRecentPayments(Number(limit));
      res.status(200).json({ success: true, message: 'Recent payments retrieved successfully', data: recentPayments });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
  }

  async getPaymentStatistics(req: Request, res: Response): Promise<void> {
    try {
      const statistics = await analyticsService.getPaymentStatistics();
      res.status(200).json({ success: true, message: 'Payment statistics retrieved successfully', data: statistics });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
  }
}

export const adminController = new AdminController();
