const winston = require('winston');

const enableFileLogs = process.env.LOG_TO_FILE !== 'false';
const transports = [
  new winston.transports.Console({
    format: process.env.NODE_ENV === 'production'
      ? winston.format.json()
      : winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
  })
];

if (enableFileLogs) {
  transports.push(
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  );
}

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'hm-backend' },
  transports,
});

module.exports = logger;
