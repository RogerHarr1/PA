# Quick Start Guide

## Local Development (3 minutes)

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.example .env.local
# Edit .env.local with your keys

# 3. Run development server
npm run dev
```

Open http://localhost:3000 on your phone via LAN (find your IP with `ifconfig` or `ipconfig`)

## Deploy to Cloud Run (5 minutes)

```bash
# Set up variables
export PROJECT_ID=your-gcp-project-id
export REGION=us-central1
export IMAGE_NAME=pwa-ai-edit

# Build and push
docker build --platform linux/amd64 -t gcr.io/$PROJECT_ID/$IMAGE_NAME:v1 .
gcloud auth configure-docker
docker push gcr.io/$PROJECT_ID/$IMAGE_NAME:v1

# Deploy
gcloud run deploy pwa-ai-edit \
  --image gcr.io/$PROJECT_ID/$IMAGE_NAME:v1 \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --set-env-vars OPENAI_API_KEY=$OPENAI_API_KEY \
  --set-env-vars AZURE_STORAGE_CONNECTION_STRING=$AZURE_STORAGE_CONNECTION_STRING \
  --set-env-vars AZURE_STORAGE_CONTAINER=edited-images \
  --memory 512Mi \
  --timeout 300
```

## Adding New Presets

Edit `lib/presets.ts`:

```typescript
export const PRESETS: Record<string, Preset> = {
  "my-preset": {
    id: "my-preset",
    label: "My Custom Effect",
    prompt: "Your detailed AI prompt here",
    description: "What users see in the dropdown",
  },
  // existing presets...
};
```

The preset will automatically appear in the UI dropdown.

## Key Files

- **Add/modify presets**: `lib/presets.ts`
- **API route**: `app/api/edit/route.ts`
- **Main UI**: `app/page.tsx`
- **Environment**: `.env.local`
- **Docker**: `Dockerfile`

## Troubleshooting Quick Fixes

| Issue | Solution |
|-------|----------|
| OpenAI error | Check API key and credits at https://platform.openai.com/usage |
| Azure error | Verify connection string and container exists |
| Rate limit | Wait 60s or increase `RATE_LIMIT_MAX` in `.env.local` |
| Docker build fails | Add `output: 'standalone'` to `next.config.mjs` |
| Icons missing | Replace with proper PNGs at realfavicongenerator.net |

## Cost Estimates (as of 2024)

- **OpenAI DALL-E 2 Edit**: ~$0.020 per image (1024x1024)
- **Azure Blob Storage**: ~$0.02 per GB/month
- **Google Cloud Run**: ~$0.40 per million requests (with generous free tier)

For 100 edits/day: ~$60-80/month

See full docs in [README.md](./README.md)
