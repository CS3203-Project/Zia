import { CheckCircle, Shield } from 'lucide-react';

export default function ProviderNextStepsNote() {
  return (
    <div className="bg-orange-50 border border-orange-100 rounded-2xl p-6">
      <div className="flex items-start space-x-3">
        <div className="p-2 bg-orange-100 rounded-lg mt-1">
          <Shield className="h-5 w-5 text-orange-600" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">What happens next?</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <CheckCircle className="h-4 w-4 text-emerald-600" />
                <span>Application review (1-3 business days)</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <CheckCircle className="h-4 w-4 text-emerald-600" />
                <span>Email notification on approval status</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <CheckCircle className="h-4 w-4 text-emerald-600" />
                <span>Start adding services immediately</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <CheckCircle className="h-4 w-4 text-emerald-600" />
                <span>Begin accepting customer bookings</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <CheckCircle className="h-4 w-4 text-emerald-600" />
                <span>Access to provider dashboard</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <CheckCircle className="h-4 w-4 text-emerald-600" />
                <span>Join our community of professionals</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
