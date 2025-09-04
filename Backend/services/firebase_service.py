"""Firebase service for Firestore database operations."""

import firebase_admin
from firebase_admin import credentials, firestore
from typing import List, Dict, Any, Optional
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Firebase project configuration from environment variables
def get_firebase_config():
    """Get Firebase configuration from environment variables."""
    return {
        "apiKey": os.getenv('FIREBASE_API_KEY'),
        "authDomain": os.getenv('FIREBASE_AUTH_DOMAIN'),
        "projectId": os.getenv('FIREBASE_PROJECT_ID'),
        "storageBucket": os.getenv('FIREBASE_STORAGE_BUCKET'),
        "messagingSenderId": os.getenv('FIREBASE_MESSAGING_SENDER_ID'),
        "appId": os.getenv('FIREBASE_APP_ID'),
        "measurementId": os.getenv('FIREBASE_MEASUREMENT_ID')
    }

# Initialize Firebase Admin SDK
def initialize_firebase():
    """Initialize Firebase Admin SDK with Cognispace project configuration."""
    try:
        # Check if already initialized
        if not firebase_admin._apps:
            # Get configuration from environment
            config = get_firebase_config()
            project_id = config.get('projectId', 'unknown')
            
            print(f"Initializing Firebase Admin SDK for project: {project_id}")
            
            # Use environment variable for service account key if available
            service_account_path = os.getenv('FIREBASE_SERVICE_ACCOUNT_PATH')
            
            if service_account_path and os.path.exists(service_account_path):
                print(f"Using service account key: {service_account_path}")
                cred = credentials.Certificate(service_account_path)
            else:
                print("No service account key found, using application default credentials")
                # Use default credentials (for Google Cloud Run)
                cred = credentials.ApplicationDefault()
            
            # Initialize with explicit project ID from environment
            firebase_admin.initialize_app(cred, {
                'projectId': project_id,
                'storageBucket': config.get('storageBucket')
            })
            
            print(f"✅ Firebase Admin SDK initialized for project: {project_id}")
        
        return firestore.client()
    except Exception as e:
        print(f"❌ Error initializing Firebase: {e}")
        config = get_firebase_config()
        print(f"Project ID: {config.get('projectId', 'unknown')}")
        return None

# Get Firestore client
db = initialize_firebase()

# Log Firebase initialization status
if db:
    print(f"✅ Firebase initialized successfully")
    print(f"Firebase db type: {type(db)}")
    
    # Verify we're connected to the right project
    try:
        # Get the project ID from the client to verify connection
        project_id = db._client.project
        print(f"🔍 Connected to Firebase project: {project_id}")
        
        config = get_firebase_config()
        if project_id == config.get('projectId'):
            print(f"✅ Successfully connected to Cognispace database!")
        else:
            print(f"⚠️  WARNING: Connected to different project: {project_id}")
            print(f"   Expected: {config.get('projectId')}")
            print(f"   This might cause data to be saved to the wrong database!")
            
    except Exception as e:
        print(f"⚠️  Could not verify project ID: {e}")
        
else:
    print(f"❌ Firebase initialization failed - db is None")
    print(f"This will prevent saving contracts to Firebase")

def get_user_contracts(user_id: str) -> List[Dict[str, Any]]:
    """Get all contracts for a specific user from Firestore."""
    if not db:
        return []
    
    try:
        contracts_ref = db.collection('contracts')
        query = contracts_ref.where('userId', '==', user_id)
        docs = query.stream()
        
        contracts = []
        for doc in docs:
            contract_data = doc.to_dict()
            contract_data['id'] = doc.id
            contracts.append(contract_data)
        
        return contracts
    except Exception as e:
        print(f"Error fetching user contracts from Firestore: {e}")
        return []

def get_user_stats(user_id: str) -> Dict[str, Any]:
    """Calculate user statistics from Firestore contracts."""
    contracts = get_user_contracts(user_id)
    
    if not contracts:
        return {
            "totalContracts": 0,
            "pendingContracts": 0,
            "successfulContracts": 0,
            "averageScore": 0
        }
    
    # Calculate statistics based on the same structure as My Contracts page
    total_contracts = len(contracts)
    
    # Count contracts by status (matching My Contracts page structure)
    pending_contracts = len([c for c in contracts if c.get('status') in ['draft', 'negotiating']])
    successful_contracts = len([c for c in contracts if c.get('status') == 'completed'])
    
    # Calculate average score (based on red flags and pushbacks)
    total_score = 0
    scored_contracts = 0
    
    for contract in contracts:
        # Use the same field names as My Contracts page
        red_flags = len(contract.get('redFlags', []))
        pushbacks = len(contract.get('pushbacks', []))
        
        # Simple scoring: fewer red flags and pushbacks = higher score
        # Base score of 100, subtract points for issues
        score = 100 - (red_flags * 5) - (pushbacks * 3)
        score = max(0, score)  # Don't go below 0
        
        total_score += score
        scored_contracts += 1
    
    average_score = round(total_score / scored_contracts, 1) if scored_contracts > 0 else 0
    
    # Count contracts by each status
    draft_contracts = len([c for c in contracts if c.get('status') == 'draft'])
    negotiating_contracts = len([c for c in contracts if c.get('status') == 'negotiating'])
    signed_in_contracts = len([c for c in contracts if c.get('status') == 'signed in'])
    in_progress_contracts = len([c for c in contracts if c.get('status') == 'in progress'])
    completed_contracts = len([c for c in contracts if c.get('status') == 'completed'])
    
    return {
        "totalContracts": total_contracts,
        "pendingContracts": pending_contracts,
        "successfulContracts": successful_contracts,
        "averageScore": average_score,
        "draftContracts": draft_contracts,
        "negotiatingContracts": negotiating_contracts,
        "signedInContracts": signed_in_contracts,
        "inProgressContracts": in_progress_contracts,
        "completedContracts": completed_contracts
    } 