/**
 * Legacy Entry Point
 * Redirects to the new modular architecture
 */

const { startServer } = require('./src/server');

// Start the server using the new architecture
startServer().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
});