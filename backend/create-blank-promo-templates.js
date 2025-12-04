/**
 * Create Blank Promo Image Templates
 * Creates empty canvas templates at Chrome Web Store dimensions
 * You can use these as starting points for your own designs
 */

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const promoDir = path.join(__dirname, '..', 'chrome-extension', 'templates', 'promo');

async function createBlankTemplates() {
    try {
        console.log('🎨 Creating blank promo image templates...\n');

        // Small promo template: 440x280
        const smallTemplatePath = path.join(promoDir, 'small-promo-template.png');
        console.log('📐 Creating small promo template (440x280)...');
        
        await sharp({
            create: {
                width: 440,
                height: 280,
                channels: 3,
                background: { r: 240, g: 240, b: 240 } // Light gray background
            }
        })
        .png({ 
            quality: 100,
            compressionLevel: 9,
            palette: false
        })
        .toFile(smallTemplatePath);
        
        console.log(`✅ Created: ${path.basename(smallTemplatePath)} (440x280)\n`);

        // Marquee promo template: 1400x560
        const bigTemplatePath = path.join(promoDir, 'marquee-promo-template.png');
        console.log('📐 Creating marquee promo template (1400x560)...');
        
        await sharp({
            create: {
                width: 1400,
                height: 560,
                channels: 3,
                background: { r: 240, g: 240, b: 240 } // Light gray background
            }
        })
        .png({ 
            quality: 100,
            compressionLevel: 9,
            palette: false
        })
        .toFile(bigTemplatePath);
        
        console.log(`✅ Created: ${path.basename(bigTemplatePath)} (1400x560)\n`);

        console.log('✨ ========================================');
        console.log('🎉 Blank templates created successfully!');
        console.log('✨ ========================================');
        console.log('\n📋 Templates created:');
        console.log(`   • ${path.relative(path.join(__dirname, '..'), smallTemplatePath)}`);
        console.log(`   • ${path.relative(path.join(__dirname, '..'), bigTemplatePath)}`);
        console.log('\n💡 Next steps:');
        console.log('   1. Open these template files in your image editor');
        console.log('   2. Create your promotional designs');
        console.log('   3. Save as PNG at the same dimensions');
        console.log('   4. Use for Chrome Web Store submission');

    } catch (error) {
        console.error('❌ Error creating templates:', error.message);
        process.exit(1);
    }
}

createBlankTemplates();

