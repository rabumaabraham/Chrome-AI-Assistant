/**
 * Express Application Setup
 * Main application configuration and middleware setup
 */

const express = require('express');
const path = require('path');
const config = require('../config/index.js');
const logger = require('./services/Logger.js');
const { initializeSecurity } = require('./middleware/security.js');
const routes = require('./routes/index.js');

class Application {
    constructor() {
        this.app = express();
        this.serviceLogger = logger.getServiceLogger('App');
        this.setupMiddleware();
        this.setupRoutes();
        this.setupErrorHandling();
    }

    setupMiddleware() {
        // Body parsing middleware
        this.app.use(express.json({ limit: '50mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '50mb' }));

        // Security middleware
        initializeSecurity(this.app);

        // Static files (if needed)
        this.app.use(express.static(path.join(__dirname, '../public')));

        this.serviceLogger.info('Middleware setup completed');
    }

    setupRoutes() {
        // API routes
        this.app.use('/', routes);

        // 404 handler
        this.app.use('*', (req, res) => {
            res.status(404).json({
                success: false,
                error: 'Not found',
                message: `Route ${req.originalUrl} not found`
            });
        });

        this.serviceLogger.info('Routes setup completed');
    }

    setupErrorHandling() {
        // Global error handler
        this.app.use((err, req, res, next) => {
            this.serviceLogger.error('Unhandled application error', {
                error: err.message,
                stack: err.stack,
                url: req.url,
                method: req.method,
                ip: req.ip
            });

            res.status(err.status || 500).json({
                success: false,
                error: 'Internal server error',
                message: config.server.environment === 'development' ? err.message : 'Something went wrong'
            });
        });

        // Graceful shutdown handling
        process.on('SIGTERM', () => this.gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => this.gracefulShutdown('SIGINT'));
        process.on('uncaughtException', (err) => this.handleUncaughtException(err));
        process.on('unhandledRejection', (reason) => this.handleUnhandledRejection(reason));
    }

    gracefulShutdown(signal) {
        this.serviceLogger.info(`${signal} received, shutting down gracefully`);
        
        this.server.close(() => {
            this.serviceLogger.info('HTTP server closed');
            process.exit(0);
        });

        // Force close after 10 seconds
        setTimeout(() => {
            this.serviceLogger.error('Could not close connections in time, forcefully shutting down');
            process.exit(1);
        }, 10000);
    }

    handleUncaughtException(err) {
        this.serviceLogger.error('Uncaught Exception', {
            error: err.message,
            stack: err.stack
        });
        process.exit(1);
    }

    handleUnhandledRejection(reason) {
        this.serviceLogger.error('Unhandled Rejection', {
            reason: reason
        });
        process.exit(1);
    }

    start() {
        return new Promise((resolve, reject) => {
            try {
                this.server = this.app.listen(config.server.port, config.server.host, () => {
                    this.serviceLogger.info('Server started successfully', {
                        port: config.server.port,
                        host: config.server.host,
                        environment: config.server.environment
                    });
                    resolve(this.server);
                });

                this.server.on('error', (err) => {
                    this.serviceLogger.error('Server startup failed', {
                        error: err.message,
                        port: config.server.port,
                        host: config.server.host
                    });
                    reject(err);
                });

            } catch (error) {
                this.serviceLogger.error('Application startup failed', {
                    error: error.message,
                    stack: error.stack
                });
                reject(error);
            }
        });
    }
}

module.exports = Application;
