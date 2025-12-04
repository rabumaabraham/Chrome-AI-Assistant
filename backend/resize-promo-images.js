/**
 * Resize Promo Images for Chrome Web Store
 * Requirements:
 * - Small promo: 440x280 (JPEG or 24-bit PNG, no alpha)
 * - Marquee promo: 1400x560 (JPEG or 24-bit PNG, no alpha)
 * 
 * This script resizes images to fit within dimensions WITHOUT cropping.
 * The full image will be visible, centered on a canvas with padding if needed.
 */

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const promoDir = path.join(__dirname, '..', 'chrome-extension', 'templates', 'promo');

async function resizePromoImages() {
    try {
        console.log('Starting promo image resize (no cropping - full image preserved)...\n');

        // Small promo: 440x280
        const smallInputPath = path.join(promoDir, 'small.png');
        const smallOutputPath = path.join(promoDir, 'small-promo-tile.png');
        
        if (fs.existsSync(smallInputPath)) {
            console.log('Resizing small.png to 440x280 (full image, no crop)...');
            const metadata = await sharp(smallInputPath).metadata();
            console.log(`  Original size: ${metadata.width}x${metadata.height}`);
            
            // Calculate scale to fit within 440x280
            const scaleX = 440 / metadata.width;
            const scaleY = 280 / metadata.height;
            const scale = Math.min(scaleX, scaleY); // Use smaller scale to fit both dimensions
            
            const newWidth = Math.round(metadata.width * scale);
            const newHeight = Math.round(metadata.height * scale);
            
            console.log(`  Scaled size: ${newWidth}x${newHeight}`);
            
            // Resize image proportionally, then composite onto canvas
            const resizedImage = await sharp(smallInputPath)
                .resize(newWidth, newHeight, {
                    fit: 'inside',
                    withoutEnlargement: false
                })
                .toBuffer();
            
            // Create canvas with exact dimensions and composite image in center
            await sharp({
                create: {
                    width: 440,
                    height: 280,
                    channels: 3,
                    background: { r: 255, g: 255, b: 255 }
                }
            })
            .composite([{
                input: resizedImage,
                top: Math.round((280 - newHeight) / 2),
                left: Math.round((440 - newWidth) / 2)
            }])
            .png({ 
                quality: 100,
                compressionLevel: 9,
                palette: false
            })
            .toFile(smallOutputPath);
            
            console.log(`✅ Created: ${path.basename(smallOutputPath)} (440x280 - full image preserved)\n`);
        } else {
            console.log('❌ small.png not found!\n');
        }

        // Marquee promo: 1400x560
        const bigInputPath = path.join(promoDir, 'big.png');
        const bigOutputPath = path.join(promoDir, 'marquee-promo-tile.png');
        
        if (fs.existsSync(bigInputPath)) {
            console.log('Resizing big.png to 1400x560 (full image, no crop)...');
            const metadata = await sharp(bigInputPath).metadata();
            console.log(`  Original size: ${metadata.width}x${metadata.height}`);
            
            // Calculate scale to fit within 1400x560
            const scaleX = 1400 / metadata.width;
            const scaleY = 560 / metadata.height;
            const scale = Math.min(scaleX, scaleY); // Use smaller scale to fit both dimensions
            
            const newWidth = Math.round(metadata.width * scale);
            const newHeight = Math.round(metadata.height * scale);
            
            console.log(`  Scaled size: ${newWidth}x${newHeight}`);
            
            // Resize image proportionally, then composite onto canvas
            const resizedImage = await sharp(bigInputPath)
                .resize(newWidth, newHeight, {
                    fit: 'inside',
                    withoutEnlargement: false
                })
                .toBuffer();
            
            // Create canvas with exact dimensions and composite image in center
            await sharp({
                create: {
                    width: 1400,
                    height: 560,
                    channels: 3,
                    background: { r: 255, g: 255, b: 255 }
                }
            })
            .composite([{
                input: resizedImage,
                top: Math.round((560 - newHeight) / 2),
                left: Math.round((1400 - newWidth) / 2)
            }])
            .png({ 
                quality: 100,
                compressionLevel: 9,
                palette: false
            })
            .toFile(bigOutputPath);
            
            console.log(`✅ Created: ${path.basename(bigOutputPath)} (1400x560 - full image preserved)\n`);
        } else {
            console.log('❌ big.png not found!\n');
        }

        console.log('🎉 Promo image resize complete!');
        console.log('\nChrome Web Store Requirements:');
        console.log('- Small promo tile: 440x280 ✅');
        console.log('- Marquee promo tile: 1400x560 ✅');
        console.log('\n✅ All images resized without cropping - full content preserved!');
        console.log('\nFiles created:');
        console.log(`- ${path.relative(path.join(__dirname, '..'), smallOutputPath)}`);
        console.log(`- ${path.relative(path.join(__dirname, '..'), bigOutputPath)}`);

    } catch (error) {
        console.error('❌ Error resizing images:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

// Run the script
resizePromoImages();
