/**
 * Code Splitting Guide & Implementation
 *
 * This file provides optimized route loading for the application.
 * It is intentionally a TSX file because it includes JSX examples.
 */

import React from 'react';

export const RouteLoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
    <div className="text-center">
      <div className="inline-flex items-center justify-center">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full animate-spin" />
          <div className="absolute inset-1 bg-white rounded-full" />
        </div>
      </div>
      <p className="mt-4 text-gray-600 font-medium">Loading...</p>
    </div>
  </div>
);

export const codeSplittingGuide = `
# Code Splitting Implementation Checklist

## Immediate Actions (Today)
- [ ] Update App.tsx to use React.lazy() for non-essential routes
- [ ] Create error boundary for lazy loaded components
- [ ] Add route loading spinner
- [ ] Test bundle size with analyzer

## This Week
- [ ] Implement component-level lazy loading for heavy components
- [ ] Add preloading strategy for frequently visited routes
- [ ] Monitor Core Web Vitals with Lighthouse
- [ ] Update build chunking strategy
`;
