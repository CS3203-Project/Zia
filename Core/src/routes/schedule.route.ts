import { Router } from 'express';
import { getCurrentScheduleTimes } from '../controllers/schedule.controller.js';
import validate from '../middlewares/validation.middleware.js';
import { serviceIdSchema } from '../validators/schedule.validator.js';

const router: Router = Router();

/**
 * @route   GET /api/schedule/current/:serviceId
 * @desc    Upcoming slots the service's provider is already committed to
 * @access  Public
 *
 * The POST / and PUT /:id routes that used to sit here pointed at empty stub
 * handlers which never sent a response, so calling them hung the connection
 * until it timed out. Bookings are created and updated via /api/bookings.
 */
router.get('/current/:serviceId', validate(serviceIdSchema), getCurrentScheduleTimes);

export default router;
