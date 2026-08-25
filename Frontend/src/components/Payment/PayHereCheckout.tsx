import React, { useState } from 'react';
import { CreditCard, Lock, AlertCircle, CheckCircle } from 'lucide-react';
import { currencyConfig } from '../../services/paymentConfig';
import { paymentApi, type PayHereCheckoutFields } from '../../api/paymentApi';
import toast from 'react-hot-toast';

interface PayHereCheckoutProps {
  serviceId: string;
  bookingId?: string;
  amount: number;
  currency?: string;
  serviceName?: string;
  onSuccess?: (paymentId: string) => void;
  onError?: (error: string) => void;
  loading?: boolean;
  disabled?: boolean;
}

declare global {
  interface Window {
    payhere?: {
      onCompleted?: (orderId: string) => void;
      onDismissed?: () => void;
      onError?: (error: string) => void;
      startPayment: (payload: PayHereCheckoutFields) => void;
    };
  }
}

const PAYHERE_SCRIPT_URL = 'https://www.payhere.lk/lib/payhere.js';
let payhereScriptPromise: Promise<void> | null = null;

function loadPayHereScript(): Promise<void> {
  if (window.payhere) return Promise.resolve();

  if (!payhereScriptPromise) {
    payhereScriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = PAYHERE_SCRIPT_URL;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load PayHere checkout script'));
      document.body.appendChild(script);
    });
  }

  return payhereScriptPromise;
}

// PayHere's onCompleted callback fires client-side before the server-to-server
// notify_url confirms the payment, so poll our own backend for the authoritative status.
async function pollPaymentStatus(
  paymentId: string,
  onSuccess?: (paymentId: string) => void,
  onError?: (error: string) => void
) {
  const maxAttempts = 15;
  const intervalMs = 2000;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, intervalMs));

    try {
      const payment = await paymentApi.getPaymentStatus(paymentId);

      if (payment.status === 'SUCCEEDED') {
        onSuccess?.(paymentId);
        return;
      }

      if (['FAILED', 'CANCELED'].includes(payment.status)) {
        onError?.('Payment was not completed');
        return;
      }
    } catch (error) {
      console.error('Error polling payment status:', error);
    }
  }

  onError?.('Payment confirmation is taking longer than expected. Check your payment history shortly.');
}

const PayHereCheckout: React.FC<PayHereCheckoutProps> = ({
  serviceId,
  bookingId,
  amount,
  currency = 'lkr',
  serviceName,
  onSuccess,
  onError,
  loading = false,
  disabled = false,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const handlePay = async () => {
    setIsProcessing(true);
    setPaymentError(null);

    try {
      await loadPayHereScript();

      const checkout = await paymentApi.createCheckout({ serviceId, bookingId, amount, currency });

      window.payhere!.onCompleted = () => {
        pollPaymentStatus(
          checkout.paymentId,
          (paymentId) => {
            setIsProcessing(false);
            setPaymentSuccess(true);
            toast.success('Payment successful!');
            onSuccess?.(paymentId);
          },
          (error) => {
            setIsProcessing(false);
            setPaymentError(error);
            onError?.(error);
          }
        );
      };

      window.payhere!.onDismissed = () => {
        setIsProcessing(false);
      };

      window.payhere!.onError = (error: string) => {
        setIsProcessing(false);
        setPaymentError(error);
        onError?.(error);
        toast.error('Payment failed: ' + error);
      };

      window.payhere!.startPayment(checkout.payhereFields);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setIsProcessing(false);
      setPaymentError(errorMessage);
      onError?.(errorMessage);
      toast.error('Payment failed: ' + errorMessage);
    }
  };

  if (paymentSuccess) {
    return (
      <div className="max-w-md mx-auto p-6 bg-emerald-50 border border-emerald-100 rounded-xl">
        <div className="text-center">
          <CheckCircle className="w-16 h-16 text-emerald-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Payment Successful!</h3>
          <p className="text-gray-600">
            Your payment of {currencyConfig.formatCurrency(amount, currency)} has been processed successfully.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
          <CreditCard className="w-5 h-5 mr-2 text-orange-600" />
          Payment Details
        </h3>
        {serviceName && <p className="text-gray-500 text-sm mb-2">Service: {serviceName}</p>}
        <p className="text-xl font-medium text-gray-900">Total: {currencyConfig.formatCurrency(amount, currency)}</p>
      </div>

      {paymentError && (
        <div className="flex items-center p-3 bg-red-50 border border-red-100 rounded-xl">
          <AlertCircle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0" />
          <span className="text-sm text-red-700">{paymentError}</span>
        </div>
      )}

      <div className="flex items-center justify-center p-3 bg-gray-50 border border-gray-100 rounded-xl">
        <Lock className="w-4 h-4 text-gray-400 mr-2" />
        <span className="text-xs text-gray-500">You'll be securely redirected to PayHere to complete this payment</span>
      </div>

      <button
        type="button"
        onClick={handlePay}
        disabled={isProcessing || loading || disabled}
        className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center justify-center"
      >
        {isProcessing || loading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white mr-2"></div>
            Processing...
          </>
        ) : (
          <>
            <Lock className="w-4 h-4 mr-2" />
            Pay {currencyConfig.formatCurrency(amount, currency)} with PayHere
          </>
        )}
      </button>

      <div className="text-center">
        <p className="text-xs text-gray-400">By completing this payment, you agree to our terms of service.</p>
      </div>
    </div>
  );
};

export default PayHereCheckout;
