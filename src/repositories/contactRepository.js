const ContactRequest = require('../models/ContactRequest');

class ContactRepository {
  create(data) {
    return ContactRequest.create(data);
  }
}

module.exports = new ContactRepository();
module.exports.ContactRepository = ContactRepository;
