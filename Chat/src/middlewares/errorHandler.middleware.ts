import type { Request, Response, NextFunction } from 'express';

/**
 * Global error handler — must be registered LAST, after every route. Express's own
 * default error handler (what runs when nothing else catches next(err)) returns an HTML
 * error page, not JSON, breaking any frontend code expecting the
 * `{ success, message }` JSON shape the rest of this API uses.
 */
export default function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  console.error(`Unhandled error on ${req.method} ${req.originalUrl}:`, err);

  const message = err instanceof Error ? err.message : 'An unexpected error occurred';

  const isNotFound = /not found/i.test(message);
  const statusCode =
    (err as { statusCode?: number; status?: number })?.statusCode ??
    (err as { statusCode?: number; status?: number })?.status ??
    (isNotFound ? 404 : 500);

  res.status(statusCode).json({
    success: false,
    message: statusCode >= 500 ? 'An unexpected error occurred. Please try again later.' : message,
  });
}
