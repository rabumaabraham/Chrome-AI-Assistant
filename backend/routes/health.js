// Health Check Routes
const express = require('express');
const winston = require('winston');

const router = express.Router();
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'logs/health.log' })
    ]
});

// GET /health - Basic health check
router.get('/', (req, res) => {
    const healthStatus = {
        success: true,
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: {
            used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
            total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
            external: Math.round(process.memoryUsage().external / 1024 / 1024)
        },
        environment: process.env.NODE_ENV || 'development',
        version: '1.0.0'
    };

    logger.info('Health check requested', {
        ip: req.ip,
        userAgent: req.get('User-Agent')
    });

    res.json(healthStatus);
});

// GET /health/detailed - Detailed health check with service dependencies
router.get('/detailed', async (req, res) => {
    const startTime = Date.now();
    const checks = {};

    try {
        // Check OpenAI API
        checks.openai = await checkOpenAI();
        
        // Check Tesseract.js
        checks.tesseract = await checkTesseract();
        
        // Check system resources
        checks.system = checkSystemResources();
        
        // Check environment variables
        checks.environment = checkEnvironmentVariables();

        const totalTime = Date.now() - startTime;
        const allHealthy = Object.values(checks).every(check => check.status === 'healthy');

        const healthStatus = {
            success: allHealthy,
            status: allHealthy ? 'healthy' : 'degraded',
            timestamp: new Date().toISOString(),
            responseTime: totalTime,
            checks: checks,
            uptime: process.uptime(),
            memory: {
                used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
                total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
                external: Math.round(process.memoryUsage().external / 1024 / 1024)
            },
            environment: process.env.NODE_ENV || 'development',
            version: '1.0.0'
        };

        logger.info('Detailed health check completed', {
            status: healthStatus.status,
            responseTime: totalTime,
            checks: Object.keys(checks)
        });

        res.status(allHealthy ? 200 : 503).json(healthStatus);

    } catch (error) {
        logger.error('Health check failed:', error);
        
        res.status(503).json({
            success: false,
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: error.message,
            checks: checks
        });
    }
});

// GET /health/ready - Kubernetes readiness probe
router.get('/ready', (req, res) => {
    // Simple readiness check - just verify the server is running
    res.json({
        success: true,
        status: 'ready',
        timestamp: new Date().toISOString()
    });
});

// GET /health/live - Kubernetes liveness probe
router.get('/live', (req, res) => {
    // Simple liveness check - just verify the server is responding
    res.json({
        success: true,
        status: 'alive',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Helper function to check OpenAI API
async function checkOpenAI() {
    try {
        if (!process.env.OPENAI_API_KEY) {
            return {
                status: 'unhealthy',
                message: 'OpenAI API key not configured',
                error: 'Missing OPENAI_API_KEY environment variable'
            };
        }

        // Simple test request to OpenAI
        const OpenAI = require('openai');
        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });

        const startTime = Date.now();
        const completion = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: 'Hello' }],
            max_tokens: 5
        });

        const responseTime = Date.now() - startTime;

        return {
            status: 'healthy',
            message: 'OpenAI API is accessible',
            responseTime: responseTime,
            model: process.env.OPENAI_MODEL || 'gpt-4'
        };

    } catch (error) {
        return {
            status: 'unhealthy',
            message: 'OpenAI API is not accessible',
            error: error.message,
            code: error.code
        };
    }
}

// Helper function to check Tesseract.js
async function checkTesseract() {
    try {
        const Tesseract = require('tesseract.js');
        
        // Create a simple test image (1x1 pixel)
        const testImageBuffer = Buffer.from(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
            'base64'
        );

        const startTime = Date.now();
        const { data } = await Tesseract.recognize(testImageBuffer, 'eng', {
            logger: () => {} // Suppress logs
        });

        const responseTime = Date.now() - startTime;

        return {
            status: 'healthy',
            message: 'Tesseract.js is working',
            responseTime: responseTime,
            language: 'eng'
        };

    } catch (error) {
        return {
            status: 'unhealthy',
            message: 'Tesseract.js is not working',
            error: error.message
        };
    }
}

// Helper function to check system resources
function checkSystemResources() {
    const memoryUsage = process.memoryUsage();
    const memoryUsagePercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
    
    const isMemoryHealthy = memoryUsagePercent < 90; // Consider unhealthy if using >90% of heap
    
    return {
        status: isMemoryHealthy ? 'healthy' : 'degraded',
        message: isMemoryHealthy ? 'System resources are adequate' : 'High memory usage detected',
        memory: {
            used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
            total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
            percentage: Math.round(memoryUsagePercent)
        },
        uptime: process.uptime()
    };
}

// Helper function to check environment variables
function checkEnvironmentVariables() {
    const requiredVars = ['OPENAI_API_KEY'];
    const optionalVars = ['OPENAI_MODEL', 'PORT', 'NODE_ENV'];
    
    const missing = requiredVars.filter(varName => !process.env[varName]);
    const present = requiredVars.filter(varName => process.env[varName]);
    
    return {
        status: missing.length === 0 ? 'healthy' : 'unhealthy',
        message: missing.length === 0 ? 'All required environment variables are set' : 'Some required environment variables are missing',
        required: {
            present: present,
            missing: missing
        },
        optional: optionalVars.filter(varName => process.env[varName])
    };
}

module.exports = router;
