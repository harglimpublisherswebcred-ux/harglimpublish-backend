const eventBus = require('./eventBus');
const { DOMAIN_EVENTS } = require('./eventCatalog');
const authorAccessService = require('../services/authorAccessService');
const logger = require('../utils/logger');

let registered = false;

const registerAuthorAccessSubscriber = ({ bus = eventBus, service = authorAccessService, serviceLogger = logger } = {}) => {
  if (registered) return [];

  const subscriptionId = bus.subscribe(
    DOMAIN_EVENTS.PAYMENT_VERIFIED,
    async (event) => {
      if (!event.payload || event.payload.purpose !== 'AUTHOR_ACCESS') {
        return;
      }

      const startedAt = Date.now();
      const result = await service.grantEntitlementOnVerifiedPayment(event.payload.paymentId);

      serviceLogger.info('author_access.subscriber_processed', {
        service: 'hm-backend',
        eventId: event.eventId,
        correlationId: event.correlationId,
        paymentId: event.payload.paymentId,
        granted: result.granted,
        reason: result.reason,
        durationMs: Date.now() - startedAt
      });
    },
    {
      id: 'authorAccess:PaymentVerified'
    }
  );

  registered = true;
  return [subscriptionId];
};

const resetAuthorAccessSubscriberRegistration = () => {
  registered = false;
};

module.exports = {
  registerAuthorAccessSubscriber,
  resetAuthorAccessSubscriberRegistration
};
