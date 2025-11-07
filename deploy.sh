#!/bin/bash
set -e

# Deployment script for Google Cloud Run
# Usage: ./deploy.sh PROJECT_ID REGION

PROJECT_ID=${1:-"your-project-id"}
REGION=${2:-"us-central1"}
SERVICE_NAME="pwa-ai-edit"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}:latest"

echo "🚀 Deploying ${SERVICE_NAME} to Google Cloud Run"
echo "   Project: ${PROJECT_ID}"
echo "   Region: ${REGION}"
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ Error: .env.local not found"
    echo "   Copy .env.example to .env.local and configure your secrets"
    exit 1
fi

# Load environment variables
source .env.local

# Validate required variables
if [ -z "$OPENAI_API_KEY" ] || [ -z "$AZURE_STORAGE_CONNECTION_STRING" ]; then
    echo "❌ Error: Missing required environment variables"
    echo "   OPENAI_API_KEY and AZURE_STORAGE_CONNECTION_STRING must be set"
    exit 1
fi

# Build Docker image
echo "📦 Building Docker image..."
docker build -t ${IMAGE_NAME} .

# Push to Google Container Registry
echo "📤 Pushing to GCR..."
docker push ${IMAGE_NAME}

# Deploy to Cloud Run
echo "🚢 Deploying to Cloud Run..."
gcloud run deploy ${SERVICE_NAME} \
    --image ${IMAGE_NAME} \
    --platform managed \
    --region ${REGION} \
    --allow-unauthenticated \
    --memory 1Gi \
    --cpu 1 \
    --max-instances 10 \
    --timeout 60 \
    --set-env-vars "OPENAI_API_KEY=${OPENAI_API_KEY}" \
    --set-env-vars "AZURE_STORAGE_CONNECTION_STRING=${AZURE_STORAGE_CONNECTION_STRING}" \
    --set-env-vars "AZURE_STORAGE_CONTAINER=${AZURE_STORAGE_CONTAINER:-edited-images}" \
    --set-env-vars "AZURE_STORAGE_ACCOUNT=${AZURE_STORAGE_ACCOUNT}" \
    --project ${PROJECT_ID}

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📱 Your PWA is now available at:"
gcloud run services describe ${SERVICE_NAME} --platform managed --region ${REGION} --format 'value(status.url)' --project ${PROJECT_ID}
