#!/bin/bash

# Workload Identity Federation setup for GitHub Actions
# This avoids the need for service account keys

PROJECT_ID="moai-scm-suite"
GITHUB_REPO="kaz-kobayashi/moai-scm-suite"
SERVICE_ACCOUNT="moai-github-deployer@${PROJECT_ID}.iam.gserviceaccount.com"
WORKLOAD_IDENTITY_POOL="github-actions-pool"
WORKLOAD_IDENTITY_PROVIDER="github-actions-provider"

echo "🚀 Setting up Workload Identity Federation for GitHub Actions..."

# Create Workload Identity Pool
echo "📋 Creating Workload Identity Pool..."
gcloud iam workload-identity-pools create $WORKLOAD_IDENTITY_POOL \
    --project=$PROJECT_ID \
    --location="global" \
    --display-name="GitHub Actions Pool"

# Get the full ID of the Workload Identity Pool
WORKLOAD_IDENTITY_POOL_ID=$(gcloud iam workload-identity-pools describe $WORKLOAD_IDENTITY_POOL \
    --project=$PROJECT_ID \
    --location="global" \
    --format="value(name)")

# Create Workload Identity Provider
echo "🔐 Creating Workload Identity Provider..."
gcloud iam workload-identity-pools providers create-oidc $WORKLOAD_IDENTITY_PROVIDER \
    --project=$PROJECT_ID \
    --location="global" \
    --workload-identity-pool=$WORKLOAD_IDENTITY_POOL \
    --display-name="GitHub Actions Provider" \
    --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository" \
    --issuer-uri="https://token.actions.githubusercontent.com"

# Allow GitHub Actions to impersonate the service account
echo "🔗 Binding service account to Workload Identity..."
gcloud iam service-accounts add-iam-policy-binding $SERVICE_ACCOUNT \
    --project=$PROJECT_ID \
    --role="roles/iam.workloadIdentityUser" \
    --member="principalSet://iam.googleapis.com/${WORKLOAD_IDENTITY_POOL_ID}/attribute.repository/${GITHUB_REPO}"

# Get the Workload Identity Provider resource name
WORKLOAD_IDENTITY_PROVIDER_ID=$(gcloud iam workload-identity-pools providers describe $WORKLOAD_IDENTITY_PROVIDER \
    --project=$PROJECT_ID \
    --location="global" \
    --workload-identity-pool=$WORKLOAD_IDENTITY_POOL \
    --format="value(name)")

echo "✅ Setup complete!"
echo ""
echo "🔧 Add these to your GitHub repository secrets:"
echo "GCP_PROJECT_ID: $PROJECT_ID"
echo "GCP_SA_EMAIL: $SERVICE_ACCOUNT"
echo "GCP_WORKLOAD_IDENTITY_PROVIDER: $WORKLOAD_IDENTITY_PROVIDER_ID"