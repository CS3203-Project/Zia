// One-shot entrypoint for the booking-reminder sweep, run as a Kubernetes CronJob
// instead of an in-process node-cron timer. A timer running inside every replica of
// an always-on Deployment would send duplicate reminders once Core scales beyond one
// pod; a CronJob runs exactly one pod, once, per schedule tick, regardless of how many
// Core replicas are running.
import 'dotenv/config';
import { bookingReminderService } from '../services/booking-reminder.service.js';

async function run() {
  console.log('=====> Running booking reminder sweep...');
  await bookingReminderService.sendRemindersForUpcomingBookings();
  console.log('=====> Booking reminder sweep complete');
}

run()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('=====> Booking reminder sweep failed:', error);
    process.exit(1);
  });
