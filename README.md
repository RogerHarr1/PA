# PWA AI Image Editor

A production-ready Progressive Web App (PWA) for AI-powered image editing using OpenAI's DALL-E 2 and Azure Blob Storage.

## Features

- 📸 **Mobile-First Design** - Capture photos directly from your device camera
- 🎨 **AI-Powered Edits** - Background removal, color enhancement, portrait cleanup, and more
- ☁️ **Cloud Storage** - Automatic upload to Azure Blob Storage
- 📱 **PWA Support** - Installable on iOS, Android, and desktop
- 🔒 **Security First** - Rate limiting, input validation, and security headers
- 🐳 **Container Ready** - Optimized Dockerfile for Google Cloud Run

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, TailwindCSS
- **AI**: OpenAI DALL-E 2 (Images Edit API)
- **Storage**: Azure Blob Storage
- **Deployment**: Docker + Google Cloud Run
- **PWA**: Service Worker, Web Manifest

## Prerequisites

- Node.js 18 or higher
- npm or pnpm
- OpenAI API key
- Azure Storage Account
- (For deployment) Google Cloud account with Cloud Run enabled

## Local Setup

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd pwa-ai-image-editor
npm install
```

### 2. Configure Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local` with your credentials:

```env
# OpenAI API Key
# Get from: https://platform.openai.com/api-keys
OPENAI_API_KEY=sk-proj-...

# Azure Blob Storage
# Get from: Azure Portal > Storage Account > Access Keys
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=...;AccountKey=...;EndpointSuffix=core.windows.net
AZURE_STORAGE_CONTAINER=edited-images

# Optional: Rate limiting
RATE_LIMIT_MAX=5
RATE_LIMIT_WINDOW_MS=60000
```

### 3. Set Up Azure Blob Storage

1. Create a Storage Account in Azure Portal
2. Create a container named `edited-images`
3. Set container access level to "Blob (anonymous read access for blobs only)"
4. Configure CORS if needed:
   - Allowed origins: Your domain or `*` for testing
   - Allowed methods: GET, HEAD
   - Allowed headers: `*`
   - Max age: 3600

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Test on Mobile (LAN)

1. Find your local IP address:
   ```bash
   # macOS/Linux
   ifconfig | grep "inet "

   # Windows
   ipconfig
   ```

2. Open `http://YOUR_IP:3000` on your mobile device

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking
- `npm run docker:build` - Build Docker image
- `npm run docker:run` - Run Docker container locally

## Preset Configuration

Edit presets in `lib/presets.ts`:

```typescript
export const PRESETS: Record<string, Preset> = {
  "my-preset": {
    id: "my-preset",
    label: "My Custom Preset",
    prompt: "Your detailed prompt for OpenAI here",
    description: "User-facing description",
  },
  // ... add more presets
};
```

## Docker Deployment

### Local Docker Test

```bash
# Build image
npm run docker:build

# Run container
npm run docker:run
```

### Google Cloud Run Deployment

#### 1. Set Up Google Cloud

```bash
# Install gcloud CLI (if not already installed)
# https://cloud.google.com/sdk/docs/install

# Login and set project
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

# Enable Cloud Run API
gcloud services enable run.googleapis.com
```

#### 2. Build and Push Image

```bash
# Set variables
export PROJECT_ID=your-project-id
export REGION=us-central1
export IMAGE_NAME=pwa-ai-edit

# Build for Cloud Run
docker build --platform linux/amd64 -t gcr.io/$PROJECT_ID/$IMAGE_NAME:v1 .

# Authenticate with GCR
gcloud auth configure-docker

# Push image
docker push gcr.io/$PROJECT_ID/$IMAGE_NAME:v1
```

#### 3. Deploy to Cloud Run

```bash
gcloud run deploy pwa-ai-edit \
  --image gcr.io/$PROJECT_ID/$IMAGE_NAME:v1 \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --set-env-vars OPENAI_API_KEY=$OPENAI_API_KEY \
  --set-env-vars AZURE_STORAGE_CONNECTION_STRING=$AZURE_STORAGE_CONNECTION_STRING \
  --set-env-vars AZURE_STORAGE_CONTAINER=edited-images \
  --memory 512Mi \
  --timeout 300 \
  --max-instances 10
```

#### 4. Verify Deployment

```bash
# Get service URL
gcloud run services describe pwa-ai-edit --region $REGION --format 'value(status.url)'

# Test the endpoint
curl https://YOUR_SERVICE_URL.run.app
```

#### 5. Update Environment Variables Later

```bash
gcloud run services update pwa-ai-edit \
  --region $REGION \
  --update-env-vars KEY=VALUE
```

## PWA Installation

### iOS (Safari)

1. Open the app in Safari
2. Tap the Share button
3. Tap "Add to Home Screen"
4. Tap "Add"

### Android (Chrome)

1. Open the app in Chrome
2. Tap the menu (⋮)
3. Tap "Add to Home screen"
4. Tap "Add"

### Desktop (Chrome/Edge)

1. Open the app in Chrome or Edge
2. Look for the install icon in the address bar
3. Click "Install"

## Architecture

```
app/
├── layout.tsx          # Root layout with PWA setup
├── page.tsx            # Main image editor UI
├── register-sw.tsx     # Service worker registration
└── api/
    └── edit/
        └── route.ts    # Image editing API endpoint

components/
├── ImagePicker.tsx     # Camera/upload with client-side downscaling
├── PresetSelect.tsx    # Preset dropdown selector
└── ResultCard.tsx      # Display edited image results

lib/
├── openai.ts           # OpenAI API wrapper
├── azureBlob.ts        # Azure Blob Storage helpers
├── rateLimit.ts        # In-memory rate limiting
├── imageUtils.ts       # Image processing with Sharp
└── presets.ts          # Edit preset definitions

public/
├── manifest.json       # PWA manifest
├── sw.js              # Service worker
└── icon-*.png         # PWA icons
```

## API Endpoint

### POST /api/edit

Edit an image using AI.

**Request** (multipart/form-data):
- `file`: Image file (JPEG, PNG, WebP, max 8MB)
- `preset`: Preset ID (e.g., "remove-bg", "enhance")
- `customPrompt` (optional): Override preset with custom prompt

**Response** (JSON):
```json
{
  "blobUrl": "https://...blob.core.windows.net/.../image.png",
  "filename": "2024/01/15/uuid.png",
  "promptUsed": "Remove the background...",
  "bytes": 245678
}
```

**Rate Limits**:
- 5 requests per minute per IP (configurable)
- Returns 429 status when exceeded

## Cost Controls

- Client-side downscaling to max 2048px before upload
- Server-side validation of file size (8MB limit)
- OpenAI images are generated at 1024x1024
- Rate limiting prevents abuse

## Troubleshooting

### "OpenAI API error"
- Verify `OPENAI_API_KEY` is set correctly
- Check API key has credits: https://platform.openai.com/usage
- Note: DALL-E 2 is used for edits (gpt-image-1 not available)

### "Azure Storage error"
- Verify `AZURE_STORAGE_CONNECTION_STRING` is correct
- Check container exists and has correct permissions
- Ensure storage account is not firewalled

### "Rate limit exceeded"
- Wait 60 seconds (default window)
- Increase `RATE_LIMIT_MAX` in `.env.local`
- For production, consider Redis-based rate limiting

### Icons not showing
- Icons are SVG placeholders by default
- For production, replace with proper PNG icons
- Use https://realfavicongenerator.net/ to generate icons

### Docker build fails
- Ensure `output: 'standalone'` is in `next.config.mjs`
- Check Node.js version (must be 18+)
- Try `docker build --no-cache`

### Mobile camera not working
- Must use HTTPS or localhost
- Check browser permissions for camera access
- `capture="environment"` attribute may not work in all browsers

### Service Worker not registering
- Must use HTTPS in production
- Clear browser cache and reload
- Check browser console for errors

## Security Considerations

- ✅ Secrets in environment variables only
- ✅ Rate limiting per IP
- ✅ File type and size validation
- ✅ Security headers (CSP, X-Frame-Options, etc.)
- ✅ Input sanitization (prompt length limits)
- ✅ No SVG uploads (XSS risk)
- ⚠️ In-memory rate limiting (use Redis in production)
- ⚠️ IP-based limiting (can be bypassed with VPN)

## Future Enhancements

### Suggested Follow-ups

1. **Direct SAS Upload**
   ```
   "Add a /api/sas route and switch client to upload directly to Blob using SAS."
   ```

2. **Mask Support**
   ```
   "Add mask support: let me draw/erase on the image client-side and send as PNG mask."
   ```

3. **Authentication**
   ```
   "Add Auth (Clerk or NextAuth) and limit to signed-in users."
   ```

4. **Image Compression**
   ```
   "Compress edited PNG to JPEG/WebP with quality selector."
   ```

5. **History/Gallery**
   - Store metadata JSON with each image
   - Read today's folder by prefix
   - Display history list on homepage

6. **Dark Mode**
   - Add theme toggle
   - Respect system preference
   - Persist in localStorage

## License

MIT

## Support

For issues and questions:
- Check the [Troubleshooting](#troubleshooting) section
- Open an issue on GitHub
- Review OpenAI docs: https://platform.openai.com/docs/guides/images
- Review Azure docs: https://docs.microsoft.com/azure/storage/blobs/

---

**Built with ❤️ using Next.js, OpenAI, and Azure**
