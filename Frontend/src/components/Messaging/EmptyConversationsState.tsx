import React from 'react';
import { MessageCircle } from 'lucide-react';
import Button from '../shared/Button';

interface EmptyConversationsStateProps {
  onStartConversation: () => void;
}

/**
 * Shown in place of the conversation list when the user has no
 * conversations yet.
 */
const EmptyConversationsState: React.FC<EmptyConversationsStateProps> = ({ onStartConversation }) => {
  return (
    <div className="p-12 text-center text-gray-500">
      <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-orange-50 flex items-center justify-center border border-orange-100">
        <MessageCircle className="w-10 h-10 text-orange-500" />
      </div>
      <p className="text-xl font-semibold text-gray-900 mb-2">No conversations yet</p>
      <p className="text-gray-500">Start your first conversation to begin messaging with others</p>
      <Button onClick={onStartConversation} size="lg" className="mt-6 shadow-orange-500/30">
        Start Messaging
      </Button>
    </div>
  );
};

export default EmptyConversationsState;
