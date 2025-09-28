/**
 * Server Entry Point
 * Application server startup and configuration
 */

const Application = require('./app.js');
const config = require('../config/index.js');
const logger = require('./services/Logger.js');

async function startServer() {
    try {
        logger.info('Starting Chrome AI Assistant Backend', {
            version: process.env.npm_package_version || '1.0.0',
            environment: config.server.environment,
            port: config.server.port
        });

        // Create and start the application
        const app = new Application();
        await app.start();

        logger.info('Chrome AI Assistant Backend is ready', {
            url: `http://${config.server.host}:${config.server.port}`,
            environment: config.server.environment
        });

    } catch (error) {
        logger.error('Failed to start server', {
            error: error.message,
            stack: error.stack
        });
        process.exit(1);
    }
}

// Start the server
if (require.main === module) {
    startServer();
}

module.exports = { startServer };
