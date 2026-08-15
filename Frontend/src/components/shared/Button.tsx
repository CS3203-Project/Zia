import React from 'react';
import { cn } from '../../utils/utils';

// Button Component
type ButtonVariant = 'default' | 'outline' | 'ghost' | 'white';
type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', children, ...props }, ref) => {
    const baseClasses = "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";

    const variants: Record<ButtonVariant, string> = {
      default: "bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 hover:text-white shadow-lg hover:shadow-xl",
      outline: "border-2 border-gray-300 bg-transparent hover:bg-orange-50 hover:border-orange-400 text-gray-700 hover:text-orange-600",
      ghost: "hover:bg-orange-50 text-gray-600 hover:text-orange-600",
      white: "bg-white text-black hover:bg-gray-100 border border-gray-300 shadow-lg hover:shadow-xl"
    };
    
    const sizes: Record<ButtonSize, string> = {
      default: "h-10 px-4 py-2",
      sm: "h-9 px-3",
      lg: "h-12 px-8",
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