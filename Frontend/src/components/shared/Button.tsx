import React from 'react';
import { cn } from '../../utils/utils';

// Material Design 3 button types: filled, tonal, outlined, text, elevated
type ButtonVariant = 'default' | 'tonal' | 'outline' | 'ghost' | 'elevated' | 'white';
type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', children, ...props }, ref) => {
    const baseClasses = "relative inline-flex items-center justify-center whitespace-nowrap rounded-full text-sm font-medium ring-offset-background transition-all duration-200 ease-[cubic-bezier(0.2,0,0,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40 active:scale-[0.98]";

    const variants: Record<ButtonVariant, string> = {
      // Filled — highest emphasis, primary actions
      default: "bg-orange-600 text-white hover:bg-orange-700 hover:shadow-[0_1px_2px_0_rgba(0,0,0,0.3),0_2px_6px_2px_rgba(0,0,0,0.15)] shadow-[0_1px_2px_0_rgba(0,0,0,0.3)]",
      // Tonal — medium emphasis, secondary actions
      tonal: "bg-orange-100 text-orange-900 hover:bg-orange-200",
      // Outlined — medium emphasis, low visual weight
      outline: "border border-gray-300 bg-transparent hover:bg-orange-50 hover:border-orange-400 text-gray-700 hover:text-orange-700",
      // Text — lowest emphasis
      ghost: "hover:bg-orange-50 text-orange-700 hover:text-orange-800",
      // Elevated — surface color with shadow, used on colored backgrounds
      elevated: "bg-white text-orange-700 shadow-[0_1px_2px_0_rgba(0,0,0,0.3),0_1px_3px_1px_rgba(0,0,0,0.15)] hover:shadow-[0_1px_2px_0_rgba(0,0,0,0.3),0_2px_6px_2px_rgba(0,0,0,0.15)]",
      white: "bg-white text-gray-900 hover:bg-gray-50 border border-gray-200 shadow-sm hover:shadow-md"
    };

    const sizes: Record<ButtonSize, string> = {
      default: "h-10 px-6 py-2",
      sm: "h-8 px-4 text-xs",
      lg: "h-12 px-8 text-base",
      icon: "h-10 w-10"
    };

    return (
      <button
        className={cn(baseClasses, variants[variant], sizes[size], className)}
        ref={ref}
        {...props}
      >
        {children}
      </button>
    );
  }
);

export default Button;
