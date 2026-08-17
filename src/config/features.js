const parseBoolean = (value, fallback) => {
  if (value === undefined || value === null || String(value).trim() === '') return fallback;
  return ['true', '1', 'yes', 'on'].includes(String(value).trim().toLowerCase());
};

const isPaidAuthorDashboardAccessEnabled = () => parseBoolean(
  process.env.AUTHOR_DASHBOARD_PAID_ACCESS_ENABLED,
  true
);

const getFeatureFlags = () => ({
  paidAuthorDashboardAccess: isPaidAuthorDashboardAccessEnabled()
});

module.exports = {
  isPaidAuthorDashboardAccessEnabled,
  getFeatureFlags
};
