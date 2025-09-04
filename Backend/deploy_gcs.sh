#!/bin/bash

# Google Cloud Storage Setup Script for Lindle
# This script helps set up GCS for the Lindle project

set -e

echo "🚀 Setting up Google Cloud Storage for Lindle..."

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ Google Cloud SDK is not installed."
    echo "Please install it from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if user is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo "🔐 Please authenticate with Google Cloud:"
    gcloud auth login
fi

# Get current project
PROJECT_ID=$(gcloud config get-value project)
if [ -z "$PROJECT_ID" ]; then
    echo "❌ No project is set. Please set a project:"
    gcloud projects list
    echo "Then run: gcloud config set project PROJECT_ID"
    exit 1
fi

echo "📁 Current project: $PROJECT_ID"

# Enable Cloud Storage API
echo "🔧 Enabling Cloud Storage API..."
gcloud services enable storage.googleapis.com

# Create bucket if it doesn't exist
BUCKET_NAME="lindle-docs"
if ! gsutil ls -b "gs://$BUCKET_NAME" &> /dev/null; then
    echo "🪣 Creating bucket: $BUCKET_NAME"
    gsutil mb -l us-central1 "gs://$BUCKET_NAME"
    
    # Make bucket publicly readable (optional - remove if not needed)
    echo "🌐 Making bucket publicly readable..."
    gsutil iam ch allUsers:objectViewer "gs://$BUCKET_NAME"
else
    echo "✅ Bucket $BUCKET_NAME already exists"
fi

# Create service account for the application
SA_NAME="lindle-gcs-service"
SA_EMAIL="$SA_NAME@$PROJECT_ID.iam.gserviceaccount.com"

if ! gcloud iam service-accounts describe "$SA_EMAIL" &> /dev/null; then
    echo "👤 Creating service account: $SA_NAME"
    gcloud iam service-accounts create "$SA_NAME" \
        --display-name="Lindle GCS Service Account" \
        --description="Service account for Lindle file storage"
else
    echo "✅ Service account $SA_NAME already exists"
fi

# Grant necessary permissions
echo "🔑 Granting permissions to service account..."
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:$SA_EMAIL" \
    --role="roles/storage.objectAdmin"

gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:$SA_EMAIL" \
    --role="roles/storage.objectViewer"

# Create and download service account key
KEY_FILE="lindle-gcs-key.json"
echo "🔐 Creating service account key..."
gcloud iam service-accounts keys create "$KEY_FILE" \
    --iam-account="$SA_EMAIL"

echo "✅ Service account key saved to: $KEY_FILE"
echo ""
echo "📋 Next steps:"
echo "1. Set the environment variable:"
echo "   export GOOGLE_APPLICATION_CREDENTIALS=\"$(pwd)/$KEY_FILE\""
echo ""
echo "2. Test the setup:"
echo "   python test_gcs.py"
echo ""
echo "3. For production, consider using Application Default Credentials instead"
echo "   gcloud auth application-default login"
echo ""
echo "🎉 GCS setup complete!" 