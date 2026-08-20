const UNIT_MINUTES = {
  m: 1,
  min: 1,
  mins: 1,
  minute: 1,
  minutes: 1,
  h: 60,
  hr: 60,
  hrs: 60,
  hour: 60,
  hours: 60,
  d: 1440,
  day: 1440,
  days: 1440,
  w: 10080,
  week: 10080,
  weeks: 10080,
  month: 43200,
  months: 43200
};

const parseDurationToMinutes = (value, fallbackMinutes) => {
  if (value === undefined || value === null || value === '') return fallbackMinutes;
  if (typeof value === 'number') return Number.isFinite(value) && value > 0 ? value : fallbackMinutes;

  const normalized = String(value).trim().toLowerCase();
  if (/^\d+(\.\d+)?$/.test(normalized)) {
    const minutes = Number(normalized);
    return minutes > 0 ? minutes : fallbackMinutes;
  }

  const match = normalized.match(/^(\d+(?:\.\d+)?)\s*([a-z]+)$/);
  if (!match) return fallbackMinutes;

  const amount = Number(match[1]);
  const unit = match[2];
  const multiplier = UNIT_MINUTES[unit];

  if (!Number.isFinite(amount) || amount <= 0 || !multiplier) return fallbackMinutes;
  return amount * multiplier;
};

module.exports = {
  parseDurationToMinutes
};
