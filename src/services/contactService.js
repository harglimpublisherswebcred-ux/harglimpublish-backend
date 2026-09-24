const contactRepository = require('../repositories/contactRepository');
const logger = require('../utils/logger');

const optionalString = (value) => {
  if (value === undefined || value === null) return undefined;
  const trimmed = String(value).trim();
  return trimmed || undefined;
};

const requiredString = (value, field) => {
  const trimmed = optionalString(value);
  if (!trimmed) {
    const error = new Error(`${field} is required`);
    error.statusCode = 400;
    throw error;
  }
  return trimmed;
};

class ContactService {
  constructor(repository = contactRepository) {
    this.repository = repository;
  }

  async submit(payload = {}, context = {}) {
    const contact = await this.repository.create({
      name: requiredString(payload.name, 'Name'),
      email: requiredString(payload.email, 'Email').toLowerCase(),
      phone: optionalString(payload.phone || payload.mobile || payload.mobileNumber),
      subject: optionalString(payload.subject) || 'Website contact request',
      message: requiredString(payload.message, 'Message'),
      source: optionalString(payload.source) || 'website',
      metadata: {
        page: optionalString(payload.page),
        requestId: context.requestId,
        ip: context.ip
      }
    });

    logger.info('contact_request.created', {
      contactRequestId: contact._id,
      source: contact.source,
      requestId: context.requestId
    });

    return {
      _id: contact._id,
      name: contact.name,
      email: contact.email,
      phone: contact.phone,
      subject: contact.subject,
      message: contact.message,
      status: contact.status,
      createdAt: contact.createdAt
    };
  }
}

module.exports = new ContactService();
module.exports.ContactService = ContactService;
