const normalizeSlug = (value) => String(value || '')
  .trim()
  .toLowerCase()
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .replace(/-{2,}/g, '-');

const createBaseSlug = (value, fallbackId) => {
  const normalized = normalizeSlug(value);
  if (normalized) return normalized;
  const suffix = fallbackId ? `-${String(fallbackId).slice(-8)}` : '';
  return `book${suffix}`;
};

const slugCandidate = (baseSlug, attempt = 0) => (attempt === 0 ? baseSlug : `${baseSlug}-${attempt + 1}`);

const isBookSlugDuplicateError = (error) => {
  if (!error || error.code !== 11000) return false;
  if (error.keyPattern && Object.prototype.hasOwnProperty.call(error.keyPattern, 'slug')) return true;
  if (error.keyValue && Object.prototype.hasOwnProperty.call(error.keyValue, 'slug')) return true;
  return /index:\s*slug_1/i.test(String(error.message || ''));
};

const isValidBookSlug = (value) => {
  const normalized = normalizeSlug(value);
  return normalized.length > 0 && normalized === String(value || '').trim().toLowerCase();
};

module.exports = {
  normalizeSlug,
  createBaseSlug,
  slugCandidate,
  isBookSlugDuplicateError,
  isValidBookSlug
};
