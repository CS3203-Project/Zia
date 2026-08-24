import { useNavigate } from 'react-router-dom';
import { ArrowRight, Home } from 'lucide-react';
import Button from '../../components/shared/Button';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex items-center justify-center px-4 sm:px-6 lg:px-12 py-16">
      <div className="max-w-4xl w-full flex flex-col lg:flex-row items-center gap-8 lg:gap-16">
        <div className="w-full max-w-xs sm:max-w-sm flex-shrink-0 order-1 lg:order-2">
          <img
            src="/images/misc/404-illustration.webp"
            alt="Illustration of a confused developer facing a protocol error"
            className="w-full h-auto select-none pointer-events-none"
          />
        </div>

        <div className="text-center lg:text-left order-2 lg:order-1">
          <p className="text-orange-500 font-bold text-lg mb-2">Error 404</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            This page took a wrong turn
          </h1>
          <p className="text-gray-500 max-w-md mx-auto lg:mx-0 mb-8 leading-relaxed">
            The page you're looking for doesn't exist or may have been moved.
            Let's get you back on track.
          </p>
          <div className="flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-3">
            <Button
              onClick={() => navigate('/')}
              className="px-6 py-2.5 text-sm sm:text-base font-semibold rounded-full shadow-orange-500/30"
            >
              <Home className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
            <Button
              onClick={() => navigate('/services')}
              variant="outline"
              className="px-6 py-2.5 text-sm sm:text-base font-semibold rounded-full"
            >
              Browse Services
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
