/**
 * Content Processor Service
 * Intelligently processes and structures content before sending to AI
 */

const logger = require('./Logger');

class ContentProcessor {
    constructor() {
        this.serviceLogger = logger.getServiceLogger('ContentProcessor');
    }

    /**
     * Process and structure all content types
     */
    async processContent(rawContext, question) {
        try {
            const processed = {
                metadata: this.extractMetadata(rawContext),
                structured: await this.structureContent(rawContext),
                relevant: await this.extractRelevantContent(rawContext, question),
                summary: await this.generateContentSummary(rawContext),
                prioritized: this.prioritizeContent(rawContext, question)
            };

            this.serviceLogger.info('Content processed successfully', {
                originalSize: JSON.stringify(rawContext).length,
                processedSize: JSON.stringify(processed).length,
                hasRelevant: !!processed.relevant,
                hasSummary: !!processed.summary
            });

            return processed;

        } catch (error) {
            this.serviceLogger.error('Content processing failed', {
                error: error.message,
                question: question?.substring(0, 100)
            });

            // Fallback to original context
            return this.createFallbackContext(rawContext);
        }
    }

    /**
     * Extract metadata from content
     */
    extractMetadata(context) {
        return {
            url: context.url,
            title: context.title,
            type: this.detectContentType(context),
            timestamp: new Date().toISOString(),
            hasPdf: !!context.isPdfViewer,
            hasImages: !!(context.images && context.images.length > 0),
            hasOcr: !!(context.ocrText),
            textLength: (context.textContent || '').length,
            imageCount: context.images?.length || 0
        };
    }

    /**
     * Structure content into semantic sections
     */
    async structureContent(context) {
        const structured = {
            headings: this.extractHeadingsStructure(context.headings),
            sections: this.extractSections(context),
            lists: this.extractLists(context),
            tables: this.extractTables(context),
            forms: this.extractForms(context),
            media: this.extractMediaInfo(context)
        };

        return structured;
    }

    /**
     * Extract content most relevant to the question
     */
    async extractRelevantContent(context, question) {
        if (!question) return null;

        const questionKeywords = this.extractKeywords(question);
        const relevantSections = [];

        // Prioritize different content types based on question
        if (this.isQuestionAbout('data', 'table', 'numbers', question)) {
            relevantSections.push(this.extractTableData(context));
        }

        if (this.isQuestionAbout('image', 'picture', 'photo', question)) {
            relevantSections.push(this.extractImageContent(context));
        }

        if (this.isQuestionAbout('form', 'input', 'field', question)) {
            relevantSections.push(this.extractFormContent(context));
        }

        if (this.isQuestionAbout('pdf', 'document', question)) {
            relevantSections.push(this.extractPdfContent(context));
        }

        // Extract text sections with keyword matches
        relevantSections.push(this.extractMatchingText(context, questionKeywords));

        return relevantSections.filter(Boolean).join('\n\n');
    }

    /**
     * Generate intelligent content summary
     */
    async generateContentSummary(context) {
        const summary = {
            mainTopic: this.extractMainTopic(context),
            keyPoints: this.extractKeyPoints(context),
            contentType: this.analyzeContentType(context),
            importantSections: this.identifyImportantSections(context)
        };

        return summary;
    }

    /**
     * Prioritize content based on question relevance
     */
    prioritizeContent(context, question) {
        const priorities = [];

        // PDF content (highest priority)
        if (context.isPdfViewer && context.currentPdfContent) {
            priorities.push({
                type: 'PDF_CONTENT',
                content: context.currentPdfContent.substring(0, 4000),
                priority: 1,
                reason: 'Direct PDF document content'
            });
        }

        // OCR content (high priority for image questions)
        if (context.ocrText) {
            priorities.push({
                type: 'OCR_CONTENT',
                content: context.ocrText,
                priority: 2,
                reason: 'Text extracted from images'
            });
        }

        // Headings and structure (medium priority)
        if (context.headings && context.headings.length > 0) {
            priorities.push({
                type: 'STRUCTURE',
                content: this.formatHeadings(context.headings),
                priority: 3,
                reason: 'Page structure and navigation'
            });
        }

        // Visible text content (lower priority)
        if (context.visibleText) {
            priorities.push({
                type: 'VISIBLE_CONTENT',
                content: this.cleanText(context.visibleText).substring(0, 2000),
                priority: 4,
                reason: 'Main page content'
            });
        }

        return priorities;
    }

    /**
     * Detect content type
     */
    detectContentType(context) {
        if (context.isPdfViewer) return 'PDF';
        if (context.images && context.images.length > 5) return 'IMAGE_HEAVY';
        if (context.headings && context.headings.length > 10) return 'STRUCTURED';
        return 'WEBPAGE';
    }

    /**
     * Extract headings structure
     */
    extractHeadingsStructure(headings) {
        if (!headings || !Array.isArray(headings)) return [];

        return headings.map(heading => ({
            level: heading.level,
            text: heading.text,
            tag: heading.tag,
            hierarchy: this.buildHeadingHierarchy(heading)
        }));
    }

    /**
     * Extract sections from content
     */
    extractSections(context) {
        const sections = [];
        
        // Look for common section indicators
        const sectionSelectors = [
            'section', 'article', 'main', 'div[class*="section"]',
            'div[class*="content"]', 'div[class*="container"]'
        ];

        // This would be enhanced with actual DOM parsing in a real implementation
        return sections;
    }

    /**
     * Extract lists from content
     */
    extractLists(context) {
        // Extract structured list data
        return {
            ordered: [],
            unordered: [],
            definitions: []
        };
    }

    /**
     * Extract tables from content
     */
    extractTables(context) {
        // Extract table structure and data
        return {
            count: 0,
            headers: [],
            data: []
        };
    }

    /**
     * Extract forms from content
     */
    extractForms(context) {
        // Extract form fields and structure
        return {
            fields: [],
            actions: [],
            methods: []
        };
    }

    /**
     * Extract media information
     */
    extractMediaInfo(context) {
        return {
            images: context.images?.map(img => ({
                src: img.src,
                alt: img.alt,
                dimensions: `${img.displayWidth}x${img.displayHeight}`,
                hasOcr: !!img.ocrText
            })) || [],
            videos: [],
            audio: []
        };
    }

    /**
     * Extract keywords from question
     */
    extractKeywords(question) {
        const stopWords = ['what', 'how', 'where', 'when', 'why', 'who', 'is', 'are', 'the', 'a', 'an', 'and', 'or', 'but'];
        return question.toLowerCase()
            .replace(/[^\w\s]/g, '')
            .split(/\s+/)
            .filter(word => word.length > 2 && !stopWords.includes(word));
    }

    /**
     * Check if question is about specific topics
     */
    isQuestionAbout(...topics) {
        return (question) => {
            const questionLower = question.toLowerCase();
            return topics.some(topic => questionLower.includes(topic));
        };
    }

    /**
     * Extract table data
     */
    extractTableData(context) {
        // Extract and structure table data
        return 'Table data extraction not implemented';
    }

    /**
     * Extract image content
     */
    extractImageContent(context) {
        if (!context.images || context.images.length === 0) return null;

        let imageContent = 'Images found:\n';
        context.images.forEach((img, index) => {
            imageContent += `${index + 1}. ${img.alt || 'No alt text'}\n`;
            if (img.ocrText) {
                imageContent += `   OCR Text: ${img.ocrText}\n`;
            }
        });

        return imageContent;
    }

    /**
     * Extract form content
     */
    extractFormContent(context) {
        // Extract form information
        return 'Form content extraction not implemented';
    }

    /**
     * Extract PDF content
     */
    extractPdfContent(context) {
        if (!context.currentPdfContent) return null;
        return `PDF Content: ${context.currentPdfContent.substring(0, 3000)}...`;
    }

    /**
     * Extract matching text based on keywords
     */
    extractMatchingText(context, keywords) {
        if (!context.textContent || keywords.length === 0) return null;

        const text = context.textContent.toLowerCase();
        const matchingSections = [];

        keywords.forEach(keyword => {
            const index = text.indexOf(keyword);
            if (index !== -1) {
                const start = Math.max(0, index - 200);
                const end = Math.min(text.length, index + 200);
                matchingSections.push(context.textContent.substring(start, end));
            }
        });

        return matchingSections.join('\n\n');
    }

    /**
     * Extract main topic
     */
    extractMainTopic(context) {
        // Simple topic extraction based on headings
        if (context.headings && context.headings.length > 0) {
            return context.headings[0].text;
        }
        return context.title || 'Unknown topic';
    }

    /**
     * Extract key points
     */
    extractKeyPoints(context) {
        const keyPoints = [];

        // Extract from headings
        if (context.headings) {
            keyPoints.push(...context.headings.slice(0, 5).map(h => h.text));
        }

        // Extract from visible text (first few sentences)
        if (context.visibleText) {
            const sentences = context.visibleText.split(/[.!?]+/).slice(0, 3);
            keyPoints.push(...sentences.filter(s => s.trim().length > 10));
        }

        return keyPoints.slice(0, 5);
    }

    /**
     * Analyze content type
     */
    analyzeContentType(context) {
        const indicators = {
            isArticle: !!(context.headings && context.headings.length > 3),
            isDocument: !!context.isPdfViewer,
            isImageGallery: !!(context.images && context.images.length > 5),
            isForm: false, // Would check for form elements
            isEcommerce: false // Would check for product indicators
        };

        return indicators;
    }

    /**
     * Identify important sections
     */
    identifyImportantSections(context) {
        const important = [];

        if (context.headings) {
            // Prioritize h1 and h2 headings
            important.push(...context.headings
                .filter(h => h.level <= 2)
                .map(h => h.text)
            );
        }

        return important.slice(0, 5);
    }

    /**
     * Format headings for display
     */
    formatHeadings(headings) {
        if (!headings) return '';
        
        return headings.map(heading => {
            const indent = '  '.repeat(heading.level - 1);
            return `${indent}${heading.text}`;
        }).join('\n');
    }

    /**
     * Clean text content
     */
    cleanText(text) {
        if (!text) return '';
        
        return text
            .replace(/\s+/g, ' ')
            .replace(/\n\s*\n/g, '\n')
            .trim();
    }

    /**
     * Build heading hierarchy
     */
    buildHeadingHierarchy(heading) {
        // Build hierarchical path for heading
        return `H${heading.level}`;
    }

    /**
     * Create fallback context when processing fails
     */
    createFallbackContext(context) {
        return {
            metadata: this.extractMetadata(context),
            structured: {},
            relevant: context.textContent?.substring(0, 3000) || '',
            summary: { mainTopic: context.title || 'Unknown' },
            prioritized: [{
                type: 'FALLBACK',
                content: context.textContent?.substring(0, 3000) || '',
                priority: 1,
                reason: 'Fallback processing'
            }]
        };
    }
}

module.exports = ContentProcessor;
