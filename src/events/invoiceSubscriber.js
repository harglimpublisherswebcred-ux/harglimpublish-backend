const eventBus = require('./eventBus');
const { DOMAIN_EVENTS } = require('./eventCatalog');
const invoiceService = require('../services/invoiceService');
const logger = require('../utils/logger');

let registered = false;

const registerInvoiceSubscriber = ({ bus = eventBus, service = invoiceService, serviceLogger = logger } = {}) => {
  if (registered) return [];

  const subscriptionId = bus.subscribe(DOMAIN_EVENTS.PAYMENT_VERIFIED, async (event) => {
    if (event.payload && event.payload.purpose && event.payload.purpose !== 'ORDER_PURCHASE') {
      serviceLogger.info('invoice.subscriber_skipped_non_order_payment', {
        eventId: event.eventId,
        paymentId: event.payload.paymentId,
        purpose: event.payload.purpose
      });
      return;
    }
    if (!event.payload || !event.payload.orderId) {
      return;
    }
    const startedAt = Date.now();
    const invoice = await service.generateFromPaymentVerifiedEvent(event);
    serviceLogger.info('invoice.subscriber_generated', {
      eventId: event.eventId,
      correlationId: event.correlationId,
      paymentId: event.payload.paymentId,
      invoiceNumber: invoice.invoiceNumber,
      durationMs: Date.now() - startedAt
    });
  }, {
    id: 'invoice:PaymentVerified'
  });

  registered = true;
  return [subscriptionId];
};

const resetInvoiceSubscriberRegistration = () => {
  registered = false;
};

module.exports = {
  registerInvoiceSubscriber,
  resetInvoiceSubscriberRegistration
};
