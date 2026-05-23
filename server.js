const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const path = require('path');

// Use dotenv if available
try {
  require('dotenv').config();
} catch (error) {
  console.log('dotenv not found, using default environment variables');
}

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

// Set up for dynamic import later
const socketModulePath = path.join(__dirname, 'lib', 'socket');

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  // Load the socket module manually
  try {
    // Try to load using TypeScript register
    require('@swc-node/register');
    const { initSocketServer } = require('./lib/socket');
    initSocketServer(server);
  } catch (err) {
    console.log('Error loading with TypeScript, falling back to JS:', err.message);
    try {
      // Fallback to plain JS if available
      const { initSocketServer } = require('./lib/socket.js');
      initSocketServer(server);
    } catch (jsErr) {
      console.error('Failed to load socket module:', jsErr);
    }
  }

  const PORT = process.env.PORT || 3000;
  server.listen(PORT, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${PORT}`);
  });
}); 