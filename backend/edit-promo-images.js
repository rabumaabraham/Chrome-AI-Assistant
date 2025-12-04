/**
 * Edit Promo Images for Chrome Web Store
 * Takes images from promo folder and creates promo tiles at exact dimensions
 * Requirements:
 * - Small promo: 440x280 Canvas (JPEG or 24-bit PNG, no alpha)
 * - Marquee promo: 1400x560 Canvas (JPEG or 24-bit PNG, no alpha)
 */

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const promoDir = path.join(__dirname, '..', 'chrome-extension', 'templates', 'promo');

async function editPromoImages() {
    try {
        console.log('🎨 Editing promo images to Chrome Web Store specifications...\n');

        // Find images in promo folder
        const files = fs.readdirSync(promoDir).filter(file => {
            const ext = path.extname(file).toLowerCase();
            return ['.png', '.jpg', '.jpeg'].includes(ext);
        });

        if (files.length === 0) {
            console.log('❌ No image files found in promo folder!');
            console.log('   Please add your promo images to:', promoDir);
            return;
        }

        console.log(`📁 Found ${files.length} image file(s) in promo folder\n`);

        // Use first image found for both sizes, or look for specific names
        let sourceImage = null;
        
        // Look for 'small' or 'big' in filename, or use first image
        for (const file of files) {
            const lowerName = file.toLowerCase();
            if (lowerName.includes('small') || (!sourceImage && files.length === 1)) {
                sourceImage = file;
                break;
            }
        }
        
        if (!sourceImage) {
            sourceImage = files[0];
        }

        const sourcePath = path.join(promoDir, sourceImage);
        console.log(`📷 Using source image: ${sourceImage}\n`);

        // Small promo tile: 440x280
        const smallOutputPath = path.join(promoDir, 'small-promo-tile.png');
        
        console.log('📐 Creating Small Promo Tile (440x280 Canvas)...');
        const smallMetadata = await sharp(sourcePath).metadata();
        console.log(`   Source: ${smallMetadata.width}x${smallMetadata.height}`);
        
        await sharp(sourcePath)
            .resize(440, 280, {
                fit: 'contain',
                background: { r: 255, g: 255, b: 255 }
            })
            .png({ 
                quality: 100,
                compressionLevel: 9,
                palette: false,
                force: true
            })
            .toFile(smallOutputPath);
        
        const smallOutputMeta = await sharp(smallOutputPath).metadata();
        console.log(`   ✅ Created: ${smallOutputMeta.width}x${smallOutputMeta.height}`);
        console.log(`   📁 File: small-promo-tile.png\n`);

        // Marquee promo tile: 1400x560
        const bigOutputPath = path.join(promoDir, 'marquee-promo-tile.png');
        
        // Use different source if 'big' image exists
        let bigSourcePath = sourcePath;
        for (const file of files) {
            if (file.toLowerCase().includes('big')) {
                bigSourcePath = path.join(promoDir, file);
                console.log(`📷 Using source for marquee: ${file}\n`);
                break;
            }
        }
        
        console.log('📐 Creating Marquee Promo Tile (1400x560 Canvas)...');
        const bigMetadata = await sharp(bigSourcePath).metadata();
        console.log(`   Source: ${bigMetadata.width}x${bigMetadata.height}`);
        
        await sharp(bigSourcePath)
            .resize(1400, 560, {
                fit: 'contain',
                background: { r: 255, g: 255, b: 255 }
            })
            .png({ 
                quality: 100,
                compressionLevel: 9,
                palette: false,
                force: true
            })
            .toFile(bigOutputPath);
        
        const bigOutputMeta = await sharp(bigOutputPath).metadata();
        console.log(`   ✅ Created: ${bigOutputMeta.width}x${bigOutputMeta.height}`);
        console.log(`   📁 File: marquee-promo-tile.png\n`);

        console.log('✨ ========================================');
        console.log('🎉 Promo images created successfully!');
        console.log('✨ ========================================');
        console.log('\n📋 Chrome Web Store Specifications:');
        console.log('   ✅ Small promo tile: 440x280 Canvas');
        console.log('   ✅ Marquee promo tile: 1400x560 Canvas');
        console.log('   ✅ Format: 24-bit PNG (no alpha)');
        console.log('\n📁 Output files:');
        console.log(`   • ${path.relative(path.join(__dirname, '..'), smallOutputPath)}`);
        console.log(`   • ${path.relative(path.join(__dirname, '..'), bigOutputPath)}`);
        console.log('\n✅ Ready for Chrome Web Store submission!');

    } catch (error) {
        console.error('❌ Error editing images:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

editPromoImages();
