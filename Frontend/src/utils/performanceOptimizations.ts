/**
 * Performance Optimization Utilities
 * 
 * Helpers for optimizing React component rendering and data fetching
 */

import { useCallback, useRef, useEffect, useState, type ComponentType, type RefObject } from 'react';

/**
 * Debounce Hook
 * Delays function execution until X milliseconds after last call
 * Useful for search inputs, resize handlers, etc.
 */
export const useDebounce = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedCallback = useCallback(
    (...args: any[]) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  ) as T;

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
};

/**
 * Throttle Hook
 * Limits function execution to once per X milliseconds
 * Useful for scroll handlers, window resize, etc.
 */
export const useThrottle = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const lastRunRef = useRef<number>(Date.now());
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const throttledCallback = useCallback(
    (...args: any[]) => {
      const now = Date.now();
      const timeSinceLastRun = now - lastRunRef.current;

      if (timeSinceLastRun >= delay) {
        callback(...args);
        lastRunRef.current = now;
      } else {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
          callback(...args);
          lastRunRef.current = Date.now();
        }, delay - timeSinceLastRun);
      }
    },
    [callback, delay]
  ) as T;

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return throttledCallback;
};

/**
 * Virtual Scroller Hook
 * For rendering large lists efficiently by only rendering visible items
 */
export const useVirtualScroller = (
  items: any[],
  itemHeight: number,
  containerHeight: number,
  scrollTop: number
) => {
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - 5); // 5 items buffer
  const endIndex = Math.min(
    items.length,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + 5
  );

  const visibleItems = items.slice(startIndex, endIndex);
  const offsetY = startIndex * itemHeight;

  return {
    visibleItems,
    offsetY,
    totalHeight: items.length * itemHeight,
    startIndex,
    endIndex
  };
};

/**
 * Request Animation Frame Hook
 * Syncs updates with browser refresh rate
 */
export const useRequestAnimationFrame = (callback: () => void) => {
  const frameRef = useRef<number | null>(null);

  const animate = useCallback(() => {
    callback();
    frameRef.current = requestAnimationFrame(animate);
  }, [callback]);

  useEffect(() => {
    frameRef.current = requestAnimationFrame(animate);
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [animate]);
};

/**
 * Intersection Observer Hook
 * Detects when element comes into view
 */
export const useIntersectionObserver = (
  ref: RefObject<HTMLElement>,
  options: IntersectionObserverInit = {}
): boolean => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      setIsVisible(entry.isIntersecting);
    }, {
      rootMargin: '50px',
      ...options
    });

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [ref, options]);

  return isVisible;
};

/**
 * Page Visibility Hook
 * Detects if page is visible to user
 */
export const usePageVisibility = (): boolean => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(document.visibilityState === 'visible');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return isVisible;
};

/**
 * Lazy Load Component Hook
 * Loads code splitting components efficiently
 */
export const useLazyComponent = <T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>
): [T | null, boolean, Error | null] => {
  const [component, setComponent] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    importFunc()
      .then(module => {
        setComponent(module.default);
      })
      .catch(err => {
        setError(err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [importFunc]);

  return [component, loading, error];
};

/**
 * Prevent Layout Shift utility
 * Helps maintain aspect ratio during image loading
 */
export const getAspectRatioPadding = (width: number, height: number): string => {
  const ratio = (height / width) * 100;
  return `${ratio}%`;
};

/**
 * Image optimization utility
 * Creates optimized image URLs with size hints
 */
export const getOptimizedImageUrl = (
  url: string,
  width: number,
  height: number,
  quality: number = 80
): string => {
  // If using a CDN that supports URL parameters, add optimization
  if (url.includes('amazonaws.com') || url.includes('cloudinary.com')) {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}w=${width}&h=${height}&q=${quality}&fm=auto`;
  }
  return url;
};
