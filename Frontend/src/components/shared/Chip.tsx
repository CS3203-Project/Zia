import React from 'react';
import { cn } from '../../utils/utils';

// Material Design 3 chip: assist (default informational/action) or filter (selectable, toggled)
interface ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
  icon?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}

const Chip = React.forwardRef<HTMLButtonElement, ChipProps>(
  ({ className, selected = false, icon, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        aria-pressed={selected}
        className={cn(
          "inline-flex items-center gap-1.5 h-8 px-3.5 rounded-lg border text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 disabled:opacity-40 disabled:pointer-events-none",
          selected
            ? "bg-orange-600 border-orange-600 text-white"
            : "bg-white border-gray-300 text-gray-700 hover:bg-orange-50 hover:border-orange-300",
          className
        )}
        {...props}
      >
        {icon}
        {children}
      </button>
    );
  }
);

export default Chip;
