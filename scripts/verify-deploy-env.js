/**
 * Quick check before deploy. Run: node scripts/verify-deploy-env.js
 */
const requiredServer = ['MONGO_URI', 'JWT_SECRET', 'CLIENT_URL'];
const requiredClient = ['VITE_API_BASE_URL'];

const mode = process.argv[2] || 'server';

if (mode === 'server') {
  const missing = requiredServer.filter((key) => !process.env[key]);
  if (missing.length) {
    process.stderr.write(`Missing server env: ${missing.join(', ')}\n`);
    process.exit(1);
  }
  process.stderr.write('Server env OK for production.\n');
} else {
  const missing = requiredClient.filter((key) => !process.env[key]);
  if (missing.length) {
    process.stderr.write(`Missing client env: ${missing.join(', ')}\n`);
    process.exit(1);
  }
  if (!process.env.VITE_API_BASE_URL.endsWith('/api')) {
    process.stderr.write('Warning: VITE_API_BASE_URL should end with /api\n');
  }
  process.stderr.write('Client env OK for production.\n');
}
