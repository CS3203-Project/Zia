import React from 'react';
import Button from '../shared/Button';

interface CategoryNotFoundStateProps {
  error: string | null;
  categorySlug: string | undefined;
}

/**
 * Full-page error state shown when the requested category could not be
 * found or failed to load.
 */
const CategoryNotFoundState: React.FC<CategoryNotFoundStateProps> = ({ error, categorySlug }) => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white relative overflow-hidden">
      {/* Enhanced Square Grid Background with fade effect */}
      <div className="absolute inset-0 w-full h-full bg-[linear-gradient(to_right,#e5e7eb_0.5px,transparent_0.5px),linear-gradient(to_bottom,#e5e7eb_0.5px,transparent_0.5px)] bg-[size:4rem_4rem] opacity-30 [mask-image:linear-gradient(to_bottom,black_0%,black_50%,transparent_100%)]" />

      <div className="container mx-auto px-4 pt-20 pb-8 relative z-10">
        <div className="text-center py-20">
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Category Not Found
              </h2>
              <p className="text-gray-500 mb-8 leading-relaxed">
                {error || 'The category you\'re looking for doesn\'t exist or couldn\'t be loaded.'}
              </p>

              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-8">
                <h3 className="text-sm font-semibold text-yellow-800 mb-3">Troubleshooting:</h3>
                <ul className="text-sm text-yellow-700 text-left space-y-2">
                  <li>• Check if the category "{categorySlug}" exists in your database</li>
                  <li>• Verify the category slug is correct</li>
                  <li>• Check the browser console for available categories</li>
                  <li>• Ensure your backend is running and accessible</li>
                </ul>
              </div>

              <div className="space-y-4">
                <Button
                  onClick={() => window.location.href = '/services'}
                  className="w-full"
                  size="lg"
                >
                  Browse All Services
                </Button>
                <Button
                  onClick={() => window.location.reload()}
                  variant="outline"
                  className="w-full"
                  size="lg"
                >
                  Retry Loading
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryNotFoundState;
