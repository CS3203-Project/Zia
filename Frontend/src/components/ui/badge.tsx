import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "../../utils/utils";

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border px-2.5 py-0.5 text-xs font-medium leading-normal transition-colors outline-offset-2 focus-visible:outline focus-visible:outline-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-orange-500 text-white",
        secondary: "border-transparent bg-white/80 text-black",
        destructive: "border-transparent bg-red-500 text-white",
        outline: "border-white/30 text-black bg-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
