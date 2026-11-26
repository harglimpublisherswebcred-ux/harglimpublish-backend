const courierAdapters = require('../shipping/couriers');

const COURIER_METADATA = {
  manual: { name: 'Manual Courier', mode: 'MANUAL' },
  shiprocket: { name: 'Shiprocket', mode: 'EXTERNAL' },
  delhivery: { name: 'Delhivery', mode: 'EXTERNAL' },
  bluedart: { name: 'Blue Dart', mode: 'EXTERNAL' },
  dtdc: { name: 'DTDC', mode: 'EXTERNAL' },
  indiapost: { name: 'India Post', mode: 'EXTERNAL' }
};

class CourierCatalogService {
  list() {
    return Object.keys(courierAdapters).map((provider) => {
      const metadata = COURIER_METADATA[provider] || { name: provider, mode: 'EXTERNAL' };
      const available = provider === 'manual';
      return {
        provider,
        name: metadata.name,
        mode: metadata.mode,
        available,
        supportsAutomaticBooking: false,
        supportsManualTracking: provider === 'manual',
        status: available ? 'AVAILABLE' : 'NOT_CONFIGURED'
      };
    });
  }
}

module.exports = new CourierCatalogService();
module.exports.CourierCatalogService = CourierCatalogService;
