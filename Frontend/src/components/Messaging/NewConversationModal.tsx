import React from 'react';
import { X } from 'lucide-react';
import { UserSearch } from './UserSearch';

interface NewConversationModalProps {
  onClose: () => void;
  onSelectUser: (userId: string) => void;
}

/**
 * Modal dialog with the user-search bar used to start a new conversation.
 */
const NewConversationModal: React.FC<NewConversationModalProps> = ({ onClose, onSelectUser }) => {
  return (
    <div className="fixed inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <div className="w-full max-w-lg rounded-2xl border border-gray-100 bg-white p-8 shadow-2xl">
        <div>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold text-gray-900">Start New Conversation</h3>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-900 transition-colors duration-300 rounded-full hover:bg-orange-50"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <UserSearch
            onSelectUser={onSelectUser}
            placeholder="Search for users to message..."
          />
        </div>
      </div>
    </div>
  );
};

export default NewConversationModal;
