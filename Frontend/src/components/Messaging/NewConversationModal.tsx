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
  // See ConfirmationModal: this one holds a search result list, so it grows tall enough to overflow a short viewport with no way to reach the bottom.
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-white/30 px-4 py-10 backdrop-blur-sm sm:items-center">
      <div className="my-auto max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-gray-100 bg-white p-6 shadow-2xl sm:p-8">
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
