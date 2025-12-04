/**
 * AI Service
 * Handles all AI-related operations using OpenRouter API
 */

const OpenAI = require('openai');
const config = require('../../config/index.js');
const logger = require('./Logger');

class AIService {
    constructor() {
        this.client = this.initializeClient();
        this.serviceLogger = logger.getServiceLogger('AI');
    }

    initializeClient() {
        if (!config.ai.apiKey) {
            throw new Error('OpenRouter API key is required');
        }

        return new OpenAI({
            apiKey: config.ai.apiKey,
            baseURL: config.ai.baseUrl,
            defaultHeaders: {
                'HTTP-Referer': 'https://github.com/rabumaabraham/Chrome-AI-Assistant',
                'X-Title': 'SnapQuery'
            }
        });
    }

    /**
     * Generate AI response based on context and question
     */
    async generateResponse(question, context) {
        try {
            this.serviceLogger.info('Generating AI response', {
                questionLength: question.length,
                contextLength: context.length,
                model: config.ai.model
            });

            const systemPrompt = this.buildSystemPrompt(context);
            const userPrompt = `Question: ${question}`;

            const response = await this.client.chat.completions.create({
                model: config.ai.model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                max_tokens: config.ai.maxTokens,
                temperature: config.ai.temperature
            });

            const answer = response.choices[0]?.message?.content || 'No response generated';
            const usage = response.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };

            this.serviceLogger.info('AI response generated', {
                responseLength: answer.length,
                tokensUsed: usage.total_tokens,
                model: config.ai.model
            });

            return {
                success: true,
                answer,
                usage
            };

        } catch (error) {
            this.serviceLogger.error('AI response generation failed', {
                error: error.message,
                questionLength: question.length,
                contextLength: context.length
            });

            return {
                success: false,
                error: 'Failed to generate AI response',
                details: error.message
            };
        }
    }

    /**
     * Build comprehensive system prompt
     */
    buildSystemPrompt(context) {
        return `You are an expert AI assistant that analyzes webpage content with high accuracy. 
        You have access to comprehensive data from the webpage the user is currently viewing:
        
        ${context}
        
        You can see:
        - The exact text content the user sees on screen
        - Page structure with hierarchical headings
        - Tables, lists, forms, and images
        - PDF documents and embedded files on the page
        - Current PDF content if viewing a PDF document
        - Image OCR content (text extracted from images using optical character recognition)
        - Currently visible viewport content
        - Page layout and navigation elements
        
        Please provide a helpful, accurate, and detailed answer to the user's question based on the provided context. 
        
        Guidelines for maximum accuracy:
        - Quote exact text from the page when relevant
        - Reference specific headings, tables, or sections by name
        - If asked about data in tables, provide the actual values
        - If asked about forms, describe the specific input fields and their purposes
        - If asked about images, reference their alt text and context
        - If asked about PDFs or documents, describe what documents are available on the page
        - If viewing a PDF, you can read and analyze the actual PDF content
        - IMPORTANT: If the page contains PDF content (marked as "CURRENT PDF CONTENT (HIGHEST PRIORITY)"), this is the most important content - prioritize it above everything else
        - When analyzing PDF content, provide specific details from the document text
        - If viewing a PDF document, treat it as the primary content and answer questions based on the PDF text
        - IMPORTANT: If the page contains image OCR content (marked as "IMAGE OCR CONTENT"), you can read and analyze text extracted from images
        - When analyzing image content, provide specific details from the extracted text and describe what you see in the images
        - If asked about text in images, use the OCR extracted text to provide accurate answers
        - If asked about navigation, describe the actual menu structure
        - If the question is about page structure, use the hierarchical headings
        - Prioritize currently visible content when relevant
        - If you're unsure about something, say so rather than guessing
        - Be specific about what you can and cannot see on the page`;
    }

    /**
     * Test AI service health
     */
    async testHealth() {
        try {
            const response = await this.client.chat.completions.create({
                model: config.ai.model,
                messages: [{ role: 'user', content: 'Test connection' }],
                max_tokens: 10
            });

            return {
                success: true,
                model: config.ai.model,
                provider: config.ai.provider
            };
        } catch (error) {
            this.serviceLogger.error('AI health check failed', { error: error.message });
            return {
                success: false,
                error: error.message
            };
        }
    }
}

module.exports = new AIService();
