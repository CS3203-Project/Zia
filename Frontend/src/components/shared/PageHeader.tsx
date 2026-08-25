import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  /** Left-aligns the header; defaults to centered, as on the Conversation Hub. */
  align?: 'center' | 'left';
  className?: string;
  children?: React.ReactNode;
}

/**
 * The gradient page title used across top-level pages.
 *
 * Extracted from the Conversation Hub so Browse Services, Become a Provider and
 * friends share one heading treatment instead of each rolling their own — and so
 * changing it later is a one-file edit.
 */
const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  align = 'center',
  className = '',
  children,
}) => {
  const centered = align === 'center';

  return (
    <div className={`mb-8 ${centered ? 'text-center' : 'text-left'} ${className}`}>
      <div className="relative inline-block">
        <h1 className="mb-4 bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-4xl font-bold text-transparent md:text-5xl">
          {title}
        </h1>
        <div
          className={`absolute -bottom-2 h-1 w-24 rounded-full bg-gradient-to-r from-orange-400 to-orange-500 ${
            centered ? 'left-1/2 -translate-x-1/2' : 'left-0'
          }`}
        />
      </div>

      {subtitle && (
        <p
          className={`mt-6 text-lg text-gray-500 ${centered ? 'mx-auto max-w-2xl' : 'max-w-2xl'}`}
        >
          {subtitle}
        </p>
      )}

      {children}
    </div>
  );
};

export default PageHeader;
