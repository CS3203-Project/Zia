import React from 'react';
import { cn } from '../../utils/utils';

// Generic skeleton block. Compose these into page/section-specific shapes
// rather than reaching for a spinner — a shape that mirrors the real layout
// avoids the pop-in/layout-shift a spinner-then-content swap causes.
interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

const Skeleton: React.FC<SkeletonProps> = ({ className, ...props }) => (
  <div className={cn('animate-pulse rounded-md bg-gray-200', className)} {...props} />
);

export default Skeleton;
