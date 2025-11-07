# AI Image Editor PWA

A production-ready Progressive Web App for AI-powered image editing. Built with Next.js 14, TypeScript, and TailwindCSS. Uses OpenAI's DALL-E 2 for image edits and Azure Blob Storage for file storage.

## Features

- 📸 **Camera Integration**: Capture or upload photos from any device
- 🎨 **AI-Powered Edits**: 6 preset editing styles using OpenAI
- 💾 **Cloud Storage**: Automatic upload to Azure Blob Storage
- 📱 **PWA Ready**: Installable on iOS, Android, and desktop
- 🔒 **Security First**: Rate limiting, input validation, CSP headers
- 🐳 **Docker Ready**: One-command deployment to Google Cloud Run
- ⚡ **Mobile Optimized**: Client-side image downscaling for fast uploads

## Quick Start

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- OpenAI API key ([Get one here](https://platform.openai.com/api-keys))
- Azure Storage account ([Create one](https://portal.azure.com))
- (Optional) Docker for containerized deployment
- (Optional) Google Cloud SDK for Cloud Run deployment

### Local Development

1. **Clone and install dependencies:**

```bash
git clone <your-repo>
cd PA
npm install
# or: pnpm install
# or: yarn install
```

2. **Set up environment variables:**

```bash
cp .env.example .env.local
```

Edit `.env.local` with your credentials:

```env
OPENAI_API_KEY=sk-your-openai-api-key-here
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=...
AZURE_STORAGE_CONTAINER=edited-images
AZURE_STORAGE_ACCOUNT=yourstorageaccount
```

3. **Generate placeholder icons (optional for dev):**

```bash
npm run build  # This will generate SVG icons automatically
```

4. **Run development server:**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

5. **Access from mobile device on same network:**

Find your local IP:
```bash
# macOS/Linux
ifconfig | grep "inet "
# Windows
ipconfig
```

Then visit `http://YOUR_IP:3000` on your phone.

## Configuration

### OpenAI Setup

1. Sign up at [OpenAI Platform](https://platform.openai.com)
2. Navigate to [API Keys](https://platform.openai.com/api-keys)
3. Create a new secret key
4. Add to `.env.local` as `OPENAI_API_KEY`

**Note:** This app uses DALL-E 2 for image edits. Check [OpenAI Pricing](https://openai.com/pricing) for costs.

### Azure Blob Storage Setup

1. Create a Storage Account:
   - Go to [Azure Portal](https://portal.azure.com)
   - Create Resource → Storage Account
   - Note the account name

2. Create a container:
   - In your storage account, go to "Containers"
   - Create new container named `edited-images`
   - Set public access level to "Blob (anonymous read access for blobs only)"

3. Get connection string:
   - Go to "Access keys" in your storage account
   - Copy the connection string
   - Add to `.env.local` as `AZURE_STORAGE_CONNECTION_STRING`

4. Configure CORS (for direct browser access):
   - Go to "Resource sharing (CORS)" in storage account
   - Add rule:
     - Allowed origins: `*` (or your domain)
     - Allowed methods: `GET`
     - Allowed headers: `*`
     - Exposed headers: `*`
     - Max age: `3600`

### Customizing Edit Presets

Edit presets are defined in `lib/presets.ts`. To add or modify presets:

```typescript
// lib/presets.ts

export const PRESETS: Preset[] = [
  {
    id: 'my-custom-preset',
    label: 'My Custom Effect',
    prompt: 'Detailed prompt for OpenAI describing the desired edit',
    description: 'Short user-facing description',
  },
  // ... existing presets
];
```

The prompt is sent directly to OpenAI's image edit API. Be specific and descriptive for best results.

## Deployment

### Docker (Local Testing)

```bash
# Build image
npm run docker:build
# or: docker build -t pwa-ai-edit:latest .

# Run container (requires .env.local)
npm run docker:run
# or: docker run -p 3000:3000 --env-file .env.local pwa-ai-edit:latest
```

Access at `http://localhost:3000`

### Google Cloud Run (Production)

**Prerequisites:**
- Google Cloud account with billing enabled
- [gcloud CLI](https://cloud.google.com/sdk/docs/install) installed
- Docker installed

**Step 1: Configure gcloud**

```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
gcloud auth configure-docker
```

**Step 2: Deploy**

Option A - Automated script:
```bash
./deploy.sh YOUR_PROJECT_ID us-central1
```

Option B - Manual steps:
```bash
# Build and tag image
docker build -t gcr.io/YOUR_PROJECT_ID/pwa-ai-edit:latest .

# Push to Google Container Registry
docker push gcr.io/YOUR_PROJECT_ID/pwa-ai-edit:latest

# Deploy to Cloud Run
gcloud run deploy pwa-ai-edit \
  --image gcr.io/YOUR_PROJECT_ID/pwa-ai-edit:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 1Gi \
  --cpu 1 \
  --max-instances 10 \
  --timeout 60 \
  --set-env-vars "OPENAI_API_KEY=sk-your-key" \
  --set-env-vars "AZURE_STORAGE_CONNECTION_STRING=your-connection-string" \
  --set-env-vars "AZURE_STORAGE_CONTAINER=edited-images" \
  --set-env-vars "AZURE_STORAGE_ACCOUNT=youraccountname"
```

**Step 3: Get your URL**

```bash
gcloud run services describe pwa-ai-edit \
  --platform managed \
  --region us-central1 \
  --format 'value(status.url)'
```

**Step 4: Install as PWA**

Visit your Cloud Run URL and:
- **iOS Safari**: Tap Share → Add to Home Screen
- **Android Chrome**: Tap Menu → Install App
- **Desktop Chrome**: Click install icon in address bar

### Other Deployment Options

- **Vercel**: Push to GitHub and import in Vercel (add env vars in dashboard)
- **AWS ECS/Fargate**: Use the Dockerfile with your ECS task definition
- **Azure Container Apps**: Deploy with `az containerapp create`

## Development

### Scripts

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint
npm run typecheck    # Run TypeScript checks
npm run format       # Format with Prettier
npm run docker:build # Build Docker image
npm run docker:run   # Run Docker container locally
```

### Project Structure

```
PA/
├── app/
│   ├── api/
│   │   ├── edit/route.ts       # Main image processing endpoint
│   │   └── health/route.ts     # Health check for Docker
│   ├── layout.tsx              # Root layout with PWA config
│   ├── page.tsx                # Main UI page
│   └── globals.css             # Global styles
├── components/
│   ├── ImagePicker.tsx         # Camera/upload with client downscale
│   ├── PresetSelect.tsx        # Preset dropdown + custom prompt
│   └── ResultCard.tsx          # Display edited image + actions
├── lib/
│   ├── openai.ts               # OpenAI DALL-E 2 integration
│   ├── azureBlob.ts            # Azure Blob upload helpers
│   ├── imageUtils.ts           # Image processing (Sharp)
│   ├── rateLimit.ts            # In-memory rate limiter
│   └── presets.ts              # Edit preset definitions ⭐
├── public/
│   ├── manifest.json           # PWA manifest
│   ├── sw.js                   # Service worker
│   ├── register-sw.js          # SW registration
│   └── icon-*.png              # PWA icons
├── scripts/
│   ├── generate-icons.js       # Icon generation helper
│   └── svg-to-png.js           # SVG to PNG converter
├── .env.example                # Environment template
├── Dockerfile                  # Production container
├── deploy.sh                   # Cloud Run deployment script
└── README.md                   # This file
```

## Troubleshooting

### Issue: "OPENAI_API_KEY is not configured"

**Solution:** Ensure `.env.local` exists with valid `OPENAI_API_KEY`. Restart dev server after changes.

### Issue: "AZURE_STORAGE_CONNECTION_STRING is not configured"

**Solution:**
1. Verify connection string in `.env.local`
2. Check format matches: `DefaultEndpointsProtocol=https;AccountName=...`
3. Ensure no extra spaces or quotes

### Issue: Image upload fails with 413 error

**Solution:**
- Client should auto-downscale to 2048px max
- Check `MAX_IMAGE_SIZE_MB` in `.env.local` (default 8MB)
- Verify Next.js `bodySizeLimit` in `next.config.mjs`

### Issue: Rate limit exceeded

**Solution:**
- Default: 5 requests per minute per IP
- Adjust in `.env.local`: `RATE_LIMIT_MAX_REQUESTS=10`
- Or increase window: `RATE_LIMIT_WINDOW_MS=120000` (2 minutes)

### Issue: OpenAI returns error "Image format not supported"

**Solution:**
- App converts all images to PNG automatically
- If error persists, check original image isn't corrupted
- Verify Sharp is installed: `npm list sharp`

### Issue: PWA not installing on iOS

**Solution:**
1. Must be accessed via HTTPS (Cloud Run provides this)
2. Manifest must be valid (check browser console)
3. Icons must exist: run `node scripts/generate-icons.js && node scripts/svg-to-png.js`
4. Use Safari (not Chrome) on iOS

### Issue: Docker build fails

**Solution:**
```bash
# Clear Docker cache
docker builder prune

# Rebuild without cache
docker build --no-cache -t pwa-ai-edit:latest .

# Check Node version in Dockerfile (should be 18+)
```

### Issue: Cloud Run deployment times out

**Solution:**
- Increase timeout: `--timeout 300`
- Check image size: `docker images` (should be <1GB)
- Verify env vars are set correctly
- Check logs: `gcloud run logs read pwa-ai-edit`

### Issue: Edited images not appearing

**Solution:**
1. Check Azure Blob container has public access
2. Verify container name matches `.env.local`
3. Check CORS settings in Azure Storage
4. Test direct access to blob URL in browser

### Issue: Service Worker not updating

**Solution:**
1. Hard refresh: Ctrl+Shift+R (Cmd+Shift+R on Mac)
2. Unregister SW in DevTools → Application → Service Workers
3. Clear cache: DevTools → Application → Clear storage
4. Increment `CACHE_NAME` in `public/sw.js`

## Performance Optimization

### Image Processing
- Client-side downscaling reduces upload time and costs
- Server-side Sharp ensures consistent format for OpenAI
- Azure CDN (optional) for faster blob delivery

### Cost Control
- Rate limiting prevents abuse
- Max image size limits
- Client downscaling reduces OpenAI costs
- Efficient Docker image (~200MB)

### Caching
- Service Worker caches static assets
- Azure Blob CDN integration (configure separately)
- Browser caching via headers (1 year for images)

## Security Considerations

- ✅ Rate limiting (5 req/min per IP)
- ✅ Input validation (file type, size)
- ✅ SVG blocked (XSS risk)
- ✅ CSP headers configured
- ✅ Security headers (X-Frame-Options, etc.)
- ✅ Secrets only in server environment
- ✅ Non-root Docker user

**Production Recommendations:**
- Use Azure Key Vault or GCP Secret Manager for secrets
- Implement authentication (NextAuth, Clerk, etc.)
- Add request logging/monitoring (Sentry, Datadog)
- Set up Azure Private Endpoints for blob storage
- Configure WAF rules in Cloud Run/Azure Front Door

## License

MIT License - feel free to use for personal or commercial projects.

## Support

For issues or questions:
1. Check this README's troubleshooting section
2. Review [Next.js docs](https://nextjs.org/docs)
3. Check [OpenAI docs](https://platform.openai.com/docs)
4. Review [Azure Blob Storage docs](https://docs.microsoft.com/azure/storage/blobs/)

## Future Enhancements

See inline TODOs in code for suggested improvements:

- Add direct-to-Azure SAS upload (bypass server)
- Implement mask support for targeted edits
- Add user authentication (Clerk/NextAuth)
- History page to view past edits
- Image comparison slider (before/after)
- Batch processing
- More output formats (JPEG, WebP quality selector)
- Dark mode theme
