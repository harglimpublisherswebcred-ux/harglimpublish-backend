const authRepository = require('../repositories/authRepository');
const { sendWelcomeEmail } = require('../utils/emailService');
const { generateToken } = require('../utils/tokenUtils');

const toAuthUser = (user) => ({
  _id: user.id,
  name: user.name,
  email: user.email,
  role: user.role
});

const serviceError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

class AuthService {
  constructor(repository = authRepository) {
    this.repository = repository;
  }

  async register({ name, email, password, role }) {
    const existing = await this.repository.findUserByEmail(email);
    if (existing) throw serviceError('User already exists', 400);

    const user = await this.repository.createUser({
      name,
      email,
      password,
      role: role || 'reader'
    });

    if (!user) throw serviceError('Invalid user data', 400);

    sendWelcomeEmail(user);

    return {
      user: toAuthUser(user),
      token: generateToken(user._id)
    };
  }

  async login({ email, password }) {
    const user = await this.repository.findUserByEmail(email, { includePassword: true });
    if (!user || !(await user.matchPassword(password))) {
      throw serviceError('Invalid credentials', 401);
    }

    return {
      user: toAuthUser(user),
      token: generateToken(user._id)
    };
  }

  getCurrentUser(userId) {
    return this.repository.findUserById(userId);
  }
}

module.exports = new AuthService();
module.exports.AuthService = AuthService;
