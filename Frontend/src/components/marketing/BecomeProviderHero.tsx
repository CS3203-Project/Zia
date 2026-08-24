import { ArrowLeft, Star, Shield, Clock } from 'lucide-react';

interface BecomeProviderHeroProps {
  onBack: () => void;
}

export default function BecomeProviderHero({ onBack }: BecomeProviderHeroProps) {
  return (
    <section className="relative bg-gradient-to-b from-orange-50 to-white pt-28 lg:pt-32 pb-14 px-4 sm:px-6 lg:px-8 text-center overflow-hidden">
      <div className="max-w-4xl mx-auto relative z-10">
        <button
          onClick={onBack}
          className="flex items-center text-gray-500 hover:text-orange-600 mb-8 transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Profile
        </button>

        {/* Badge */}
        <div className="inline-flex items-center px-5 py-2.5 rounded-full bg-orange-100 text-orange-700 text-sm font-medium mb-8">
          <span className="relative flex h-2 w-2 mr-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
          </span>
          Join Our Provider Network
        </div>

        {/* Main Title */}
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
          <span className="block">Become a</span>
          <span className="block bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
            Service Provider
          </span>
        </h1>

        <p className="text-lg sm:text-xl text-gray-500 max-w-3xl mx-auto mb-10">
          Transform your skills into success. Join thousands of professionals already earning on our platform.
        </p>

        {/* Benefits Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="group p-6 bg-white border border-gray-100 rounded-2xl shadow-sm transition-all duration-300 hover:border-orange-200 hover:shadow-lg">
            <div className="p-3 bg-orange-100 rounded-xl w-fit mx-auto mb-4">
              <Star className="h-6 w-6 text-orange-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Build Your Reputation</h3>
            <p className="text-gray-500 text-sm">Showcase your skills and build trust with customer reviews</p>
          </div>

          <div className="group p-6 bg-white border border-gray-100 rounded-2xl shadow-sm transition-all duration-300 hover:border-orange-200 hover:shadow-lg">
            <div className="p-3 bg-orange-100 rounded-xl w-fit mx-auto mb-4">
              <Shield className="h-6 w-6 text-orange-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Secure Platform</h3>
            <p className="text-gray-500 text-sm">Safe payments and verified customers for peace of mind</p>
          </div>

          <div className="group p-6 bg-white border border-gray-100 rounded-2xl shadow-sm transition-all duration-300 hover:border-orange-200 hover:shadow-lg">
            <div className="p-3 bg-orange-100 rounded-xl w-fit mx-auto mb-4">
              <Clock className="h-6 w-6 text-orange-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Flexible Schedule</h3>
            <p className="text-gray-500 text-sm">Work on your terms with complete schedule control</p>
          </div>
        </div>
      </div>
    </section>
  );
}
