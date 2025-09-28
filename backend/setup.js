/**
 * Setup Script
 * Helps users configure the Chrome AI Assistant backend
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log('🚀 Chrome AI Assistant Backend Setup\n');

async function setup() {
    try {
        // Check if .env exists
        const envPath = path.join(__dirname, '.env');
        const envExamplePath = path.join(__dirname, 'env.example');
        
        if (fs.existsSync(envPath)) {
            console.log('✅ .env file already exists');
            const overwrite = await askQuestion('Do you want to overwrite it? (y/n): ');
            if (overwrite.toLowerCase() !== 'y') {
                console.log('Setup cancelled.');
                rl.close();
                return;
            }
        }

        console.log('\n📋 Let\'s configure your environment variables:\n');

        // Get OpenRouter API key
        const openrouterKey = await askQuestion('Enter your OpenRouter API key: ');
        if (!openrouterKey.trim()) {
            console.log('❌ OpenRouter API key is required!');
            rl.close();
            return;
        }

        // Get model preference
        const model = await askQuestion('Enter AI model (default: openai/gpt-3.5-turbo): ') || 'openai/gpt-3.5-turbo';

        // Get port
        const port = await askQuestion('Enter server port (default: 3000): ') || '3000';

        // Get environment
        const environment = await askQuestion('Enter environment (development/production, default: development): ') || 'development';

        // Create .env file
        const envContent = `# OpenRouter Configuration
OPENROUTER_API_KEY=${openrouterKey}
OPENROUTER_MODEL=${model}
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1

# Server Configuration
PORT=${port}
NODE_ENV=${environment}

# Security (Optional)
API_KEY_REQUIRED=false
RATE_LIMIT_MAX=100

# OCR Configuration
OCR_LANGUAGE=eng
MAX_IMAGE_SIZE=5242880
MAX_IMAGES_PER_REQUEST=3

# PDF Configuration
MAX_PDF_SIZE=10485760
MAX_PDF_PAGES=50

# Logging
LOG_LEVEL=info
`;

        fs.writeFileSync(envPath, envContent);
        console.log('\n✅ .env file created successfully!');

        // Create logs directory if it doesn't exist
        const logsDir = path.join(__dirname, 'logs');
        if (!fs.existsSync(logsDir)) {
            fs.mkdirSync(logsDir);
            console.log('✅ Logs directory created');
        }

        console.log('\n🎉 Setup completed successfully!');
        console.log('\n📋 Next steps:');
        console.log('1. Run: npm start');
        console.log('2. Test: http://localhost:' + port + '/health');
        console.log('3. Load the Chrome extension');
        console.log('4. Configure the extension with your backend URL');

    } catch (error) {
        console.error('❌ Setup failed:', error.message);
    } finally {
        rl.close();
    }
}

function askQuestion(question) {
    return new Promise((resolve) => {
        rl.question(question, resolve);
    });
}

// Run setup
setup();
