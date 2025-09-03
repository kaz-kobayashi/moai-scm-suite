#!/bin/bash

# Google Cloud Run deployment script

# Configuration
#PROJECT_ID="your-project-id"
PROJECT_ID="moai-scm-suite"
SERVICE_NAME="scmopt"
REGION="asia-northeast1"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "🚀 Starting deployment to Google Cloud Run..."

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ gcloud CLI is not installed. Please install it first.${NC}"
    exit 1
fi

# Check if PROJECT_ID is set
if [ "$PROJECT_ID" = "your-project-id" ]; then
    echo -e "${RED}❌ Please set your PROJECT_ID in this script${NC}"
    exit 1
fi

# Set the project
echo "📋 Setting project to ${PROJECT_ID}..."
gcloud config set project ${PROJECT_ID}

# Enable required APIs
echo "🔧 Enabling required APIs..."
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com

# Build the Docker image
echo "🏗️  Building Docker image..."
docker build --platform linux/amd64 -t ${IMAGE_NAME}:latest .

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Docker build failed${NC}"
    exit 1
fi

# Configure Docker for GCR
echo "🔐 Configuring Docker authentication..."
gcloud auth configure-docker

# Push the image to GCR
echo "📤 Pushing image to Google Container Registry..."
docker push ${IMAGE_NAME}:latest

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to push image to GCR${NC}"
    exit 1
fi

# Deploy to Cloud Run
echo "🚀 Deploying to Cloud Run..."
gcloud run deploy ${SERVICE_NAME} \
    --image ${IMAGE_NAME}:latest \
    --region ${REGION} \
    --platform managed \
    --allow-unauthenticated \
    --memory 2Gi \
    --cpu 2 \
    --timeout 300 \
    --set-env-vars "OSRM_HOST=test-osrm-intel.aq-cloud.com" \
    --set-env-vars "MAPBOX_ACCESS_TOKEN=${MAPBOX_ACCESS_TOKEN}"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Deployment successful!${NC}"
    echo ""
    echo "🌐 Your application is now running at:"
    gcloud run services describe ${SERVICE_NAME} --region ${REGION} --format 'value(status.url)'
else
    echo -e "${RED}❌ Deployment failed${NC}"
    exit 1
fi