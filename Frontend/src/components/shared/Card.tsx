import React from 'react';
import { cn } from '../../utils/utils';

// Material Design 3 card: elevated (shadow, no border), filled (tonal bg, no shadow), outlined (border, no shadow)
type CardVariant = 'elevated' | 'filled' | 'outlined';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  interactive?: boolean;
  className?: string;
  children?: React.ReactNode;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'elevated', interactive = false, children, ...props }, ref) => {
    const variants: Record<CardVariant, string> = {
      elevated: "bg-white shadow-[0_1px_2px_0_rgba(0,0,0,0.3),0_1px_3px_1px_rgba(0,0,0,0.15)]",
      filled: "bg-orange-50",
      outlined: "bg-white border border-gray-200"
    };

    const interactiveClasses = interactive
      ? "cursor-pointer transition-shadow duration-200 hover:shadow-[0_1px_2px_0_rgba(0,0,0,0.3),0_2px_6px_2px_rgba(0,0,0,0.15)]"
      : "";

    return (
      <div
        ref={ref}
        className={cn("rounded-2xl p-6", variants[variant], interactiveClasses, className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

export default Card;
