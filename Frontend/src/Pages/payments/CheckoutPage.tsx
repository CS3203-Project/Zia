import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, Lock, Loader2 } from 'lucide-react';
import { serviceApi, type ServiceResponse } from '../../api/serviceApi';
import { PayHereCheckout } from '../../components/Payment';
import { currencyConfig } from '../../services/paymentConfig';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/shared/Button';
import Chip from '../../components/shared/Chip';
import toast from 'react-hot-toast';

const CheckoutPage: React.FC = () => {
  const { serviceId } = useParams<{ serviceId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isLoggedIn, user } = useAuth();

  const [service, setService] = useState<ServiceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<'review' | 'payment' | 'success'>('review');

  // Get amount from URL params if provided
  const customAmount = searchParams.get('amount');
  const returnUrl = searchParams.get('return') || '/services';

  // Check authentication
  useEffect(() => {
    if (!isLoggedIn || !user) {
      toast.error('Please log in to proceed with payment');
      navigate('/signin');
    }
  }, [isLoggedIn, user, navigate]);

  // Fetch service details
  useEffect(() => {
    const fetchService = async () => {
      if (!serviceId) {
        toast.error('Service not found');
        navigate('/services');
        return;
      }

      try {
        setLoading(true);
        const response = await serviceApi.getServiceById(serviceId);
        setService(response.data);
      } catch (error) {
        console.error('Failed to fetch service:', error);
        toast.error('Failed to load service details');
        navigate('/services');
      } finally {
        setLoading(false);
      }
    };

    if (serviceId) {
      fetchService();
    }
  }, [serviceId, navigate]);

  const handlePaymentSuccess = (paymentId: string) => {
    console.log('Payment successful:', paymentId);
    setStep('success');
    toast.success('Payment completed successfully!');
  };

  const handlePaymentError = (error: string) => {
    console.error('Payment error:', error);
    toast.error('Payment failed: ' + error);
  };

  const handleBackToService = () => {
    if (returnUrl.startsWith('/service/')) {
      navigate(returnUrl);
    } else {
      navigate(`/service/${serviceId}`);
    }
  };

  const handleContinueShopping = () => {
    navigate('/services');
  };

  if (!isLoggedIn || !user) {
    return null; // Will redirect in useEffect
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 text-orange-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading service details...</p>
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Not Found</h1>
          <p className="text-gray-500 mb-6">The service you're looking for doesn't exist.</p>
          <Button onClick={handleContinueShopping}>
            Browse Services
          </Button>
        </div>
      </div>
    );
  }

  const servicePrice = customAmount ? parseFloat(customAmount) : (typeof service.price === 'string' ? parseFloat(service.price) : service.price);
  const platformFee = servicePrice * 0.05; // 5% platform fee
  const totalAmount = servicePrice + platformFee;

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      <main className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Back button */}
        <button
          onClick={handleBackToService}
          className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-orange-700 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Service
        </button>

        {step === 'review' && (
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Review Your Order</h1>
              <p className="text-gray-500">Please review the details before proceeding to payment</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Service Details */}
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Service Details</h2>

                <div className="flex items-start space-x-4 mb-6">
                  {service.images && service.images.length > 0 && (
                    <img
                      src={service.images[0]}
                      alt={service.title}
                      className="w-20 h-20 object-cover rounded-xl flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {service.title}
                    </h3>
                    <p className="text-gray-500 text-sm line-clamp-3">
                      {service.description}
                    </p>
                  </div>
                </div>

                {service.tags && service.tags.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-500 mb-2">Categories:</p>
                    <div className="flex flex-wrap gap-2">
                      {service.tags.slice(0, 3).map((tag, index) => (
                        <Chip key={index} tabIndex={-1} className="h-7 px-3 text-xs pointer-events-none">
                          {tag}
                        </Chip>
                      ))}
                    </div>
                  </div>
                )}

                <div className="border-t border-gray-100 pt-1 divide-y divide-gray-100">
                  <div className="flex justify-between items-center py-3">
                    <span className="text-gray-500">Service Price:</span>
                    <span className="font-medium text-gray-900">
                      {currencyConfig.formatCurrency(servicePrice, service.currency)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-3">
                    <span className="text-gray-500">Platform Fee (5%):</span>
                    <span className="font-medium text-gray-900">
                      {currencyConfig.formatCurrency(platformFee, service.currency)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-3">
                    <span className="text-lg font-semibold text-gray-900">Total:</span>
                    <span className="text-lg font-bold text-orange-600">
                      {currencyConfig.formatCurrency(totalAmount, service.currency)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Security & Terms */}
              <div className="space-y-6">
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Security &amp; Trust</h2>

                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <ShieldCheck className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <h3 className="font-medium text-gray-900">Secure Payment</h3>
                        <p className="text-sm text-gray-500">
                          Your payment information is encrypted and secure
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <Lock className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <h3 className="font-medium text-gray-900">Money Back Guarantee</h3>
                        <p className="text-sm text-gray-500">
                          Get a full refund if you're not satisfied
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4">
                  <h3 className="font-medium text-orange-900 mb-2">Important Note</h3>
                  <p className="text-sm text-orange-800/80">
                    By proceeding with this payment, you agree to our terms of service and
                    understand that funds will be held in escrow until service completion.
                  </p>
                </div>

                <Button
                  onClick={() => setStep('payment')}
                  size="lg"
                  className="w-full shadow-orange-500/30"
                >
                  Proceed to Payment
                </Button>
              </div>
            </div>
          </div>
        )}

        {step === 'payment' && (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Your Payment</h1>
              <p className="text-gray-500">
                Total: {currencyConfig.formatCurrency(totalAmount, service.currency)}
              </p>
            </div>

            <div className="bg-gradient-to-br from-orange-500 to-amber-600 rounded-3xl shadow-xl shadow-orange-500/20 p-6 sm:p-8">
              <PayHereCheckout
                serviceId={service.id}
                amount={totalAmount}
                currency={service.currency}
                serviceName={service.title}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
              />
            </div>

            <div className="mt-6 text-center">
              <button
                onClick={() => setStep('review')}
                className="text-gray-500 hover:text-orange-700 text-sm font-medium transition-colors"
              >
                ← Back to Review
              </button>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-white rounded-3xl border border-gray-100 shadow-xl p-8">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShieldCheck className="w-8 h-8 text-emerald-600" />
              </div>

              <h1 className="text-3xl font-bold text-gray-900 mb-4">Payment Successful!</h1>
              <p className="text-gray-500 mb-6">
                Thank you for your payment. You can now contact the service provider to arrange your service.
              </p>

              <div className="bg-orange-50 rounded-2xl p-4 mb-6 text-left">
                <h3 className="font-medium text-gray-900 mb-2">What's Next?</h3>
                <p className="text-sm text-gray-600">
                  • Check your email for payment confirmation<br />
                  • Contact the provider to schedule your service<br />
                  • Your payment is held securely until service completion
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button onClick={handleBackToService} className="sm:px-8">
                  Contact Provider
                </Button>
                <Button onClick={handleContinueShopping} variant="outline" className="sm:px-8">
                  Browse More Services
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default CheckoutPage;
