import React from 'react';

interface ConversationNotFoundProps {
  onBackToHub: () => void;
}

/**
 * Shown inside the main content panel when the active conversation could not
 * be resolved (e.g. the user doesn't have access to it).
 */
const ConversationNotFound: React.FC<ConversationNotFoundProps> = ({ onBackToHub }) => {
  return (
    <div className="flex items-center justify-center h-full w-full text-gray-900/70 relative z-10">
      <div className="text-center p-8 rounded-xl bg-orange-50 backdrop-blur-sm border border-gray-200">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-orange-100 flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-900/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <p className="text-lg font-medium text-gray-900 mb-2">Conversation not found</p>
        <p className="text-sm text-gray-900/60 mb-4">The conversation you're looking for doesn't exist or you don't have access to it</p>
        <button
          onClick={onBackToHub}
          className="px-6 py-3 bg-orange-100 text-gray-900 rounded-xl hover:bg-orange-100 transition-all duration-300 font-medium border border-gray-300 hover:border-orange-300 relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 group-hover:animate-pulse"></div>
          <span className="relative z-10">Back to Conversations</span>
        </button>
      </div>
    </div>
  );
};

export default ConversationNotFound;
