const cors = require('cors');

const parseOrigins = () => {
  const origins = [];

  if (process.env.CLIENT_URL) {
    origins.push(process.env.CLIENT_URL.trim().replace(/\/$/, ''));
  }

  if (process.env.CLIENT_URLS) {
    process.env.CLIENT_URLS.split(',')
      .map((url) => url.trim().replace(/\/$/, ''))
      .filter(Boolean)
      .forEach((url) => origins.push(url));
  }

  if (process.env.NODE_ENV !== 'production') {
    origins.push(
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://localhost:5000'
    );
  }

  return [...new Set(origins)];
};

const corsOptions = {
  origin(origin, callback) {
    const allowedOrigins = parseOrigins();

    // Allow server-to-server, Postman, Render health checks (no Origin header)
    if (!origin) {
      return callback(null, true);
    }

    const normalized = origin.replace(/\/$/, '');

    if (allowedOrigins.includes(normalized)) {
      return callback(null, true);
    }

    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

module.exports = cors(corsOptions);
module.exports.parseOrigins = parseOrigins;
