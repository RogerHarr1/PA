#!/usr/bin/env node

/**
 * Generate placeholder PWA icons
 * For production, replace with actual designed icons
 */

const fs = require('fs');
const path = require('path');

const sizes = [
  { size: 192, name: 'icon-192.png', fontSize: 80, padding: 0 },
  { size: 512, name: 'icon-512.png', fontSize: 200, padding: 0 },
  { size: 192, name: 'icon-192-maskable.png', fontSize: 60, padding: 20 },
  { size: 512, name: 'icon-512-maskable.png', fontSize: 160, padding: 50 },
];

function generateSVG(size, fontSize, padding) {
  const innerSize = size - padding * 2;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#0ea5e9"/>
  <text x="${size / 2}" y="${size / 2}" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">AI</text>
</svg>`;
}

const publicDir = path.join(__dirname, '../public');

// Create SVG placeholders
sizes.forEach(({ size, name, fontSize, padding }) => {
  const svg = generateSVG(size, fontSize, padding);
  const svgPath = path.join(publicDir, name.replace('.png', '.svg'));
  fs.writeFileSync(svgPath, svg);
  console.log(`Created ${name.replace('.png', '.svg')}`);
});

console.log('\n⚠️  SVG placeholders created. For PNG icons:');
console.log('   Run: npm install -g sharp-cli');
console.log('   Then: for f in public/*.svg; do sharp -i "$f" -o "${f%.svg}.png"; done');
console.log('\n   Or use an online converter like https://www.pwabuilder.com/imageGenerator');
