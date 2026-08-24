import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CreditCard,
  Calendar,
  DollarSign,
  Filter,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { paymentApi, type Payment, type PaymentHistoryResponse, PaymentStatus } from '../../api/paymentApi';
import { PaymentStatusCard } from '../../components/Payment';
import { currencyConfig } from '../../services/paymentConfig';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/shared/Button';
import toast from 'react-hot-toast';

const PaymentHistory: React.FC = () => {
  const { isLoggedIn, user } = useAuth();
  const navigate = useNavigate();

  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');

  // Check authentication
  useEffect(() => {
    if (!isLoggedIn || !user) {
      toast.error('Please log in to view payment history');
      navigate('/signin');
    }
  }, [isLoggedIn, user, navigate]);

  // Fetch payment history
  const fetchPaymentHistory = async (page: number = 1) => {
    if (!isLoggedIn || !user) return;

    try {
      setLoading(true);
      const response: PaymentHistoryResponse = await paymentApi.getPaymentHistory(page, 10);
      setPayments(response.payments);
      setCurrentPage(response.pagination.page);
      setTotalPages(response.pagination.pages);
      setTotalCount(response.pagination.total);
    } catch (error) {
      console.error('Failed to fetch payment history:', error);
      toast.error('Failed to load payment history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentHistory(currentPage);
  }, [currentPage, isLoggedIn, user]);

  // Filter payments based on search and status
  const filteredPayments = payments.filter(payment => {
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    const matchesSearch = searchTerm === '' ||
      payment.service?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.id.toLowerCase().includes(searchTerm.toLowerCase());

    let matchesDate = true;
    if (dateFilter !== 'all') {
      const paymentDate = new Date(payment.createdAt);
      const now = new Date();

      switch (dateFilter) {
        case 'today':
          matchesDate = paymentDate.toDateString() === now.toDateString();
          break;
        case 'week': {
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          matchesDate = paymentDate >= weekAgo;
          break;
        }
        case 'month': {
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          matchesDate = paymentDate >= monthAgo;
          break;
        }
      }
    }

    return matchesStatus && matchesSearch && matchesDate;
  });

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleRetryPayment = (_paymentId: string) => {
    // Implement retry logic - could redirect to payment page with service info
    toast.success('Retry payment functionality would be implemented here');
  };

  if (!isLoggedIn || !user) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      <main className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
            <CreditCard className="w-8 h-8 mr-3 text-orange-600" />
            Payment History
          </h1>
          <p className="text-gray-500">
            View and manage all your payment transactions
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search payments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as PaymentStatus | 'all')}
                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none appearance-none"
              >
                <option value="all">All Status</option>
                <option value={PaymentStatus.SUCCEEDED}>Succeeded</option>
                <option value={PaymentStatus.PENDING}>Pending</option>
                <option value={PaymentStatus.FAILED}>Failed</option>
                <option value={PaymentStatus.REFUNDED}>Refunded</option>
                <option value={PaymentStatus.CANCELED}>Canceled</option>
              </select>
            </div>

            {/* Date Filter */}
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none appearance-none"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Past Week</option>
                <option value="month">Past Month</option>
              </select>
            </div>

            {/* Refresh Button */}
            <Button
              onClick={() => fetchPaymentHistory(currentPage)}
              disabled={loading}
              className="w-full"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Payments</p>
                <p className="text-2xl font-bold text-gray-900">{totalCount}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
                <DollarSign className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Successful</p>
                <p className="text-2xl font-bold text-emerald-600">
                  {payments.filter(p => p.status === PaymentStatus.SUCCEEDED).length}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                <CreditCard className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Amount</p>
                <p className="text-2xl font-bold text-gray-900">
                  {currencyConfig.formatCurrency(
                    payments
                      .filter(p => p.status === PaymentStatus.SUCCEEDED)
                      .reduce((sum, p) => sum + p.amount, 0),
                    'lkr'
                  )}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
                <DollarSign className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Payment List */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900">
              Payments ({filteredPayments.length})
            </h2>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <RefreshCw className="w-8 h-8 text-orange-500 animate-spin mx-auto mb-4" />
              <p className="text-gray-500">Loading payment history...</p>
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="p-12 text-center">
              <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No payments found</h3>
              <p className="text-gray-500">You haven't made any payments yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredPayments.map((payment) => (
                <div key={payment.id} className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-3">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {payment.service?.title || 'Service Payment'}
                          </h3>
                          <p className="text-sm text-gray-500">
                            Payment ID: {payment.id}
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(payment.createdAt).toLocaleDateString()} at {new Date(payment.createdAt).toLocaleTimeString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold text-gray-900">
                            {currencyConfig.formatCurrency(payment.amount, payment.currency)}
                          </p>
                          {payment.platformFee && (
                            <p className="text-sm text-gray-500">
                              Platform fee: {currencyConfig.formatCurrency(payment.platformFee, payment.currency)}
                            </p>
                          )}
                        </div>
                      </div>

                      <PaymentStatusCard
                        status={payment.status}
                        amount={payment.amount}
                        currency={payment.currency}
                        paymentId={payment.id}
                        paidAt={payment.paidAt}
                        failureReason={payment.failureReason}
                        onRetry={() => handleRetryPayment(payment.id)}
                        className="mt-3"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-6 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Showing {((currentPage - 1) * 10) + 1} to {Math.min(currentPage * 10, totalCount)} of {totalCount} payments
                </p>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="flex items-center px-3 py-2 text-sm font-medium text-gray-500 hover:text-orange-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Previous
                  </button>

                  <div className="flex space-x-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const page = i + 1;
                      return (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`h-8 w-8 flex items-center justify-center text-sm font-medium rounded-full transition-colors ${
                            currentPage === page
                              ? 'bg-orange-600 text-white shadow-sm'
                              : 'text-gray-500 hover:bg-orange-50 hover:text-orange-700'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="flex items-center px-3 py-2 text-sm font-medium text-gray-500 hover:text-orange-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default PaymentHistory;
