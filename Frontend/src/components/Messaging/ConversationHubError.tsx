import React from 'react';
import { AlertTriangle } from 'lucide-react';
import Button from '../shared/Button';

interface ConversationHubErrorProps {
  error: string;
  onRetry: () => void;
}

/**
 * Full-page error state shown when the conversation list failed to load.
 */
const ConversationHubError: React.FC<ConversationHubErrorProps> = ({ error, onRetry }) => {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-orange-50 to-white relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 animate-pulse"></div>
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>

      <main className="flex-grow flex items-center justify-center relative z-10 px-4">
        <div className="text-center bg-white rounded-2xl border border-gray-100 p-8 shadow-xl max-w-md w-full relative overflow-hidden">
          <div className="relative z-10">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-orange-50 flex items-center justify-center border border-orange-100">
              <AlertTriangle className="w-8 h-8 text-orange-500" />
            </div>
            <p className="text-lg font-medium text-gray-900 mb-2">Error loading conversations</p>
            <p className="text-sm text-gray-500 mb-6">{error}</p>
            <Button onClick={onRetry} size="lg" className="shadow-orange-500/30">
              Retry
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ConversationHubError;
