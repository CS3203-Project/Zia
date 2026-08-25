import type { Request, Response, NextFunction } from 'express';

/**
 * Global error handler — must be registered LAST, after every route. Express's own
 * default error handler (what runs when nothing else catches next(err)) returns an HTML
 * error page, not JSON. Every controller in this codebase follows the
 * `try { ... } catch (err) { next(err); }` pattern expecting *something* downstream to
 * turn that into a proper API response — this is that something. Without it, any
 * business-logic error a controller throws (e.g. "Service provider profile not found")
 * surfaces to the frontend as an unparseable HTML blob instead of the
 * `{ success, message }` JSON shape every other response in this API uses.
 */
export default function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  console.error(`Unhandled error on ${req.method} ${req.originalUrl}:`, err);

  const message = err instanceof Error ? err.message : 'An unexpected error occurred';

  // Controllers here throw plain `Error('X not found')` rather than a typed error
  // hierarchy — this maps that convention to a 404 instead of a generic 500 without
  // requiring every throw site to be rewritten. Anything else is a genuine server error.
  const isNotFound = /not found/i.test(message);
  const statusCode =
    (err as { statusCode?: number; status?: number })?.statusCode ??
    (err as { statusCode?: number; status?: number })?.status ??
    (isNotFound ? 404 : 500);

  res.status(statusCode).json({
    success: false,
    // Don't leak internal error details for genuine 500s — the message is logged above.
    message: statusCode >= 500 ? 'An unexpected error occurred. Please try again later.' : message,
  });
}
