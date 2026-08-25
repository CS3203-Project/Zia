import React, { useState } from 'react';
import { CreditCard, DollarSign, AlertTriangle, ArrowLeft, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { currencyConfig } from '../../services/paymentConfig';
import PayHereCheckout from './PayHereCheckout';
import PaymentStatusPopup from './PaymentStatusPopup';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceId: string;
  serviceName: string;
  servicePrice: number;
  serviceCurrency?: string;
  serviceImage?: string;
  onPaymentSuccess?: (paymentId: string) => void;
  onPaymentError?: (error: string) => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  serviceId,
  serviceName,
  servicePrice,
  serviceCurrency = 'lkr',
  serviceImage,
  onPaymentSuccess,
  onPaymentError
}) => {
  const navigate = useNavigate();
  const [step, setStep] = useState<'details' | 'payment'>('details');
  const [showStatusPopup, setShowStatusPopup] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'success' | 'error' | 'pending' | 'failed'>('success');
  const [completedPaymentId, setCompletedPaymentId] = useState<string>('');
  const [paymentErrorMessage, setPaymentErrorMessage] = useState<string>('');

  const handlePaymentSuccess = (paymentId: string) => {
    setCompletedPaymentId(paymentId);
    setPaymentStatus('success');
    setShowStatusPopup(true);
    onPaymentSuccess?.(paymentId);
  };

  const handlePaymentError = (error: string) => {
    setPaymentErrorMessage(error);
    setPaymentStatus('error');
    setShowStatusPopup(true);
    onPaymentError?.(error);
  };

  const handleStatusPopupOk = () => {
    if (paymentStatus === 'success') {
      // Navigate to customer profile
      navigate('/profile');
    }
    setShowStatusPopup(false);
    onClose();
    setStep('details'); // Reset for next time
  };

  const handleCloseModal = () => {
    onClose();
    setStep('details'); // Reset for next time
    setShowStatusPopup(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-white/30 backdrop-blur-sm flex items-start sm:items-center justify-center z-50 p-4 pt-24 sm:pt-4">
      <div className="bg-white border border-gray-100 rounded-3xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 flex-shrink-0">
          {step === 'payment' ? (
            <button
              onClick={() => setStep('details')}
              className="flex items-center text-gray-500 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </button>
          ) : <div />}
          <h2 className="text-lg font-bold text-gray-900 flex items-center">
            <CreditCard className="w-5 h-5 mr-2 text-orange-600" />
            {step === 'details' ? 'Payment Summary' : 'Complete Payment'}
          </h2>
          <button
            onClick={handleCloseModal}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 'details' ? (
            <>
              {/* Service Details */}
              <div className="mb-6">
                <div className="flex items-start space-x-4">
                  {serviceImage && (
                    <img
                      src={serviceImage}
                      alt={serviceName}
                      className="w-16 h-16 object-cover rounded-xl border border-gray-100"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900 mb-1">
                      {serviceName}
                    </h3>
                    <p className="text-gray-500 text-sm">
                      Professional service booking
                    </p>
                  </div>
                </div>
              </div>

              {/* Service Price */}
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 mb-4">
                <h4 className="text-sm font-medium text-gray-500 mb-3">Service Price</h4>
                <div className="flex justify-between font-medium">
                  <span className="text-gray-900">Price</span>
                  <span className="text-gray-900">
                    {currencyConfig.formatCurrency(servicePrice, serviceCurrency)}
                  </span>
                </div>
              </div>

              {/* Payment Terms */}
              <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 mb-4">
                <div className="flex items-start">
                  <DollarSign className="w-5 h-5 text-orange-600 mr-2 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-1">
                      Secure Payment
                    </h4>
                    <p className="text-sm text-gray-600">
                      Your payment is held securely until the service is completed to your satisfaction.
                    </p>
                  </div>
                </div>
              </div>

              {/* Warning */}
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-6">
                <div className="flex items-start">
                  <AlertTriangle className="w-5 h-5 text-amber-600 mr-2 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-1">
                      Important Note
                    </h4>
                    <p className="text-sm text-gray-600">
                      By proceeding with this payment, you agree to our terms of service and refund policy.
                    </p>
                  </div>
                </div>
              </div>

              {/* Continue Button */}
              <button
                onClick={() => setStep('payment')}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors shadow-sm"
              >
                Continue to Payment
              </button>
            </>
          ) : (
            /* Payment Form */
            <PayHereCheckout
              serviceId={serviceId}
              amount={servicePrice}
              currency={serviceCurrency}
              serviceName={serviceName}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
            />
          )}
        </div>
      </div>

      {/* Payment Status Popup */}
      <PaymentStatusPopup
        isOpen={showStatusPopup}
        onClose={() => setShowStatusPopup(false)}
        status={paymentStatus}
        paymentId={completedPaymentId}
        amount={servicePrice}
        currency={serviceCurrency}
        errorMessage={paymentErrorMessage}
        serviceName={serviceName}
        onOkClick={handleStatusPopupOk}
      />
    </div>
  );
};

export default PaymentModal;
