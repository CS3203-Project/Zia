import React from 'react';

interface MobileViewToggleProps {
  isChatVisibleOnMobile: boolean;
  onToggle: (isChatVisibleOnMobile: boolean) => void;
  /**
   * `loading` matches the styling used while the conversation is still being
   * fetched; `active` matches the styling used once it has loaded. The two
   * variants intentionally use slightly different colors/borders to mirror
   * the original inline markup.
   */
  variant: 'loading' | 'active';
}

/**
 * Small mobile-only tab switcher between the Confirmation panel and the Chat
 * thread. Only visible below the `md` breakpoint.
 */
const MobileViewToggle: React.FC<MobileViewToggleProps> = ({ isChatVisibleOnMobile, onToggle, variant }) => {
  const containerClassName =
    variant === 'loading'
      ? 'md:hidden flex border-b border-gray-100 bg-gray-50'
      : 'md:hidden flex border-b border-gray-200 bg-gray-50 backdrop-blur-sm';

  const activeClassName =
    variant === 'loading'
      ? 'bg-orange-50 text-orange-700 border-b-2 border-orange-500'
      : 'bg-orange-100 text-gray-900 border-b-2 border-orange-500';

  const inactiveClassName =
    variant === 'loading'
      ? 'text-gray-500 hover:text-gray-900 hover:bg-orange-50/60'
      : 'text-gray-900/60 hover:text-gray-900 hover:bg-orange-50';

  return (
    <div className={containerClassName}>
      <button
        onClick={() => onToggle(false)}
        className={`flex-1 py-3 px-4 text-sm font-medium transition-all duration-300 ${
          !isChatVisibleOnMobile ? activeClassName : inactiveClassName
        }`}
      >
        Confirmation
      </button>
      <button
        onClick={() => onToggle(true)}
        className={`flex-1 py-3 px-4 text-sm font-medium transition-all duration-300 ${
          isChatVisibleOnMobile ? activeClassName : inactiveClassName
        }`}
      >
        Chat
      </button>
    </div>
  );
};

export default MobileViewToggle;
