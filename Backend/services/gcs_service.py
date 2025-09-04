"""Google Cloud Storage service for file operations."""

import os
from typing import Optional
from google.cloud import storage
from google.cloud.exceptions import NotFound
import uuid

class GCSService:
    def __init__(self):
        """Initialize Google Cloud Storage client."""
        try:
            # Use default credentials (for Google Cloud Run)
            # or service account key if specified
            service_account_path = os.getenv('GOOGLE_APPLICATION_CREDENTIALS')
            
            if service_account_path and os.path.exists(service_account_path):
                self.client = storage.Client.from_service_account_json(service_account_path)
            else:
                # Use default credentials (for Google Cloud Run)
                self.client = storage.Client()
            
            self.bucket_name = "lindle-docs"
            self.bucket = self.client.bucket(self.bucket_name)
            
        except Exception as e:
            print(f"Error initializing Google Cloud Storage: {e}")
            self.client = None
            self.bucket = None

    def upload_file(self, file_content: bytes, file_name: str, content_type: Optional[str] = None) -> Optional[str]:
        """
        Upload a file to Google Cloud Storage.
        
        Args:
            file_content: File content as bytes
            file_name: Original file name
            content_type: MIME type of the file
            
        Returns:
            GCS file path if successful, None otherwise
        """
        if not self.client or not self.bucket:
            print("Google Cloud Storage not initialized")
            return None
        
        try:
            # Generate unique ID for the file
            file_id = str(uuid.uuid4())
            
            # Get file extension from original filename
            file_extension = os.path.splitext(file_name)[1] if '.' in file_name else ''
            
            # Create GCS blob name with ID and extension
            blob_name = f"{file_id}{file_extension}"
            
            # Create blob and upload
            blob = self.bucket.blob(blob_name)
            
            # Set content type if provided
            if content_type:
                blob.content_type = content_type
            
            # Upload file content
            blob.upload_from_string(file_content)
            
            # Make the file publicly readable (optional, remove if not needed)
            blob.make_public()
            
            print(f"File uploaded successfully to GCS: {blob_name}")
            return blob_name
            
        except Exception as e:
            print(f"Error uploading file to GCS: {e}")
            return None

    def get_file_url(self, blob_name: str) -> Optional[str]:
        """
        Get the public URL for a file in GCS.
        
        Args:
            blob_name: Name of the blob in GCS
            
        Returns:
            Public URL if successful, None otherwise
        """
        if not self.client or not self.bucket:
            return None
        
        try:
            blob = self.bucket.blob(blob_name)
            return blob.public_url
        except Exception as e:
            print(f"Error getting file URL from GCS: {e}")
            return None

    def delete_file(self, blob_name: str) -> bool:
        """
        Delete a file from Google Cloud Storage.
        
        Args:
            blob_name: Name of the blob in GCS
            
        Returns:
            True if successful, False otherwise
        """
        if not self.client or not self.bucket:
            return False
        
        try:
            blob = self.bucket.blob(blob_name)
            blob.delete()
            print(f"File deleted successfully from GCS: {blob_name}")
            return True
        except NotFound:
            print(f"File not found in GCS: {blob_name}")
            return False
        except Exception as e:
            print(f"Error deleting file from GCS: {e}")
            return False

# Global instance
gcs_service = GCSService() 