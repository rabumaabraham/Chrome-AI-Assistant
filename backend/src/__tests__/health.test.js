/**
 * Health Check Tests
 * Basic tests for API health endpoints
 */

const request = require('supertest');
const { startServer } = require('../server.js');

describe('Health Check API', () => {
    let server;
    
    beforeAll(async () => {
        // Mock environment variables for testing
        process.env.NODE_ENV = 'test';
        process.env.OPENROUTER_API_KEY = 'test-key';
        process.env.PORT = '3001';
        
        server = await startServer();
    });
    
    afterAll(async () => {
        if (server) {
            server.close();
        }
    });
    
    test('Health endpoint should return 200', async () => {
        const response = await request(server)
            .get('/api/health')
            .expect(200);
            
        expect(response.body.success).toBe(true);
        expect(response.body.service).toBe('Chrome AI Assistant API');
    });
    
    test('Root endpoint should return 200', async () => {
        const response = await request(server)
            .get('/api')
            .expect(200);
            
        expect(response.body.success).toBe(true);
        expect(response.body.message).toContain('running');
    });
});
