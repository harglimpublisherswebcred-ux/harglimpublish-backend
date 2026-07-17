const paymentRepository = require('../repositories/paymentRepository');
const paymentService = require('../services/paymentService');
const inventoryService = require('../services/inventoryService');
const notificationService = require('../services/notificationService');
const logger = require('../utils/logger');

const DEFAULT_INTERVAL_MS = 5 * 60 * 1000;
const DEFAULT_BATCH_LIMIT = 50;

class MaintenanceWorker {
  constructor({ serviceLogger = logger } = {}) {
    this.logger = serviceLogger;
    this.timer = null;
    this.running = false;
  }

  start() {
    if (this.timer || process.env.NODE_ENV === 'test' || process.env.DISABLE_MAINTENANCE_WORKER === 'true') return;
    const intervalMs = Math.max(parseInt(process.env.MAINTENANCE_WORKER_INTERVAL_MS, 10) || DEFAULT_INTERVAL_MS, 30000);
    this.timer = setInterval(() => {
      this.runOnce().catch((error) => this.logger.error('maintenance_worker.failed', { message: error.message }));
    }, intervalMs);
    if (this.timer.unref) this.timer.unref();
    this.logger.info('maintenance_worker.started', { intervalMs });
  }

  stop() {
    if (!this.timer) return;
    clearInterval(this.timer);
    this.timer = null;
    this.logger.info('maintenance_worker.stopped');
  }

  async runOnce(now = new Date()) {
    if (this.running) return { skipped: true };
    this.running = true;
    try {
      const [payments, reservations, notifications] = await Promise.all([
        this.expirePayments(now),
        inventoryService.expireReservations(now, { reason: 'Reservation expired by maintenance worker' }),
        this.retryFailedNotifications()
      ]);
      const result = { expiredPayments: payments, expiredReservations: reservations.length || 0, retriedNotifications: notifications };
      this.logger.info('maintenance_worker.completed', result);
      return result;
    } finally {
      this.running = false;
    }
  }

  async expirePayments(now) {
    const result = await paymentRepository.findExpiredIntents(now, { page: 1, limit: DEFAULT_BATCH_LIMIT }, { lean: true });
    let count = 0;
    for (const payment of result.items || []) {
      try {
        const expired = await paymentService.expirePaymentIntent(payment._id, { reason: 'Payment intent expired by maintenance worker' });
        await inventoryService.releaseByPayment(expired._id, { reason: 'Inventory released after payment expiry' });
        count += 1;
      } catch (error) {
        this.logger.warn('maintenance_worker.payment_expiry_failed', { paymentId: String(payment._id), message: error.message });
      }
    }
    return count;
  }

  async retryFailedNotifications() {
    if (!notificationService.retryFailedNotifications) return 0;
    return notificationService.retryFailedNotifications({ limit: DEFAULT_BATCH_LIMIT });
  }
}

module.exports = new MaintenanceWorker();
module.exports.MaintenanceWorker = MaintenanceWorker;
