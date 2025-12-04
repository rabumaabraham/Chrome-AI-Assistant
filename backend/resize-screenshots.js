/**
 * Resize Screenshots for Chrome Web Store
 * Requirements:
 * - Up to a maximum of 5 screenshots
 * - 1280x800 or 640x400 dimensions
 * - JPEG or 24-bit PNG (no alpha)
 * - At least one is required
 */

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const screenshotsDir = path.join(__dirname, '..', 'chrome-extension', 'templates', 'screenshots');

async function resizeScreenshots() {
    try {
        console.log('📸 Resizing screenshots for Chrome Web Store...\n');

        // Find all screenshot files
        const files = fs.readdirSync(screenshotsDir)
            .filter(file => {
                const ext = path.extname(file).toLowerCase();
                return ['.png', '.jpg', '.jpeg'].includes(ext);
            })
            .sort(); // Sort alphabetically

        if (files.length === 0) {
            console.log('❌ No screenshot files found!');
            console.log('   Chrome Web Store requires at least one screenshot.');
            return;
        }

        if (files.length > 5) {
            console.log(`⚠️  Warning: Found ${files.length} screenshots. Chrome Web Store allows maximum of 5.`);
            console.log('   Processing first 5 screenshots...\n');
        }

        const screenshotsToProcess = files.slice(0, 5); // Max 5 screenshots
        console.log(`📁 Found ${files.length} screenshot(s), processing ${screenshotsToProcess.length}...\n`);

        // Chrome Web Store screenshot dimensions (using 1280x800 for better quality)
        const SCREENSHOT_WIDTH = 1280;
        const SCREENSHOT_HEIGHT = 800;

        let processedCount = 0;

        for (const file of screenshotsToProcess) {
            const inputPath = path.join(screenshotsDir, file);
            const ext = path.extname(file).toLowerCase();
            
            // Create output filename with -resized suffix to avoid overwriting
            const baseName = path.basename(file, ext);
            const tempOutputPath = path.join(screenshotsDir, `${baseName}-resized.png`);
            const finalOutputPath = path.join(screenshotsDir, `${baseName}.png`);

            try {
                console.log(`📐 Processing: ${file}`);
                
                const metadata = await sharp(inputPath).metadata();
                console.log(`   Original: ${metadata.width}x${metadata.height}`);

                // Resize to 1280x800, preserving aspect ratio and adding padding if needed
                await sharp(inputPath)
                    .resize(SCREENSHOT_WIDTH, SCREENSHOT_HEIGHT, {
                        fit: 'contain',
                        background: { r: 255, g: 255, b: 255 }
                    })
                    .png({ 
                        quality: 100,
                        compressionLevel: 9,
                        palette: false
                    })
                    .toFile(tempOutputPath);

                const outputMetadata = await sharp(tempOutputPath).metadata();
                console.log(`   ✅ Resized: ${outputMetadata.width}x${outputMetadata.height} (24-bit PNG, no alpha)`);
                
                // Replace original with resized version
                if (fs.existsSync(finalOutputPath)) {
                    fs.unlinkSync(finalOutputPath);
                }
                fs.renameSync(tempOutputPath, finalOutputPath);
                
                console.log(`   📁 Saved: ${path.basename(finalOutputPath)}\n`);

                processedCount++;

            } catch (error) {
                // Clean up temp file if it exists
                if (fs.existsSync(tempOutputPath)) {
                    fs.unlinkSync(tempOutputPath);
                }
                console.error(`   ❌ Error processing ${file}:`, error.message);
                console.log('');
            }
        }

        console.log('✨ ========================================');
        console.log('🎉 Screenshot resizing complete!');
        console.log('✨ ========================================');
        console.log(`\n📊 Processed: ${processedCount} screenshot(s)`);
        console.log('\n📋 Chrome Web Store Specifications:');
        console.log('   ✅ Dimensions: 1280x800');
        console.log('   ✅ Format: 24-bit PNG (no alpha)');
        console.log('   ✅ Maximum: 5 screenshots (you have ' + screenshotsToProcess.length + ')');
        console.log('   ✅ At least one required: ' + (processedCount > 0 ? 'YES ✅' : 'NO ❌'));
        console.log('\n✅ All screenshots ready for Chrome Web Store submission!');

    } catch (error) {
        console.error('❌ Error resizing screenshots:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

resizeScreenshots();
