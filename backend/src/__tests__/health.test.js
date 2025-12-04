/**
 * Health Check Tests
 * Basic tests for API health endpoints
 */

const request = require('supertest');
const Application = require('../app.js');

describe('Health Check API', () => {
    let app;
    let server;
    
    beforeAll(async () => {
        // Mock environment variables for testing
        process.env.NODE_ENV = 'test';
        process.env.OPENROUTER_API_KEY = 'test-key';
        process.env.PORT = '3001';
        
        // Create and start the application
        app = new Application();
        server = await app.start();
    });
    
    afterAll(async () => {
        if (server) {
            await new Promise(resolve => server.close(resolve));
        }
    });
    
    test('Health endpoint should return 200', async () => {
        const response = await request(app.app)
            .get('/api/health')
            .expect(200);
            
        expect(response.body.success).toBe(true);
        expect(response.body.service).toBe('SnapQuery API');
    });
    
    test('Root endpoint should return 200', async () => {
        const response = await request(app.app)
            .get('/api')
            .expect(200);
            
        expect(response.body.success).toBe(true);
        expect(response.body.message).toContain('running');
    });
});
