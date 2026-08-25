import type { Request, Response, NextFunction } from 'express';

export default (req: Request, res: Response, next: NextFunction) => {
  const key = req.headers['x-internal-key'];

  if (!key || key !== process.env.INTERNAL_API_KEY) {
    return res.status(401).json({ message: 'Unauthorized: invalid internal key' });
  }

  next();
};
