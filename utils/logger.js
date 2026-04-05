const levels = { info: '📘', warn: '⚠ ', error: '🔴' };

function log(level, message) {
  const ts = new Date().toISOString();
  console[level](`[${ts}] ${levels[level] || ''} ${message}`);
}

const logger = {
  info:  (msg) => log('info',  msg),
  warn:  (msg) => log('warn',  msg),
  error: (msg) => log('error', msg),
};

module.exports = logger;
