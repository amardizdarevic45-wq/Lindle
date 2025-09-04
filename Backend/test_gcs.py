#!/usr/bin/env python3
"""
Test script for Google Cloud Storage service.
Run this to verify GCS connectivity and file upload functionality.
"""

import os
from services.gcs_service import gcs_service

def test_gcs_connection():
    """Test GCS connection and basic functionality."""
    print("Testing Google Cloud Storage connection...")
    
    if not gcs_service.client:
        print("❌ GCS client not initialized")
        return False
    
    if not gcs_service.bucket:
        print("❌ GCS bucket not accessible")
        return False
    
    print("✅ GCS connection successful")
    print(f"Bucket: {gcs_service.bucket_name}")
    return True

def test_file_upload():
    """Test file upload functionality."""
    print("\nTesting file upload...")
    
    # Create a test file content
    test_content = b"This is a test file content for GCS upload testing."
    test_filename = "test_file.txt"
    
    # Upload the test file
    gcs_path = gcs_service.upload_file(
        file_content=test_content,
        file_name=test_filename,
        content_type="text/plain"
    )
    
    if gcs_path:
        print(f"✅ File uploaded successfully: {gcs_path}")
        
        # Get the file URL
        file_url = gcs_service.get_file_url(gcs_path)
        if file_url:
            print(f"✅ File URL: {file_url}")
        else:
            print("❌ Could not get file URL")
        
        # Clean up - delete the test file
        if gcs_service.delete_file(gcs_path):
            print(f"✅ Test file deleted: {gcs_path}")
        else:
            print(f"❌ Could not delete test file: {gcs_path}")
        
        return True
    else:
        print("❌ File upload failed")
        return False

def main():
    """Main test function."""
    print("=" * 50)
    print("Google Cloud Storage Service Test")
    print("=" * 50)
    
    # Test connection
    if not test_gcs_connection():
        print("\n❌ GCS connection test failed. Please check your credentials.")
        return
    
    # Test file upload
    if test_file_upload():
        print("\n✅ All tests passed!")
    else:
        print("\n❌ File upload test failed.")
    
    print("\n" + "=" * 50)

if __name__ == "__main__":
    main() 