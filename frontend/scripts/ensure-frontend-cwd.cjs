const path = require('path');
const fs = require('fs');

const cwd = process.cwd();
const normalized = cwd.replace(/\\/g, '/');

// Also allow cwd that contains a next.config file (e.g. Docker WORKDIR /app)
const hasNextConfig =
  fs.existsSync(path.join(cwd, 'next.config.js')) ||
  fs.existsSync(path.join(cwd, 'next.config.ts')) ||
  fs.existsSync(path.join(cwd, 'next.config.mjs'));

if (!normalized.endsWith('/frontend') && !hasNextConfig) {
  const expected = path.join(process.cwd(), 'frontend');
  console.error(
    '[rahal-frontend] Run this app from the frontend directory.\n' +
      `Current cwd: ${cwd}\n` +
      'Use:\n' +
      '  cd frontend\n' +
      '  npm install\n' +
      '  npm run dev\n' +
      `Expected app root: ${expected}`
  );
  process.exit(1);
}
