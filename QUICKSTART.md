# Quick Start Commands

## Local Development

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.example .env.local
# Edit .env.local with your API keys

# 3. Generate icons (after npm install)
node scripts/generate-icons.js
node scripts/svg-to-png.js

# 4. Run development server
npm run dev
# Visit http://localhost:3000
```

## Docker Local Testing

```bash
# Build and run
npm run docker:build
npm run docker:run

# Or manually:
docker build -t pwa-ai-edit:latest .
docker run -p 3000:3000 --env-file .env.local pwa-ai-edit:latest
```

## Google Cloud Run Deployment

```bash
# Prerequisites
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
gcloud auth configure-docker

# Option 1: Automated
./deploy.sh YOUR_PROJECT_ID us-central1

# Option 2: Manual
docker build -t gcr.io/YOUR_PROJECT_ID/pwa-ai-edit:latest .
docker push gcr.io/YOUR_PROJECT_ID/pwa-ai-edit:latest

gcloud run deploy pwa-ai-edit \
  --image gcr.io/YOUR_PROJECT_ID/pwa-ai-edit:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 1Gi \
  --set-env-vars "OPENAI_API_KEY=sk-..." \
  --set-env-vars "AZURE_STORAGE_CONNECTION_STRING=..." \
  --set-env-vars "AZURE_STORAGE_CONTAINER=edited-images" \
  --set-env-vars "AZURE_STORAGE_ACCOUNT=youraccountname"
```

## Where to Edit Presets

**File:** `lib/presets.ts`

```typescript
export const PRESETS: Preset[] = [
  {
    id: 'my-preset',
    label: 'My Custom Effect',
    prompt: 'Your detailed prompt for OpenAI',
    description: 'User-facing description',
  },
  // ... more presets
];
```

## Useful Commands

```bash
npm run typecheck    # Check TypeScript
npm run lint         # Run ESLint
npm run format       # Format code with Prettier
npm run build        # Production build
```

## Common Issues

**Missing icons?**
```bash
node scripts/generate-icons.js && node scripts/svg-to-png.js
```

**API keys not working?**
- Restart dev server after changing .env.local
- Check for extra spaces/quotes in values

**Can't connect from phone?**
- Ensure phone on same network
- Use your computer's LAN IP (not localhost)
- Disable firewall temporarily

See README.md for detailed troubleshooting.
