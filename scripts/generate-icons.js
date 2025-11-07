/**
 * Icon generation script
 *
 * MANUAL STEP REQUIRED:
 * This project needs icon files. You can:
 *
 * 1. Use a tool like https://realfavicongenerator.net/ to generate icons
 * 2. Or create placeholders with this script
 *
 * For production, replace these with proper branded icons.
 */

const fs = require("fs");
const path = require("path");

// Simple SVG placeholder icon
const createSVGIcon = (size, text) => `
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#2563eb"/>
  <text x="50%" y="50%" font-size="${size * 0.4}" fill="white" text-anchor="middle" dy=".3em" font-family="Arial, sans-serif" font-weight="bold">
    ${text}
  </text>
</svg>
`;

const publicDir = path.join(__dirname, "..", "public");

// Create icon files
const icons = [
  { name: "icon-192.png", size: 192, text: "AI" },
  { name: "icon-512.png", size: 512, text: "AI" },
  { name: "icon-maskable.png", size: 512, text: "AI" },
];

console.log("⚠️  PLACEHOLDER ICONS");
console.log("This script creates placeholder SVG icons.");
console.log("For production, replace with proper branded icons.\n");

icons.forEach(({ name, size, text }) => {
  const svgName = name.replace(".png", ".svg");
  const svgPath = path.join(publicDir, svgName);
  const svg = createSVGIcon(size, text);

  fs.writeFileSync(svgPath, svg.trim());
  console.log(`✓ Created ${svgName}`);
});

console.log("\n📝 TODO: Convert SVG to PNG using an online tool or ImageMagick:");
console.log("   convert icon-192.svg icon-192.png");
console.log("   convert icon-512.svg icon-512.png");
console.log("   convert icon-maskable.svg icon-maskable.png");
