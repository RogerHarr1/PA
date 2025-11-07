#!/usr/bin/env node

/**
 * Convert SVG icons to PNG using sharp
 * Note: This requires npm install first
 */

const fs = require('fs');
const path = require('path');

async function convertSVGtoPNG() {
  try {
    const sharp = require('sharp');
    const publicDir = path.join(__dirname, '../public');

    const files = [
      'icon-192.svg',
      'icon-512.svg',
      'icon-192-maskable.svg',
      'icon-512-maskable.svg',
    ];

    for (const file of files) {
      const svgPath = path.join(publicDir, file);
      const pngPath = path.join(publicDir, file.replace('.svg', '.png'));

      if (fs.existsSync(svgPath)) {
        await sharp(svgPath).png().toFile(pngPath);
        console.log(`✓ Converted ${file} to PNG`);
      }
    }

    console.log('\n✅ All icons converted successfully!');
  } catch (error) {
    if (error.code === 'MODULE_NOT_FOUND') {
      console.error('❌ Sharp not installed. Run: npm install');
    } else {
      console.error('Error converting icons:', error.message);
    }
    process.exit(1);
  }
}

convertSVGtoPNG();
