const MAX_BOOK_LANGUAGE_LENGTH = 80;

const normalizeBookLanguage = (value) => {
  if (typeof value !== 'string') {
    const error = new Error('language must be a string');
    error.code = 'BOOK_LANGUAGE_INVALID_TYPE';
    throw error;
  }

  const normalized = value.trim().replace(/\s+/gu, ' ');
  if (!normalized) {
    const error = new Error('language must not be empty');
    error.code = 'BOOK_LANGUAGE_REQUIRED';
    throw error;
  }
  if (normalized.length > MAX_BOOK_LANGUAGE_LENGTH) {
    const error = new Error(`language must not exceed ${MAX_BOOK_LANGUAGE_LENGTH} characters`);
    error.code = 'BOOK_LANGUAGE_TOO_LONG';
    throw error;
  }
  if (/\p{Cc}/u.test(normalized)) {
    const error = new Error('language contains invalid control characters');
    error.code = 'BOOK_LANGUAGE_INVALID_CHARACTERS';
    throw error;
  }
  return normalized;
};

const normalizeBookLanguageInput = (payload = {}) => {
  const normalized = { ...payload };
  if (Object.prototype.hasOwnProperty.call(payload, 'language')) {
    normalized.language = normalizeBookLanguage(payload.language);
  }
  return normalized;
};

module.exports = { MAX_BOOK_LANGUAGE_LENGTH, normalizeBookLanguage, normalizeBookLanguageInput };
