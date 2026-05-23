// Commonjs wrapper for socket.ts
// This file exists to allow server.js to import the module without TypeScript issues

// Re-export from the TypeScript module
const socketModule = require('./socket.ts');

module.exports = socketModule; 