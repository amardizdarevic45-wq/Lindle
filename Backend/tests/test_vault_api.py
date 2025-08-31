"""Integration tests for vault API endpoints."""

import pytest
import tempfile
import os
from unittest.mock import patch
from fastapi.testclient import TestClient

from main import app


# Mock the vault service to use a temporary directory
@pytest.fixture
def client_with_temp_data():
    """Create test client with temporary data directory."""
    with tempfile.TemporaryDirectory() as tmp_dir:
        with patch('services.vault_service.DATA_DIR', tmp_dir):
            with patch('services.vault_service.VAULTS_FILE', os.path.join(tmp_dir, 'vaults.json')):
                with TestClient(app) as client:
                    yield client


def test_get_empty_vault(client_with_temp_data):
    """Test getting a vault for a user that doesn't exist yet."""
    response = client_with_temp_data.get("/vault/test_user")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] == True
    assert data["vault"]["user_id"] == "test_user"
    assert data["vault"]["stake"] == ""  # Empty string for new vault
    assert data["vault"]["availability"] == ""
    assert data["vault"]["potential_contractors"] == []


def test_create_vault(client_with_temp_data):
    """Test creating a new vault."""
    vault_data = {
        "stake": "High stakes project",
        "availability": "Available 40 hours/week",
        "potential_contractors": [
            {
                "name": "John Doe",
                "contact_info": "john@example.com",
                "specialization": "Web Development",
                "notes": "Experienced developer"
            }
        ],
        "sharing_settings": {
            "is_public": False,
            "shared_with_users": ["user2", "user3"]
        }
    }
    
    response = client_with_temp_data.post("/vault/test_user", json=vault_data)
    assert response.status_code == 200
    
    data = response.json()
    assert data["success"] == True
    assert data["message"] == "Vault updated successfully"
    assert data["vault"]["user_id"] == "test_user"
    assert data["vault"]["stake"] == "High stakes project"
    assert data["vault"]["availability"] == "Available 40 hours/week"
    assert len(data["vault"]["potential_contractors"]) == 1
    assert data["vault"]["potential_contractors"][0]["name"] == "John Doe"
    assert data["vault"]["sharing_settings"]["is_public"] == False
    assert data["vault"]["sharing_settings"]["shared_with_users"] == ["user2", "user3"]


def test_update_vault(client_with_temp_data):
    """Test updating an existing vault."""
    # Create initial vault
    initial_data = {
        "stake": "Initial stake",
        "availability": "Initial availability",
        "sharing_settings": {"is_public": False}
    }
    
    response1 = client_with_temp_data.post("/vault/update_user", json=initial_data)
    assert response1.status_code == 200
    
    # Update the vault
    update_data = {
        "stake": "Updated stake",
        "potential_contractors": [
            {"name": "New Contractor"}
        ]
    }
    
    response2 = client_with_temp_data.post("/vault/update_user", json=update_data)
    assert response2.status_code == 200
    
    data = response2.json()
    assert data["vault"]["stake"] == "Updated stake"
    assert data["vault"]["availability"] == "Initial availability"  # Should remain unchanged
    assert len(data["vault"]["potential_contractors"]) == 1
    assert data["vault"]["potential_contractors"][0]["name"] == "New Contractor"


def test_get_accessible_vaults(client_with_temp_data):
    """Test getting accessible vaults."""
    # Create a public vault
    public_vault_data = {
        "stake": "Public project",
        "sharing_settings": {"is_public": True}
    }
    client_with_temp_data.post("/vault/public_user", json=public_vault_data)
    
    # Create a private vault
    private_vault_data = {
        "stake": "Private project",
        "sharing_settings": {"is_public": False}
    }
    client_with_temp_data.post("/vault/private_user", json=private_vault_data)
    
    # Create a shared vault
    shared_vault_data = {
        "stake": "Shared project",
        "sharing_settings": {
            "is_public": False,
            "shared_with_users": ["target_user"]
        }
    }
    client_with_temp_data.post("/vault/shared_user", json=shared_vault_data)
    
    # Get accessible vaults for target_user
    response = client_with_temp_data.get("/vault/?user_id=target_user")
    assert response.status_code == 200
    
    data = response.json()
    assert data["success"] == True
    assert data["total"] == 2  # Public and shared vaults
    
    user_ids = [vault["user_id"] for vault in data["vaults"]]
    assert "public_user" in user_ids
    assert "shared_user" in user_ids
    assert "private_user" not in user_ids


def test_update_vault_sharing(client_with_temp_data):
    """Test updating vault sharing settings."""
    # Create a vault first
    vault_data = {"stake": "Test project"}
    client_with_temp_data.post("/vault/share_user", json=vault_data)
    
    # Update sharing settings
    sharing_data = {
        "is_public": True,
        "shared_with_users": ["user1", "user2"]
    }
    
    response = client_with_temp_data.put("/vault/share_user/share", json=sharing_data)
    assert response.status_code == 200
    
    data = response.json()
    assert data["success"] == True
    assert data["message"] == "Sharing settings updated successfully"
    assert data["vault"]["sharing_settings"]["is_public"] == True
    assert data["vault"]["sharing_settings"]["shared_with_users"] == ["user1", "user2"]


def test_delete_vault(client_with_temp_data):
    """Test deleting a vault."""
    # Create a vault first
    vault_data = {"stake": "To be deleted"}
    client_with_temp_data.post("/vault/delete_user", json=vault_data)
    
    # Delete the vault
    response = client_with_temp_data.delete("/vault/delete_user")
    assert response.status_code == 200
    
    data = response.json()
    assert data["success"] == True
    assert data["message"] == "Vault deleted successfully"
    
    # Try to delete again (should fail)
    response2 = client_with_temp_data.delete("/vault/delete_user")
    assert response2.status_code == 404
    assert "Vault not found" in response2.json()["detail"]