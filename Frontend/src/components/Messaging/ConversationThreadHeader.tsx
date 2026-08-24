import React from 'react';
import { ArrowLeft } from 'lucide-react';
import Button from '../shared/Button';

interface ConversationThreadHeaderProps {
  title?: string | null;
  onBack: () => void;
}

/**
 * Top bar for an individual conversation thread: a "Back to Hub" button plus
 * an optional title pill (hidden for the default "Chat with ..." titles).
 */
const ConversationThreadHeader: React.FC<ConversationThreadHeaderProps> = ({ title, onBack }) => {
  const showTitle = !!title && !title.includes('Chat with');

  return (
    <div className="mb-4 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <Button onClick={onBack} variant="outline" className="group">
          <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-0.5 transition-transform duration-200" />
          Back to Hub
        </Button>

        {showTitle && (
          <div className="px-4 py-2 rounded-xl bg-orange-50 border border-orange-100">
            <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversationThreadHeader;
