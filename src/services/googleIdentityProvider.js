const { OAuth2Client } = require('google-auth-library');
const { hasUsableValue } = require('../config/environment');

const GOOGLE_PROVIDER = 'GOOGLE';
const VALID_GOOGLE_ISSUERS = new Set(['accounts.google.com', 'https://accounts.google.com']);

const providerError = (message, statusCode, code) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  return error;
};

class GoogleIdentityProvider {
  constructor(client = new OAuth2Client()) {
    this.client = client;
  }

  async verifyCredential(credential) {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!hasUsableValue(clientId)) {
      throw providerError('Google login is not configured', 503, 'GOOGLE_AUTH_NOT_CONFIGURED');
    }

    try {
      const ticket = await this.client.verifyIdToken({
        idToken: credential,
        audience: clientId
      });
      const payload = ticket.getPayload();

      if (!payload || !payload.sub) {
        throw providerError('Invalid Google credential', 401, 'INVALID_GOOGLE_CREDENTIAL');
      }

      if (!VALID_GOOGLE_ISSUERS.has(payload.iss)) {
        throw providerError('Invalid Google credential issuer', 401, 'INVALID_GOOGLE_CREDENTIAL');
      }

      if (!payload.email || payload.email_verified !== true) {
        throw providerError('Google account email must be verified', 401, 'GOOGLE_EMAIL_NOT_VERIFIED');
      }

      return {
        provider: GOOGLE_PROVIDER,
        providerSubject: payload.sub,
        email: String(payload.email).toLowerCase(),
        emailVerified: true,
        name: payload.name || payload.email,
        picture: payload.picture || ''
      };
    } catch (error) {
      if (error.code && error.statusCode) throw error;
      throw providerError('Invalid Google credential', 401, 'INVALID_GOOGLE_CREDENTIAL');
    }
  }
}

module.exports = new GoogleIdentityProvider();
module.exports.GoogleIdentityProvider = GoogleIdentityProvider;
module.exports.GOOGLE_PROVIDER = GOOGLE_PROVIDER;
