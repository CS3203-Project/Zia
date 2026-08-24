import React from 'react';
import { AlertTriangle } from 'lucide-react';
import Button from '../shared/Button';

interface ConversationErrorStateProps {
  error: string;
  onBackToHub: () => void;
}

/**
 * Full-page error state shown when the conversation thread failed to load.
 */
const ConversationErrorState: React.FC<ConversationErrorStateProps> = ({ error, onBackToHub }) => {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-orange-50 to-white">
      <main className="flex-grow flex items-center justify-center px-4 py-6 mt-16">
        <div className="text-center p-8 rounded-2xl bg-white border border-gray-100 shadow-xl max-w-md w-full">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-orange-50 border border-orange-100 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-orange-500" />
          </div>
          <p className="text-lg font-medium text-gray-900 mb-2">Error loading conversation</p>
          <p className="text-sm text-gray-500 mb-6">{error}</p>
          <Button onClick={onBackToHub} variant="outline" size="lg">
            Back to Hub
          </Button>
        </div>
      </main>
    </div>
  );
};

export default ConversationErrorState;
