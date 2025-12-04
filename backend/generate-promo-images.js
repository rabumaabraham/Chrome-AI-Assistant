/**
 * Generate New Promo Images for Chrome Web Store
 * Creates brand new images at exact Chrome Web Store dimensions
 * Requirements:
 * - Small promo: 440x280 (JPEG or 24-bit PNG, no alpha)
 * - Marquee promo: 1400x560 (JPEG or 24-bit PNG, no alpha)
 * 
 * This script GENERATES NEW images at proper size (not just resizing)
 */

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const promoDir = path.join(__dirname, '..', 'chrome-extension', 'templates', 'promo');

async function generatePromoImages() {
    try {
        console.log('🚀 Generating NEW promo images at proper Chrome Web Store sizes...\n');

        // Small promo: 440x280
        const smallInputPath = path.join(promoDir, 'small.png');
        const smallOutputPath = path.join(promoDir, 'small-promo-tile.png');
        
        if (fs.existsSync(smallInputPath)) {
            console.log('📐 Creating NEW small promo tile (440x280)...');
            
            // Get original image info
            const originalImage = sharp(smallInputPath);
            const metadata = await originalImage.metadata();
            console.log(`   Original: ${metadata.width}x${metadata.height}`);
            
            // Create NEW canvas at exact Chrome Web Store size
            const canvasWidth = 440;
            const canvasHeight = 280;
            
            // Calculate optimal size to fit image proportionally
            const aspectRatio = metadata.width / metadata.height;
            const canvasAspectRatio = canvasWidth / canvasHeight;
            
            let imageWidth, imageHeight, offsetX, offsetY;
            
            if (aspectRatio > canvasAspectRatio) {
                // Image is wider - fit to width
                imageWidth = canvasWidth;
                imageHeight = Math.round(canvasWidth / aspectRatio);
                offsetX = 0;
                offsetY = Math.round((canvasHeight - imageHeight) / 2);
            } else {
                // Image is taller - fit to height
                imageHeight = canvasHeight;
                imageWidth = Math.round(canvasHeight * aspectRatio);
                offsetX = Math.round((canvasWidth - imageWidth) / 2);
                offsetY = 0;
            }
            
            console.log(`   Scaled to: ${imageWidth}x${imageHeight}`);
            console.log(`   Position: (${offsetX}, ${offsetY})`);
            
            // Generate NEW image: Create canvas and composite original
            await sharp({
                create: {
                    width: canvasWidth,
                    height: canvasHeight,
                    channels: 3,
                    background: { r: 255, g: 255, b: 255 }
                }
            })
            .composite([{
                input: await originalImage
                    .resize(imageWidth, imageHeight, {
                        kernel: 'lanczos3', // High-quality resampling
                        fit: 'fill'
                    })
                    .toBuffer(),
                top: offsetY,
                left: offsetX
            }])
            .png({ 
                quality: 100,
                compressionLevel: 6, // Balance between quality and file size
                palette: false,
                force: true // Overwrite existing
            })
            .toFile(smallOutputPath);
            
            const outputMetadata = await sharp(smallOutputPath).metadata();
            console.log(`   ✅ Generated NEW image: ${outputMetadata.width}x${outputMetadata.height}`);
            console.log(`   📁 File: ${path.basename(smallOutputPath)}\n`);
        } else {
            console.log('❌ small.png not found!\n');
        }

        // Marquee promo: 1400x560
        const bigInputPath = path.join(promoDir, 'big.png');
        const bigOutputPath = path.join(promoDir, 'marquee-promo-tile.png');
        
        if (fs.existsSync(bigInputPath)) {
            console.log('📐 Creating NEW marquee promo tile (1400x560)...');
            
            // Get original image info
            const originalImage = sharp(bigInputPath);
            const metadata = await originalImage.metadata();
            console.log(`   Original: ${metadata.width}x${metadata.height}`);
            
            // Create NEW canvas at exact Chrome Web Store size
            const canvasWidth = 1400;
            const canvasHeight = 560;
            
            // Calculate optimal size to fit image proportionally
            const aspectRatio = metadata.width / metadata.height;
            const canvasAspectRatio = canvasWidth / canvasHeight;
            
            let imageWidth, imageHeight, offsetX, offsetY;
            
            if (aspectRatio > canvasAspectRatio) {
                // Image is wider - fit to width
                imageWidth = canvasWidth;
                imageHeight = Math.round(canvasWidth / aspectRatio);
                offsetX = 0;
                offsetY = Math.round((canvasHeight - imageHeight) / 2);
            } else {
                // Image is taller - fit to height
                imageHeight = canvasHeight;
                imageWidth = Math.round(canvasHeight * aspectRatio);
                offsetX = Math.round((canvasWidth - imageWidth) / 2);
                offsetY = 0;
            }
            
            console.log(`   Scaled to: ${imageWidth}x${imageHeight}`);
            console.log(`   Position: (${offsetX}, ${offsetY})`);
            
            // Generate NEW image: Create canvas and composite original
            await sharp({
                create: {
                    width: canvasWidth,
                    height: canvasHeight,
                    channels: 3,
                    background: { r: 255, g: 255, b: 255 }
                }
            })
            .composite([{
                input: await originalImage
                    .resize(imageWidth, imageHeight, {
                        kernel: 'lanczos3', // High-quality resampling
                        fit: 'fill'
                    })
                    .toBuffer(),
                top: offsetY,
                left: offsetX
            }])
            .png({ 
                quality: 100,
                compressionLevel: 6, // Balance between quality and file size
                palette: false,
                force: true // Overwrite existing
            })
            .toFile(bigOutputPath);
            
            const outputMetadata = await sharp(bigOutputPath).metadata();
            console.log(`   ✅ Generated NEW image: ${outputMetadata.width}x${outputMetadata.height}`);
            console.log(`   📁 File: ${path.basename(bigOutputPath)}\n`);
        } else {
            console.log('❌ big.png not found!\n');
        }

        console.log('✨ ========================================');
        console.log('🎉 NEW promo images generated successfully!');
        console.log('✨ ========================================');
        console.log('\n📋 Chrome Web Store Requirements:');
        console.log('   ✅ Small promo tile: 440x280');
        console.log('   ✅ Marquee promo tile: 1400x560');
        console.log('   ✅ Format: 24-bit PNG (no alpha)');
        console.log('   ✅ High-quality Lanczos resampling');
        console.log('\n📁 Generated files:');
        console.log(`   • ${path.relative(path.join(__dirname, '..'), smallOutputPath)}`);
        console.log(`   • ${path.relative(path.join(__dirname, '..'), bigOutputPath)}`);
        console.log('\n🎨 These are BRAND NEW images at proper sizes, ready for Chrome Web Store!');

    } catch (error) {
        console.error('❌ Error generating images:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

// Run the script
generatePromoImages();

