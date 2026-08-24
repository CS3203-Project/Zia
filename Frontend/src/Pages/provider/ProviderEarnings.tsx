import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  Eye,
  Calendar,
  RefreshCw,
  Wallet,
  BarChart3
} from 'lucide-react';
import { paymentApi, type ProviderEarnings, type Payment } from '../../api/paymentApi';
import { PaymentStatusCard } from '../../components/Payment';
import { currencyConfig } from '../../services/paymentConfig';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import Button from '../../components/shared/Button';

const ProviderEarningsPage: React.FC = () => {
  const { isLoggedIn, user } = useAuth();
  const navigate = useNavigate();

  const [earnings, setEarnings] = useState<ProviderEarnings | null>(null);
  const [recentPayments, setRecentPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentsLoading, setPaymentsLoading] = useState(true);

  // Check authentication and provider status
  useEffect(() => {
    if (!isLoggedIn || !user) {
      toast.error('Please log in to view earnings');
      navigate('/signin');
      return;
    }

    // Check if user is a provider (you might need to adjust this based on your user model)
    if (user.role !== 'PROVIDER' && !user.serviceProvider) {
      toast.error('Only service providers can view earnings');
      navigate('/');
      return;
    }
  }, [isLoggedIn, user, navigate]);

  // Fetch provider earnings
  const fetchEarnings = async () => {
    if (!isLoggedIn || !user) return;

    try {
      setLoading(true);
      const earningsData = await paymentApi.getProviderEarnings();
      setEarnings(earningsData);
    } catch (error) {
      console.error('Failed to fetch earnings:', error);
      toast.error('Failed to load earnings data');
    } finally {
      setLoading(false);
    }
  };

  // Fetch recent payments (you would need to modify the API to filter by provider)
  const fetchRecentPayments = async () => {
    if (!isLoggedIn || !user) return;

    try {
      setPaymentsLoading(true);
      // This would need to be modified to get provider-specific payments
      const response = await paymentApi.getPaymentHistory(1, 5);
      setRecentPayments(response.payments);
    } catch (error) {
      console.error('Failed to fetch recent payments:', error);
      toast.error('Failed to load recent payments');
    } finally {
      setPaymentsLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn && user) {
      fetchEarnings();
      fetchRecentPayments();
    }
  }, [isLoggedIn, user]);

  const handleRefresh = () => {
    fetchEarnings();
    fetchRecentPayments();
  };

  const handleWithdraw = () => {
    // Implement withdrawal logic
    toast.success('Withdrawal functionality would be implemented here');
  };

  const handleViewAllPayments = () => {
    navigate('/payment-history');
  };

  if (!isLoggedIn || !user) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">

      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
                <Wallet className="w-8 h-8 mr-3 text-orange-600" />
                Earnings Dashboard
              </h1>
              <p className="text-gray-500">
                Track your earnings and manage your payments
              </p>
            </div>
            <Button
              onClick={handleRefresh}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <RefreshCw className="w-8 h-8 text-orange-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-500">Loading earnings data...</p>
          </div>
        ) : earnings ? (
          <>
            {/* Earnings Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Total Earnings */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Total Earnings</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {currencyConfig.formatCurrency(earnings.totalEarnings, earnings.currency)}
                    </p>
                  </div>
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100">
                    <TrendingUp className="w-6 h-6 text-emerald-600" />
                  </div>
                </div>
              </div>

              {/* Available Balance */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Available Balance</p>
                    <p className="text-2xl font-bold text-emerald-600">
                      {currencyConfig.formatCurrency(earnings.availableBalance, earnings.currency)}
                    </p>
                  </div>
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100">
                    <DollarSign className="w-6 h-6 text-emerald-600" />
                  </div>
                </div>
                <Button
                  onClick={handleWithdraw}
                  disabled={earnings.availableBalance <= 0}
                  className="mt-3 w-full"
                  size="sm"
                >
                  Withdraw Funds
                </Button>
              </div>

              {/* Pending Balance */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Pending</p>
                    <p className="text-2xl font-bold text-amber-600">
                      {currencyConfig.formatCurrency(earnings.pendingBalance, earnings.currency)}
                    </p>
                  </div>
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-amber-100">
                    <Calendar className="w-6 h-6 text-amber-600" />
                  </div>
                </div>
              </div>

              {/* Total Withdrawn */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Total Withdrawn</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {currencyConfig.formatCurrency(earnings.totalWithdrawn, earnings.currency)}
                    </p>
                  </div>
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-orange-100">
                    <CreditCard className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Earnings Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Earnings Summary */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2 text-orange-600" />
                  Earnings Summary
                </h2>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-500">Total Revenue</span>
                    <span className="font-semibold text-gray-900">
                      {currencyConfig.formatCurrency(earnings.totalEarnings, earnings.currency)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-lg">
                    <span className="text-gray-500">Available to Withdraw</span>
                    <span className="font-semibold text-emerald-600">
                      {currencyConfig.formatCurrency(earnings.availableBalance, earnings.currency)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-amber-50 rounded-lg">
                    <span className="text-gray-500">Processing</span>
                    <span className="font-semibold text-amber-600">
                      {currencyConfig.formatCurrency(earnings.pendingBalance, earnings.currency)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Account Information */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <CreditCard className="w-5 h-5 mr-2 text-orange-600" />
                  Payment Account
                </h2>
                <div className="space-y-4">
                  <div className="p-4 bg-orange-50 border border-orange-100 rounded-lg">
                    <div className="flex items-center text-orange-700 mb-2 font-medium">
                      <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
                      Manual Payouts
                    </div>
                    <p className="text-sm text-orange-700">
                      Payouts are processed manually by the Zia team based on your available balance below.
                    </p>
                  </div>

                  {earnings.lastPayoutAt && (
                    <div className="text-sm text-gray-500">
                      <span className="font-medium text-gray-700">Last payout:</span> {' '}
                      {new Date(earnings.lastPayoutAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Recent Payments */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Recent Payments
                  </h2>
                  <button
                    onClick={handleViewAllPayments}
                    className="text-orange-600 hover:text-orange-700 text-sm font-medium flex items-center"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View All
                  </button>
                </div>
              </div>

              {paymentsLoading ? (
                <div className="p-12 text-center">
                  <RefreshCw className="w-8 h-8 text-orange-600 animate-spin mx-auto mb-4" />
                  <p className="text-gray-500">Loading recent payments...</p>
                </div>
              ) : recentPayments.length === 0 ? (
                <div className="p-12 text-center">
                  <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No payments yet</h3>
                  <p className="text-gray-500">Your recent payments will appear here.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {recentPayments.slice(0, 5).map((payment) => (
                    <div key={payment.id} className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {payment.service?.title || 'Service Payment'}
                          </h3>
                          <p className="text-sm text-gray-400">
                            {new Date(payment.createdAt).toLocaleDateString()} at {new Date(payment.createdAt).toLocaleTimeString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold text-gray-900">
                            {currencyConfig.formatCurrency(payment.providerAmount || payment.amount, payment.currency)}
                          </p>
                          <PaymentStatusCard
                            status={payment.status}
                            className="mt-2"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <Wallet className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No earnings data</h3>
            <p className="text-gray-500">Unable to load your earnings information.</p>
          </div>
        )}
      </main>

    </div>
  );
};

export default ProviderEarningsPage;
