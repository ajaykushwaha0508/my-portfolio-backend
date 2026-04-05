const logger = require('../utils/logger');

function notFound(req, res) {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
}

function errorHandler(err, req, res, _next) {
  const status = err.status || 500;
  logger.error(`${status} — ${err.message}`);

  res.status(status).json({
    success: false,
    message: status === 500
      ? 'Something went wrong on the server. Please try again later.'
      : err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

module.exports = { notFound, errorHandler };
