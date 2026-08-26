import { Router, type Router as ExpressRouter } from 'express';
import authMiddleware from '../middlewares/auth.middleware.js';
import {
  addToWishlist,
  removeFromWishlist,
  listWishlist,
} from '../services/wishlist.service.js';

const router: ExpressRouter = Router();

// A wishlist is private to its owner, so every route takes the user from the
// token. Nothing here accepts a userId from the client.
router.use(authMiddleware);

router.get('/', async (req, res, next) => {
  try {
    const userId = (req as any).user?.id;
    res.json({ success: true, data: await listWishlist(userId) });
  } catch (err) {
    next(err);
  }
});

router.post('/:serviceId', async (req, res, next) => {
  try {
    const userId = (req as any).user?.id;
    await addToWishlist(userId, String(req.params.serviceId));
    res.status(201).json({ success: true, saved: true });
  } catch (err) {
    next(err);
  }
});

router.delete('/:serviceId', async (req, res, next) => {
  try {
    const userId = (req as any).user?.id;
    await removeFromWishlist(userId, String(req.params.serviceId));
    res.json({ success: true, saved: false });
  } catch (err) {
    next(err);
  }
});

export default router;
