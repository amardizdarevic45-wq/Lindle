"""Google Cloud Storage service for file operations."""

import os
from typing import Optional, Union
from google.cloud import storage
from google.cloud.exceptions import NotFound
import uuid
from fastapi import UploadFile

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

    def upload_file(self, file_content: Union[bytes, UploadFile], file_name: str = None, content_type: Optional[str] = None) -> Optional[str]:
        """
        Upload a file to Google Cloud Storage.
        
        Args:
            file_content: File content as bytes or UploadFile object
            file_name: Original file name (optional if using UploadFile)
            content_type: MIME type of the file (optional if using UploadFile)
            
        Returns:
            GCS file path if successful, None otherwise
        """
        if not self.client or not self.bucket:
            print("Google Cloud Storage not initialized")
            return None
        
        try:
            # Handle UploadFile object
            if isinstance(file_content, UploadFile):
                # Get file info from UploadFile
                if not file_name:
                    file_name = file_content.filename
                if not content_type:
                    content_type = file_content.content_type
                
                # Read file content and convert to bytes
                file_bytes = file_content.file.read()
                # Reset file pointer for potential future reads
                file_content.file.seek(0)
                print(f"Read {len(file_bytes)} bytes from UploadFile")
            else:
                # Handle bytes input
                file_bytes = file_content
                if not file_name:
                    file_name = "unknown_file"
            
            # Generate unique ID for the file
            file_id = str(uuid.uuid4())
            
            # Get file extension from original filename
            file_extension = os.path.splitext(file_name)[1] if '.' in file_name else ''
            
            # Create GCS blob name with ID and extension
            blob_name = f"{file_id}{file_extension}"
            
            # Create blob and upload
            blob = self.bucket.blob(blob_name)
            
            # Set content type if provided, otherwise try to infer from extension
            if content_type:
                blob.content_type = content_type
                print(f"Using provided content type: {content_type}")
            else:
                # Infer content type from file extension
                inferred_type = self._infer_content_type(file_extension)
                if inferred_type:
                    blob.content_type = inferred_type
                    print(f"Using inferred content type: {inferred_type}")
                else:
                    print(f"Could not infer content type for extension: {file_extension}")
            
            print(f"Final blob content type before upload: {blob.content_type}")
            print(f"File extension: {file_extension}")
            print(f"Original filename: {file_name}")
            
            # Upload file content with explicit content type to avoid mismatch
            blob.upload_from_string(
                file_bytes, 
                content_type=blob.content_type
            )
            
            # Make the file publicly readable (optional, remove if not needed)
            blob.make_public()
            
            print(f"File uploaded successfully to GCS: {blob_name}")
            print(f"Content-Type: {blob.content_type}")
            print(f"File size: {len(file_bytes)} bytes")
            return blob_name
            
        except Exception as e:
            print(f"Error uploading file to GCS: {e}")
            print(f"File content type: {type(file_content)}")
            if isinstance(file_content, UploadFile):
                print(f"UploadFile filename: {file_content.filename}")
                print(f"UploadFile content_type: {file_content.content_type}")
            return None

    def _infer_content_type(self, file_extension: str) -> Optional[str]:
        """Infer content type from file extension."""
        content_types = {
            '.pdf': 'application/pdf',
            '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            '.doc': 'application/msword',
            '.txt': 'text/plain',
            '.rtf': 'application/rtf',
            '.odt': 'application/vnd.oasis.opendocument.text',
            '.html': 'text/html',
            '.htm': 'text/html',
        }
        return content_types.get(file_extension.lower())

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