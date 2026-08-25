import React from 'react';
import { CheckCircle, XCircle, Clock, AlertTriangle, X } from 'lucide-react';
import Button from '../shared/Button';

interface PaymentStatusPopupProps {
  isOpen: boolean;
  onClose: () => void;
  status: 'success' | 'error' | 'pending' | 'failed';
  paymentId?: string;
  amount?: number;
  currency?: string;
  errorMessage?: string;
  serviceName?: string;
  onOkClick?: () => void;
}

const PaymentStatusPopup: React.FC<PaymentStatusPopupProps> = ({
  isOpen,
  onClose,
  status,
  paymentId,
  amount,
  currency = 'lkr',
  errorMessage,
  serviceName,
  onOkClick
}) => {
  if (!isOpen) return null;

  const formatCurrency = (amount: number, currency: string) => {
    const currencySymbols = {
      'lkr': 'LKR',
      'usd': '$',
      'eur': '€',
      'gbp': '£'
    };
    const symbol = currencySymbols[currency.toLowerCase() as keyof typeof currencySymbols] || currency.toUpperCase();
    return `${symbol} ${amount.toLocaleString()}`;
  };

  const getStatusConfig = () => {
    switch (status) {
      case 'success':
        return {
          icon: <CheckCircle className="w-8 h-8 text-emerald-600" />,
          iconBg: 'bg-emerald-50',
          title: 'Payment Successful!',
          message: 'Your payment has been processed successfully.',
          detailsBg: 'bg-emerald-50 border-emerald-100',
        };
      case 'error':
      case 'failed':
        return {
          icon: <XCircle className="w-8 h-8 text-red-600" />,
          iconBg: 'bg-red-50',
          title: 'Payment Failed',
          message: errorMessage || 'Your payment could not be processed. Please try again.',
          detailsBg: 'bg-red-50 border-red-100',
        };
      case 'pending':
        return {
          icon: <Clock className="w-8 h-8 text-amber-600" />,
          iconBg: 'bg-amber-50',
          title: 'Payment Pending',
          message: 'Your payment is being processed. Please wait for confirmation.',
          detailsBg: 'bg-amber-50 border-amber-100',
        };
      default:
        return {
          icon: <AlertTriangle className="w-8 h-8 text-gray-500" />,
          iconBg: 'bg-gray-100',
          title: 'Payment Status Unknown',
          message: 'Please check your payment status.',
          detailsBg: 'bg-gray-50 border-gray-100',
        };
    }
  };

  const config = getStatusConfig();

  const handleOkClick = () => {
    if (onOkClick) {
      onOkClick();
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-white/30 backdrop-blur-sm flex items-start sm:items-center justify-center z-50 p-4 pt-24 sm:pt-4">
      <div className="relative bg-white border border-gray-100 rounded-3xl shadow-2xl w-full max-w-md my-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8">
          <div className="text-center">
            {/* Status Icon */}
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 ${config.iconBg}`}>
              {config.icon}
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold mb-2 text-gray-900">
              {config.title}
            </h2>

            {/* Message */}
            <p className="mb-6 text-gray-500">
              {config.message}
            </p>

            {/* Payment Details */}
            {status === 'success' && (
              <div className={`p-4 rounded-xl mb-6 border ${config.detailsBg}`}>
                <div className="space-y-2 text-sm">
                  {serviceName && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Service:</span>
                      <span className="font-medium text-gray-900">{serviceName}</span>
                    </div>
                  )}
                  {amount && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Amount:</span>
                      <span className="font-medium text-gray-900">{formatCurrency(amount, currency)}</span>
                    </div>
                  )}
                  {paymentId && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Payment ID:</span>
                      <span className="font-mono text-xs text-gray-600 break-all">{paymentId}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-500">Date:</span>
                    <span className="font-medium text-gray-900">{new Date().toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Action Button */}
            <Button
              onClick={handleOkClick}
              className="w-full"
            >
              {status === 'success' ? 'Continue to Profile' : 'OK'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentStatusPopup;
