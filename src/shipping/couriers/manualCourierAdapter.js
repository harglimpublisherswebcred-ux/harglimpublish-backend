const crypto = require('crypto');

const providerUrlBuilders = {
  indiapost: (trackingNumber) => `https://www.indiapost.gov.in/_layouts/15/dptcp.gear/tracking.aspx?articleno=${encodeURIComponent(trackingNumber)}`,
  india_post: (trackingNumber) => `https://www.indiapost.gov.in/_layouts/15/dptcp.gear/tracking.aspx?articleno=${encodeURIComponent(trackingNumber)}`,
  delhivery: (trackingNumber) => `https://www.delhivery.com/track/package/${encodeURIComponent(trackingNumber)}`,
  bluedart: (trackingNumber) => `https://www.bluedart.com/tracking?trackFor=0&trackNo=${encodeURIComponent(trackingNumber)}`,
  blue_dart: (trackingNumber) => `https://www.bluedart.com/tracking?trackFor=0&trackNo=${encodeURIComponent(trackingNumber)}`,
  dtdc: (trackingNumber) => `https://www.dtdc.in/tracking/tracking_results.asp?Ttype=awb_no&strCnno=${encodeURIComponent(trackingNumber)}`,
  ekart: (trackingNumber) => `https://ekartlogistics.com/shipmenttrack/${encodeURIComponent(trackingNumber)}`
};

const normalizeProviderKey = (value = '') => String(value).trim().toLowerCase().replace(/[^a-z0-9]+/g, '_');

class ManualCourierAdapter {
  constructor({ provider = 'manual' } = {}) {
    this.provider = provider;
  }

  async assign(shipment, options = {}) {
    const trackingNumber = options.trackingNumber || `MAN-${crypto.randomUUID().split('-')[0].toUpperCase()}`;
    const serviceName = options.serviceName || options.courierName || 'Manual Courier';
    const providerKey = normalizeProviderKey(serviceName || options.provider);
    const buildTrackingUrl = providerUrlBuilders[providerKey];
    return {
      provider: this.provider,
      serviceName,
      trackingNumber,
      trackingUrl: options.trackingUrl || (buildTrackingUrl ? buildTrackingUrl(trackingNumber) : `/track/${trackingNumber}`),
      estimatedDelivery: options.estimatedDelivery,
      description: 'Manual courier assigned'
    };
  }
}

module.exports = new ManualCourierAdapter();
module.exports.ManualCourierAdapter = ManualCourierAdapter;
