import { Router } from 'express';
import {
  getBookingController,
  quoteBookingController,
  acceptBookingController,
  markCashPaidController,
  completeBookingController,
  cancelBookingController,
  getServiceQueueController,
  getActiveBookingController,
  getBookingTimelineController,
} from '../controllers/booking.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const router: Router = Router();

// Public: the upcoming booking queue shown on a service's detail page.
router.get('/service/:serviceId/queue', getServiceQueueController);

// Everything below acts on a specific booking and requires a signed-in participant.
router.use(authMiddleware);

router.get('/timeline', getBookingTimelineController);
router.get('/active/:serviceId', getActiveBookingController);
router.get('/conversation/:conversationId', getBookingController);
router.post('/conversation/:conversationId/quote', quoteBookingController);
router.post('/conversation/:conversationId/accept', acceptBookingController);
router.post('/conversation/:conversationId/cash-paid', markCashPaidController);
router.post('/conversation/:conversationId/complete', completeBookingController);
router.post('/conversation/:conversationId/cancel', cancelBookingController);

export default router;
