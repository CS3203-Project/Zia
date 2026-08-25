import { ArrowLeft, Star, Shield, Clock } from 'lucide-react';
import PageHeader from '../shared/PageHeader';

interface BecomeProviderHeroProps {
  onBack: () => void;
}

export default function BecomeProviderHero({ onBack }: BecomeProviderHeroProps) {
  return (
    <section className="relative bg-gradient-to-b from-orange-50 to-white pt-24 lg:pt-28 pb-10 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div className="max-w-5xl mx-auto relative z-10">
        <button
          onClick={onBack}
          className="flex items-center text-gray-500 hover:text-orange-600 mb-6 transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Profile
        </button>

        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-8">
          <PageHeader
            align="left"
            className="mb-0"
            title="Become a Service Provider"
            subtitle="Create your provider profile to start listing services and earning on the platform."
          />

          {/* Benefits strip */}
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-600">
            <span className="flex items-center gap-1.5">
              <Star className="h-4 w-4 text-orange-500" />
              Build your reputation
            </span>
            <span className="flex items-center gap-1.5">
              <Shield className="h-4 w-4 text-orange-500" />
              Secure payments
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-orange-500" />
              Flexible schedule
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
