import { CreditCard, ChevronLeft, ChevronRight } from 'lucide-react';
import Button from '../../shared/Button';
import type { Payment } from '../../../api/paymentApi';

interface CustomerPaymentHistoryCardProps {
  paymentHistory: Payment[];
  paymentLoading: boolean;
  showPaymentHistory: boolean;
  onTogglePaymentHistory: () => void;
  paymentPage: number;
  totalPaymentPages: number;
  onPageChange: (page: number) => void;
}

export default function CustomerPaymentHistoryCard({
  paymentHistory,
  paymentLoading,
  showPaymentHistory,
  onTogglePaymentHistory,
  paymentPage,
  totalPaymentPages,
  onPageChange
}: CustomerPaymentHistoryCardProps) {
  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-xl shadow-2xl p-6 border border-gray-100 relative overflow-hidden">
      {/* Animated background glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-orange-500/5 to-pink-500/5 blur-3xl"></div>
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Payment History</h2>
            <p className="text-sm text-gray-400">Your service payment history</p>
          </div>
          <Button
            onClick={onTogglePaymentHistory}
            variant="tonal"
            size="sm"
            className="flex items-center space-x-2"
          >
            <CreditCard className="h-4 w-4" />
            <span>{showPaymentHistory ? 'Hide History' : 'View History'}</span>
          </Button>
        </div>

        {/* Payment History */}
        {showPaymentHistory && (
          <div className="border-t border-gray-100 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Payments</h3>

            {paymentLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-3"></div>
                <p className="text-gray-400">Loading payment history...</p>
              </div>
            ) : paymentHistory.length > 0 ? (
              <>
                <div className="space-y-3">
                  {paymentHistory.map((payment) => (
                    <div key={payment.id} className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-gray-100 hover:border-gray-100 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <div className={`w-3 h-3 rounded-full ${
                              payment.status === 'SUCCEEDED' ? 'bg-green-400' :
                              payment.status === 'PENDING' ? 'bg-yellow-400' :
                              payment.status === 'FAILED' ? 'bg-red-400' : 'bg-gray-400'
                            }`}></div>
                            <div>
                              <p className="text-gray-900 font-medium">
                                {payment.service?.title || 'Service Payment'}
                              </p>
                              <p className="text-sm text-gray-400">
                                {payment.provider?.user?.firstName && payment.provider?.user?.lastName
                                  ? `Provider: ${payment.provider.user.firstName} ${payment.provider.user.lastName}`
                                  : 'Service Provider'
                                }
                              </p>
                              <p className="text-sm text-gray-400">
                                {new Date(payment.createdAt).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-gray-900">
                            LKR {typeof payment.amount === 'number' ? payment.amount.toFixed(2) : parseFloat(payment.amount || '0').toFixed(2)}
                          </p>
                          <p className={`text-sm font-medium ${
                            payment.status === 'SUCCEEDED' ? 'text-green-400' :
                            payment.status === 'PENDING' ? 'text-yellow-400' :
                            payment.status === 'FAILED' ? 'text-red-400' : 'text-gray-400'
                          }`}>
                            {payment.status}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPaymentPages > 1 && (
                  <div className="flex items-center justify-center space-x-4 mt-6">
                    <Button
                      onClick={() => onPageChange(paymentPage - 1)}
                      disabled={paymentPage <= 1}
                      variant="outline"
                      size="sm"
                      className="flex items-center space-x-1 bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span>Previous</span>
                    </Button>

                    <span className="text-sm text-gray-400">
                      Page {paymentPage} of {totalPaymentPages}
                    </span>

                    <Button
                      onClick={() => onPageChange(paymentPage + 1)}
                      disabled={paymentPage >= totalPaymentPages}
                      variant="outline"
                      size="sm"
                      className="flex items-center space-x-1 bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span>Next</span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-400 mb-2">No payment history yet</p>
                <p className="text-sm text-gray-400">Payments for services you book will appear here</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
