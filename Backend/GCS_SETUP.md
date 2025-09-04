# Google Cloud Storage Setup for Lindle

This document explains how to set up Google Cloud Storage for the Lindle project to store uploaded contract files.

## Prerequisites

1. Google Cloud Platform account
2. Google Cloud Storage API enabled
3. A bucket named "lindle-docs" created in your GCP project

## Setup Steps

### 1. Create the GCS Bucket

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to Cloud Storage > Buckets
4. Click "Create Bucket"
5. Set bucket name to: `lindle-docs`
6. Choose your preferred location and storage class
7. **Important**: Set access control to "Uniform" (this is the default and recommended setting)
8. Click "Create"

### 2. Configure Bucket Permissions for Public Read Access

Since you're using uniform bucket-level access, you need to configure public read access at the bucket level:

1. Go to your `lindle-docs` bucket
2. Click on the "Permissions" tab
3. Click "Add" to add a new member
4. Add `allUsers` as a member
5. Grant the role: `Storage Object Viewer`
6. This will make all objects in the bucket publicly readable

**Note**: With uniform bucket-level access, you cannot set individual object ACLs. All access control is managed at the bucket level.

### 2. Configure Authentication

#### Option A: Service Account Key (Recommended for local development)

1. Go to IAM & Admin > Service Accounts
2. Click "Create Service Account"
3. Give it a name like "lindle-gcs-service"
4. Grant the following roles:
   - Storage Object Admin
   - Storage Object Viewer
5. Create and download the JSON key file
6. Set the environment variable:
   ```bash
   export GOOGLE_APPLICATION_CREDENTIALS="/path/to/your/service-account-key.json"
   ```

#### Option B: Application Default Credentials (Recommended for Cloud Run)

1. Install Google Cloud SDK
2. Run authentication:
   ```bash
   gcloud auth application-default login
   ```

### 3. Install Dependencies

```bash
pip install google-cloud-storage==2.14.0
```

### 4. Test the Setup

Run the test script to verify everything works:

```bash
cd Backend
python test_gcs.py
```

## Environment Variables

Set these environment variables in your `.env` file or deployment configuration:

```bash
# For service account authentication
GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account-key.json"

# For application default credentials (Cloud Run)
# No additional variables needed
```

## How It Works

1. **File Upload**: When a user uploads a contract, it's automatically saved to the `lindle-docs` bucket
2. **Unique Naming**: Files are stored with UUID-based names to avoid conflicts
3. **Firebase Integration**: The GCS file path and URL are stored in Firebase alongside the analysis results
4. **Public Access**: Files are publicly readable through uniform bucket-level access configuration (no individual object ACLs needed)

## File Structure in GCS

```
lindle-docs/
├── {uuid1}.pdf
├── {uuid2}.docx
├── {uuid3}.txt
└── ...
```

## Security Considerations

- Files are stored with unique UUIDs to prevent enumeration
- **Uniform bucket-level access** is enabled for better security
- Public read access is configured at the bucket level
- Consider implementing signed URLs for more secure access in the future
- Review bucket permissions regularly
- Consider implementing lifecycle policies for automatic cleanup

## Troubleshooting

### Common Issues

1. **Authentication Error**: Check your service account key or run `gcloud auth application-default login`
2. **Bucket Not Found**: Ensure the bucket name is exactly "lindle-docs"
3. **Permission Denied**: Verify the service account has Storage Object Admin role
4. **API Not Enabled**: Enable the Cloud Storage API in your GCP project

### Testing

Use the provided test script:
```bash
python test_gcs.py
```

This will test:
- GCS connection
- File upload
- File URL generation
- File deletion (cleanup)

## API Endpoints

The following endpoints now save files to GCS:

- `POST /analyze` - Saves files for non-authenticated users
- `POST /analyze_with_user` - Saves files for authenticated users

Both endpoints return GCS file information in the response:

```json
{
  "summary": "...",
  "red_flags": [...],
  "pushbacks": [...],
  "gcs_file_path": "uuid-filename.pdf",
  "gcs_file_url": "https://storage.googleapis.com/lindle-docs/uuid-filename.pdf"
}
``` 