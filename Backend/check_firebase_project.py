#!/usr/bin/env python3
"""Script to check which Firebase project the backend is currently connected to."""

import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def check_current_firebase_project():
    """Check which Firebase project the current credentials are pointing to."""
    print("🔍 Checking Firebase project configuration...")
    
    # Check FIREBASE_ environment variables
    print("\n📋 FIREBASE Environment Variables:")
    firebase_vars = {
        'FIREBASE_API_KEY': os.getenv('FIREBASE_API_KEY'),
        'FIREBASE_AUTH_DOMAIN': os.getenv('FIREBASE_AUTH_DOMAIN'),
        'FIREBASE_PROJECT_ID': os.getenv('FIREBASE_PROJECT_ID'),
        'FIREBASE_STORAGE_BUCKET': os.getenv('FIREBASE_STORAGE_BUCKET'),
        'FIREBASE_MESSAGING_SENDER_ID': os.getenv('FIREBASE_MESSAGING_SENDER_ID'),
        'FIREBASE_APP_ID': os.getenv('FIREBASE_APP_ID'),
        'FIREBASE_MEASUREMENT_ID': os.getenv('FIREBASE_MEASUREMENT_ID'),
        'FIREBASE_SERVICE_ACCOUNT_PATH': os.getenv('FIREBASE_SERVICE_ACCOUNT_PATH')
    }
    
    for key, value in firebase_vars.items():
        if value:
            print(f"  {key}: {value}")
        else:
            print(f"  {key}: Not set")
    
    # Check service account file
    service_account_path = os.getenv('FIREBASE_SERVICE_ACCOUNT_PATH')
    if service_account_path:
        if os.path.exists(service_account_path):
            print(f"    ✅ Service account file exists")
        else:
            print(f"    ❌ Service account file does not exist")
    
    # Check if we can import and test Firebase
    try:
        print("\n🔥 Testing Firebase connection...")
        from services.firebase_service import db, get_firebase_config
        
        if db:
            print(f"  ✅ Firebase service initialized")
            
            # Try to get project ID
            try:
                project_id = db._client.project
                print(f"  🔍 Connected to project: {project_id}")
                
                config = get_firebase_config()
                expected_project = config.get('projectId')
                
                if expected_project and project_id == expected_project:
                    print(f"  ✅ CORRECT PROJECT: Connected to {expected_project}!")
                elif expected_project:
                    print(f"  ❌ WRONG PROJECT: Connected to {project_id}")
                    print(f"     Expected: {expected_project}")
                else:
                    print(f"  ⚠️  No expected project ID configured")
                    
            except Exception as e:
                print(f"  ⚠️  Could not determine project ID: {e}")
                
        else:
            print(f"  ❌ Firebase service not initialized")
            
    except ImportError as e:
        print(f"  ❌ Could not import Firebase service: {e}")
    except Exception as e:
        print(f"  ❌ Error testing Firebase: {e}")
    
    # Show expected configuration
    print(f"\n🎯 Expected Configuration:")
    print(f"  Project ID: cognispace")
    print(f"  Auth Domain: cognispace.firebaseapp.com")
    print(f"  Storage Bucket: cognispace.appspot.com")
    
    # Show how to fix
    print(f"\n🔧 To Fix (if wrong project):")
    print(f"  1. Create a .env file in the Backend directory")
    print(f"  2. Add only FIREBASE_ prefixed variables")
    print(f"  3. Set FIREBASE_SERVICE_ACCOUNT_PATH to your key file path")
    print(f"  4. Restart the backend server")
    
    # Check for .env file
    env_file = os.path.join(os.path.dirname(__file__), '.env')
    if os.path.exists(env_file):
        print(f"\n✅ .env file found at: {env_file}")
    else:
        print(f"\n❌ No .env file found at: {env_file}")
        print(f"   Create one with FIREBASE_ prefixed variables")

if __name__ == "__main__":
    check_current_firebase_project() 