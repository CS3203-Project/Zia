import React, { useState } from 'react';
import { CreditCard, Lock, AlertCircle, CheckCircle } from 'lucide-react';
import { currencyConfig } from '../../services/paymentConfig';
import { paymentApi, type PayHereCheckoutFields } from '../../api/paymentApi';
import toast from 'react-hot-toast';

interface PayHereCheckoutProps {
  serviceId: string;
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

      const checkout = await paymentApi.createCheckout({ serviceId, amount, currency });

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
      <div className="max-w-md mx-auto p-6 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl">
        <div className="text-center">
          <CheckCircle className="w-16 h-16 text-white mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Payment Successful!</h3>
          <p className="text-white/70">
            Your payment of {currencyConfig.formatCurrency(amount, currency)} has been processed successfully.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4">
        <h3 className="text-lg font-semibold text-white mb-2 flex items-center">
          <CreditCard className="w-5 h-5 mr-2" />
          Payment Details
        </h3>
        {serviceName && <p className="text-white/70 text-sm mb-2">Service: {serviceName}</p>}
        <p className="text-xl font-medium text-white">Total: {currencyConfig.formatCurrency(amount, currency)}</p>
      </div>

      {paymentError && (
        <div className="flex items-center p-3 bg-white/10 backdrop-blur-sm border border-white/30 rounded-xl">
          <AlertCircle className="w-5 h-5 text-white mr-2" />
          <span className="text-sm text-white/90">{paymentError}</span>
        </div>
      )}

      <div className="flex items-center justify-center p-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl">
        <Lock className="w-4 h-4 text-white/70 mr-2" />
        <span className="text-xs text-white/70">You'll be securely redirected to PayHere to complete this payment</span>
      </div>

      <button
        type="button"
        onClick={handlePay}
        disabled={isProcessing || loading || disabled}
        className="w-full bg-gradient-to-r from-white to-white/80 text-black font-semibold py-3 px-4 rounded-xl hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg flex items-center justify-center"
      >
        {isProcessing || loading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2"></div>
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
        <p className="text-xs text-white/60">By completing this payment, you agree to our terms of service.</p>
      </div>
    </div>
  );
};

export default PayHereCheckout;
