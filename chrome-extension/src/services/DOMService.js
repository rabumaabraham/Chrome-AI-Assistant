/**
 * DOM Service
 * Handles DOM content extraction and analysis
 */

import Logger from '../core/Logger.js';

class DOMService {
    constructor() {
        this.logger = Logger.createServiceLogger('DOM');
    }

    /**
     * Extract comprehensive page content
     */
    async extractPageContent(question = '') {
        try {
            this.logger.info('Starting DOM content extraction', { questionLength: question.length });

            const content = {
                // Basic page information
                url: window.location.href,
                title: document.title || '',
                metaDescription: document.querySelector('meta[name="description"]')?.content || '',
                
                // Content extraction
                headings: this.extractHeadings(),
                textContent: this.extractMainText(),
                visibleText: this.extractVisibleText(),
                
                // Structured data
                tables: this.extractTables(),
                lists: this.extractLists(),
                forms: this.extractForms(),
                
                // Media content
                images: this.extractImages(),
                pdfs: this.extractPDFs(),
                embeddedDocs: this.extractEmbeddedDocs(),
                
                // Navigation and structure
                links: this.extractLinks(),
                pageStructure: this.analyzePageStructure(),
                
                // PDF viewer detection
                isPdfViewer: this.isPDFViewer(),
                
                // Question-aware targeted content
                targetedContent: this.extractTargetedContent(question)
            };

            this.logger.info('DOM content extraction completed', {
                url: content.url,
                title: content.title,
                headingsCount: content.headings.length,
                imagesCount: content.images.length,
                tablesCount: content.tables.length,
                isPdfViewer: content.isPdfViewer
            });

            return content;

        } catch (error) {
            this.logger.error('DOM content extraction failed', error);
            throw error;
        }
    }

    /**
     * Extract headings with hierarchy
     */
    extractHeadings() {
        return Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'))
            .map(h => ({
                level: parseInt(h.tagName.charAt(1)),
                text: h.textContent.trim(),
                id: h.id || null
            }))
            .filter(h => h.text.length > 0);
    }

    /**
     * Extract main text content
     */
    extractMainText() {
        const mainContent = document.querySelector('main, article, .content, .main, #content, #main') || document.body;
        return mainContent.innerText || mainContent.textContent || '';
    }

    /**
     * Extract only visible text
     */
    extractVisibleText() {
        return Array.from(document.querySelectorAll('*'))
            .filter(el => {
                const style = window.getComputedStyle(el);
                return style.display !== 'none' && 
                       style.visibility !== 'hidden' && 
                       style.opacity !== '0' &&
                       el.offsetWidth > 0 && 
                       el.offsetHeight > 0;
            })
            .map(el => el.textContent || '')
            .join(' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    /**
     * Extract tables with data
     */
    extractTables() {
        return Array.from(document.querySelectorAll('table'))
            .map(table => {
                const rows = Array.from(table.querySelectorAll('tr'))
                    .map(row => Array.from(row.querySelectorAll('td, th'))
                        .map(cell => cell.textContent.trim())
                        .filter(cell => cell.length > 0)
                    )
                    .filter(row => row.length > 0);
                return { rows, caption: table.caption?.textContent || '' };
            })
            .filter(table => table.rows.length > 0);
    }

    /**
     * Extract lists
     */
    extractLists() {
        return Array.from(document.querySelectorAll('ul, ol'))
            .map(list => Array.from(list.querySelectorAll('li'))
                .map(li => li.textContent.trim())
                .filter(li => li.length > 0)
            )
            .filter(list => list.length > 0);
    }

    /**
     * Extract forms and inputs
     */
    extractForms() {
        return Array.from(document.querySelectorAll('form'))
            .map(form => {
                const inputs = Array.from(form.querySelectorAll('input, select, textarea'))
                    .map(input => ({
                        type: input.type || input.tagName.toLowerCase(),
                        name: input.name || input.id || '',
                        value: input.value || input.textContent || '',
                        placeholder: input.placeholder || ''
                    }))
                    .filter(input => input.name || input.value);
                return { inputs, action: form.action || '' };
            })
            .filter(form => form.inputs.length > 0);
    }

    /**
     * Extract images with metadata
     */
    extractImages() {
        return Array.from(document.querySelectorAll('img'))
            .map(img => ({
                src: img.src,
                alt: img.alt,
                title: img.title,
                width: img.width,
                height: img.height,
                nearbyText: img.parentElement?.textContent?.substring(0, 200) || '',
                isVisible: img.offsetWidth > 0 && img.offsetHeight > 0
            }))
            .filter(img => img.src);
    }

    /**
     * Extract PDF links and embeds
     */
    extractPDFs() {
        return Array.from(document.querySelectorAll('a[href*=".pdf"], embed[src*=".pdf"], object[data*=".pdf"], iframe[src*=".pdf"]'))
            .map(pdf => ({
                src: pdf.href || pdf.src || pdf.data,
                text: pdf.textContent?.trim() || pdf.alt || pdf.title || 'PDF Document',
                type: 'pdf'
            }));
    }

    /**
     * Extract embedded documents
     */
    extractEmbeddedDocs() {
        return Array.from(document.querySelectorAll('embed, object, iframe'))
            .map(doc => ({
                src: doc.src || doc.data,
                type: doc.type || 'unknown',
                title: doc.title || doc.alt || 'Embedded Document'
            }))
            .filter(doc => doc.src);
    }

    /**
     * Extract links with categorization
     */
    extractLinks() {
        return Array.from(document.querySelectorAll('a[href]'))
            .map(link => ({
                href: link.href,
                text: link.textContent.trim(),
                title: link.title || '',
                isExternal: !link.href.startsWith(window.location.origin),
                isEmail: link.href.startsWith('mailto:'),
                isPhone: link.href.startsWith('tel:')
            }))
            .filter(link => link.text.length > 0);
    }

    /**
     * Analyze page structure
     */
    analyzePageStructure() {
        return {
            hasHeader: !!document.querySelector('header, .header, #header'),
            hasNav: !!document.querySelector('nav, .nav, #nav'),
            hasMain: !!document.querySelector('main, .main, #main'),
            hasSidebar: !!document.querySelector('aside, .sidebar, #sidebar'),
            hasFooter: !!document.querySelector('footer, .footer, #footer')
        };
    }

    /**
     * Check if current page is a PDF viewer
     */
    isPDFViewer() {
        // Check URL for PDF extension
        if (window.location.href.toLowerCase().includes('.pdf')) {
            return true;
        }

        // Check for PDF embeds/objects
        if (document.querySelector('embed[type="application/pdf"]') ||
            document.querySelector('object[type="application/pdf"]')) {
            return true;
        }

        // Check for PDF viewer indicators in page content
        const bodyText = document.body.innerText || document.body.textContent || '';
        if (bodyText.includes('PDF') && 
            (bodyText.includes('Download') || bodyText.includes('View') || bodyText.includes('Page'))) {
            return true;
        }

        // Check for common PDF viewer elements
        if (document.querySelector('#viewer, .pdf-viewer, [data-pdf-viewer]')) {
            return true;
        }

        return false;
    }

    /**
     * Extract content targeted by question keywords
     */
    extractTargetedContent(question) {
        if (!question) return '';

        const questionLower = question.toLowerCase();
        let targetedContent = '';

        // Table targeting
        if (questionLower.includes('table') || questionLower.includes('data') || questionLower.includes('row') || questionLower.includes('column')) {
            const tables = this.extractTables();
            if (tables.length > 0) {
                targetedContent += `\n📊 TABLES FOUND:\n`;
                tables.forEach((table, i) => {
                    targetedContent += `Table ${i + 1}: ${table.rows.length} rows\n`;
                    if (table.caption) targetedContent += `Caption: ${table.caption}\n`;
                    if (table.rows.length > 0) {
                        targetedContent += `Sample data: ${table.rows[0].join(' | ')}\n`;
                    }
                });
            }
        }

        // Form targeting
        if (questionLower.includes('form') || questionLower.includes('input') || questionLower.includes('field') || questionLower.includes('submit')) {
            const forms = this.extractForms();
            if (forms.length > 0) {
                targetedContent += `\n📝 FORMS FOUND:\n`;
                forms.forEach((form, i) => {
                    targetedContent += `Form ${i + 1}: ${form.inputs.length} inputs\n`;
                    form.inputs.forEach(input => {
                        targetedContent += `- ${input.type}: ${input.name} (${input.placeholder || input.value || 'empty'})\n`;
                    });
                });
            }
        }

        // Image targeting
        if (questionLower.includes('image') || questionLower.includes('picture') || questionLower.includes('photo')) {
            const images = this.extractImages().filter(img => img.isVisible);
            if (images.length > 0) {
                targetedContent += `\n🖼️ IMAGES FOUND:\n`;
                images.slice(0, 5).forEach((image, i) => {
                    targetedContent += `Image ${i + 1}: ${image.dimensions || `${image.width}x${image.height}`}\n`;
                    if (image.alt) targetedContent += `Alt: ${image.alt}\n`;
                    if (image.title) targetedContent += `Title: ${image.title}\n`;
                });
            }
        }

        // PDF targeting
        if (questionLower.includes('pdf') || questionLower.includes('document') || questionLower.includes('cv') || questionLower.includes('resume')) {
            const pdfs = this.extractPDFs();
            if (pdfs.length > 0) {
                targetedContent += `\n📄 PDF DOCUMENTS FOUND:\n`;
                pdfs.forEach((pdf, i) => {
                    targetedContent += `PDF ${i + 1}: ${pdf.text}\n`;
                    targetedContent += `URL: ${pdf.src}\n`;
                });
            }

            // If we're viewing a PDF directly, try to extract content
            if (this.isPDFViewer() && window.location.href.includes('.pdf')) {
                targetedContent += `\n📄 PDF DETECTED: Currently viewing PDF at ${window.location.href}\n`;
            }
        }

        // Link targeting
        if (questionLower.includes('link') || questionLower.includes('url') || questionLower.includes('website')) {
            const links = this.extractLinks();
            if (links.length > 0) {
                targetedContent += `\n🔗 LINKS FOUND:\n`;
                const externalLinks = links.filter(link => link.isExternal).slice(0, 5);
                const internalLinks = links.filter(link => !link.isExternal).slice(0, 5);
                
                if (externalLinks.length > 0) {
                    targetedContent += `External links: ${externalLinks.map(link => `${link.text} (${link.href})`).join(', ')}\n`;
                }
                if (internalLinks.length > 0) {
                    targetedContent += `Internal links: ${internalLinks.map(link => link.text).join(', ')}\n`;
                }
            }
        }

        return targetedContent;
    }
}

// Export singleton instance
export default new DOMService();
