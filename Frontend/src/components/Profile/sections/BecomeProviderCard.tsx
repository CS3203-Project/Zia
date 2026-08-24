import { User, UserPlus } from 'lucide-react';
import Button from '../../shared/Button';

interface BecomeProviderCardProps {
  onBecomeProvider: () => void;
}

export default function BecomeProviderCard({ onBecomeProvider }: BecomeProviderCardProps) {
  return (
    <div className="bg-white border border-gray-100 shadow-sm rounded-xl p-8 text-center">
      <div className="max-w-md mx-auto">
        <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-orange-100">
          <User className="h-8 w-8 text-orange-500" />
        </div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Welcome to Zia!</h2>
        <p className="text-gray-500 mb-6">
          You're currently a user on our platform. Upgrade to become a service provider
          to offer your services and start earning!
        </p>
        <Button
          onClick={onBecomeProvider}
          size="lg"
          className="flex items-center space-x-2 mx-auto px-6 py-3 text-base font-semibold bg-orange-500 hover:bg-orange-600 text-white rounded-full transition-all duration-300 shadow-lg hover:scale-105 hover:-translate-y-1"
        >
          <UserPlus className="h-5 w-5" />
          <span>Become a Service Provider</span>
        </Button>
      </div>
    </div>
  );
}
