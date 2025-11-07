# PWA Icons

This directory should contain the following icon files:

- `icon-192.png` - 192x192px app icon
- `icon-512.png` - 512x512px app icon
- `icon-192-maskable.png` - 192x192px maskable icon (with safe zone)
- `icon-512-maskable.png` - 512x512px maskable icon (with safe zone)
- `screenshot-mobile.png` - Mobile screenshot (750x1334px or similar)

## Quick Setup

For development, you can create simple placeholder icons:

### Using ImageMagick:
```bash
# Create a simple blue icon with "AI" text
convert -size 192x192 xc:#0ea5e9 -pointsize 80 -fill white -gravity center -annotate +0+0 "AI" icon-192.png
convert -size 512x512 xc:#0ea5e9 -pointsize 200 -fill white -gravity center -annotate +0+0 "AI" icon-512.png

# For maskable icons, add padding (safe zone)
convert -size 192x192 xc:#0ea5e9 -pointsize 60 -fill white -gravity center -annotate +0+0 "AI" icon-192-maskable.png
convert -size 512x512 xc:#0ea5e9 -pointsize 160 -fill white -gravity center -annotate +0+0 "AI" icon-512-maskable.png
```

### Using an Online Tool:
- Visit https://www.pwabuilder.com/imageGenerator
- Upload your logo/icon design
- Generate all required sizes including maskable variants

### Maskable Icons
Maskable icons should have important content in the center "safe zone" (80% of the icon).
The outer 20% may be cropped on some devices.

## Production Icons

For production, design custom icons with:
- Simple, recognizable design
- High contrast
- Consistent with your brand
- Tested on multiple devices and platforms
