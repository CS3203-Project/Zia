import { CreditCard, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import Button from '../../shared/Button';
import type { Payment, ProviderEarnings } from '../../../api/paymentApi';

interface EarningsGrowthPoint {
  date: string;
  amount: number;
  total: number;
}

interface ProviderPaymentEarningsCardProps {
  earnings: ProviderEarnings | null;
  paymentHistory: Payment[];
  paymentLoading: boolean;
  showPaymentHistory: boolean;
  onTogglePaymentHistory: () => void;
  paymentPage: number;
  totalPaymentPages: number;
  onPageChange: (page: number) => void;
}

export default function ProviderPaymentEarningsCard({
  earnings,
  paymentHistory,
  paymentLoading,
  showPaymentHistory,
  onTogglePaymentHistory,
  paymentPage,
  totalPaymentPages,
  onPageChange
}: ProviderPaymentEarningsCardProps) {
  return (
    <div className="backdrop-blur-md bg-white/70 border border-gray-100 rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.08)] p-6 hover:shadow-[0_12px_48px_0_rgba(0,0,0,0.15)] transition-all duration-300">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold bg-gradient-to-br from-black from-30% to-black/40 bg-clip-text text-transparent">Payment & Earnings</h2>
          <p className="text-sm text-gray-500 font-medium">Your financial overview and transaction history</p>
        </div>
        <Button
          onClick={onTogglePaymentHistory}
          variant="white"
          size="sm"
          className="flex items-center space-x-2 rounded-full"
        >
          <CreditCard className="h-4 w-4" />
          <span>{showPaymentHistory ? 'Hide History' : 'View History'}</span>
        </Button>
      </div>

      {/* Earnings Summary */}
      {earnings ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-white/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Total Earnings</p>
                  <p className="text-3xl font-bold text-gray-900">
                    LKR {typeof earnings.totalEarnings === 'number' ? earnings.totalEarnings.toFixed(2) : parseFloat(earnings.totalEarnings || '0').toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-white/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Completed Payments</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {paymentHistory.filter(p => p.status === 'SUCCEEDED').length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Earnings Growth Chart */}
          {paymentHistory.length > 0 && (
            <div className="bg-white/50 backdrop-blur-sm rounded-xl p-6 border border-white/30 mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Earnings Growth</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={paymentHistory
                      .filter(p => p.status === 'SUCCEEDED')
                      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                      .reduce((acc: EarningsGrowthPoint[], payment, index) => {
                        const amount = typeof payment.amount === 'number' ? payment.amount : parseFloat(payment.amount || '0');
                        const date = new Date(payment.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                        const lastTotal = index > 0 ? acc[acc.length - 1].total : 0;
                        acc.push({
                          date,
                          amount,
                          total: lastTotal + amount
                        });
                        return acc;
                      }, [])
                      .slice(-10)} // Show last 10 transactions
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="earningsGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#000000" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#000000" stopOpacity={0.05}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: 'currentColor', fontSize: 12 }}
                      className="text-gray-500"
                    />
                    <YAxis
                      tick={{ fill: 'currentColor', fontSize: 12 }}
                      className="text-gray-500"
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(0,0,0,0.1)',
                        borderRadius: '12px',
                        padding: '12px',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
                      }}
                      labelStyle={{ color: '#000', fontWeight: 'bold' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="total"
                      stroke="#000000"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#earningsGradient)"
                      name="Cumulative Earnings"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="bg-white/50 backdrop-blur-sm rounded-xl p-6 border border-white/30 mb-6">
          <div className="text-center">
            <p className="text-gray-500">No earnings data available yet</p>
            <p className="text-sm text-gray-400 mt-1">Start accepting payments to see your earnings here</p>
          </div>
        </div>
      )}

      {/* Payment History */}
      {showPaymentHistory && (
        <div className="border-t border-gray-100 pt-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Payment History</h3>

          {paymentLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-3"></div>
              <p className="text-gray-500">Loading payment history...</p>
            </div>
          ) : paymentHistory.length > 0 ? (
            <>
              <div className="space-y-3">
                {paymentHistory.map((payment) => (
                  <div key={payment.id} className="bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-white/30 hover:border-white/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${
                            payment.status === 'SUCCEEDED' ? 'bg-emerald-500' :
                            payment.status === 'PENDING' ? 'bg-amber-400' :
                            payment.status === 'FAILED' ? 'bg-red-400' : 'bg-gray-400'
                          }`}></div>
                          <div>
                            <p className="text-gray-900 font-semibold">
                                {payment.service?.title || 'Service Payment'}
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
                          {payment.currency} {typeof payment.amount === 'number' ? payment.amount.toFixed(2) : parseFloat(payment.amount || '0').toFixed(2)}
                        </p>
                        <p className={`text-sm font-semibold ${
                          payment.status === 'SUCCEEDED' ? 'text-gray-900' :
                          payment.status === 'PENDING' ? 'text-gray-500' :
                          payment.status === 'FAILED' ? 'text-gray-400' : 'text-gray-400'
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
                    variant="white"
                    size="sm"
                    className="flex items-center space-x-1 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span>Previous</span>
                  </Button>

                  <span className="text-sm text-gray-500 font-medium">
                    Page {paymentPage} of {totalPaymentPages}
                  </span>

                  <Button
                    onClick={() => onPageChange(paymentPage + 1)}
                    disabled={paymentPage >= totalPaymentPages}
                    variant="white"
                    size="sm"
                    className="flex items-center space-x-1 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
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
              <p className="text-gray-500 mb-2">No payment history yet</p>
              <p className="text-sm text-gray-400">Payments from your services will appear here</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
