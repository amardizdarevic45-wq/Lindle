"""Tests for vault service functionality."""

import pytest
import os
import tempfile
import json
from datetime import datetime
from unittest.mock import patch

from services.vault_service import (
    load_vaults, save_vaults, get_vault_by_user_id,
    create_or_update_vault, get_accessible_vaults, delete_vault,
    VAULTS_FILE, DATA_DIR
)
from models.vault import VaultData, ContractorInfo, SharingSettings


@pytest.fixture
def temp_data_dir():
    """Create a temporary directory for testing."""
    with tempfile.TemporaryDirectory() as tmp_dir:
        with patch('services.vault_service.DATA_DIR', tmp_dir):
            with patch('services.vault_service.VAULTS_FILE', os.path.join(tmp_dir, 'vaults.json')):
                yield tmp_dir


def test_load_vaults_empty_file(temp_data_dir):
    """Test loading vaults when file doesn't exist."""
    vaults = load_vaults()
    assert vaults == []


def test_save_and_load_vaults(temp_data_dir):
    """Test saving and loading vaults."""
    created_time = datetime.now().isoformat()
    vault = VaultData(
        user_id="test_user",
        stake="Test stake",
        availability="Available",
        potential_contractors=[],
        sharing_settings=SharingSettings(),
        created_at=created_time,
        updated_at=created_time
    )
    
    # Save vaults
    save_vaults([vault])
    
    # Load vaults
    loaded_vaults = load_vaults()
    assert len(loaded_vaults) == 1
    assert loaded_vaults[0].user_id == "test_user"
    assert loaded_vaults[0].stake == "Test stake"


def test_get_vault_by_user_id(temp_data_dir):
    """Test getting vault by user ID."""
    created_time = datetime.now().isoformat()
    vault1 = VaultData(
        user_id="user1",
        stake="Stake 1",
        created_at=created_time,
        updated_at=created_time
    )
    vault2 = VaultData(
        user_id="user2", 
        stake="Stake 2",
        created_at=created_time,
        updated_at=created_time
    )
    
    save_vaults([vault1, vault2])
    
    # Test existing user
    found_vault = get_vault_by_user_id("user1")
    assert found_vault is not None
    assert found_vault.user_id == "user1"
    assert found_vault.stake == "Stake 1"
    
    # Test non-existing user
    not_found = get_vault_by_user_id("user999")
    assert not_found is None


def test_create_new_vault(temp_data_dir):
    """Test creating a new vault."""
    contractor = ContractorInfo(name="Test Contractor")
    sharing = SharingSettings(is_public=True)
    
    vault = create_or_update_vault(
        user_id="new_user",
        stake="New stake",
        availability="New availability",
        potential_contractors=[contractor],
        sharing_settings=sharing
    )
    
    assert vault.user_id == "new_user"
    assert vault.stake == "New stake"
    assert vault.availability == "New availability"
    assert len(vault.potential_contractors) == 1
    assert vault.potential_contractors[0].name == "Test Contractor"
    assert vault.sharing_settings.is_public == True
    assert vault.created_at is not None
    assert vault.updated_at is not None


def test_update_existing_vault(temp_data_dir):
    """Test updating an existing vault."""
    # Create initial vault
    initial_vault = create_or_update_vault(
        user_id="update_user",
        stake="Initial stake",
        availability="Initial availability"
    )
    
    # Update the vault
    updated_vault = create_or_update_vault(
        user_id="update_user",
        stake="Updated stake"
        # Don't update availability to test partial updates
    )
    
    assert updated_vault.user_id == "update_user"
    assert updated_vault.stake == "Updated stake"
    assert updated_vault.availability == "Initial availability"  # Should remain unchanged
    assert updated_vault.created_at == initial_vault.created_at  # Should remain the same
    assert updated_vault.updated_at != initial_vault.updated_at  # Should be updated


def test_get_accessible_vaults(temp_data_dir):
    """Test getting accessible vaults based on sharing settings."""
    created_time = datetime.now().isoformat()
    
    # Public vault
    public_vault = VaultData(
        user_id="public_user",
        stake="Public stake",
        sharing_settings=SharingSettings(is_public=True),
        created_at=created_time,
        updated_at=created_time
    )
    
    # Private vault
    private_vault = VaultData(
        user_id="private_user",
        stake="Private stake", 
        sharing_settings=SharingSettings(is_public=False),
        created_at=created_time,
        updated_at=created_time
    )
    
    # Shared vault
    shared_vault = VaultData(
        user_id="shared_user",
        stake="Shared stake",
        sharing_settings=SharingSettings(is_public=False, shared_with_users=["target_user"]),
        created_at=created_time,
        updated_at=created_time
    )
    
    save_vaults([public_vault, private_vault, shared_vault])
    
    # Test access for target_user
    accessible = get_accessible_vaults("target_user")
    accessible_user_ids = [v.user_id for v in accessible]
    
    assert "public_user" in accessible_user_ids  # Public vault accessible
    assert "shared_user" in accessible_user_ids  # Shared vault accessible
    assert "private_user" not in accessible_user_ids  # Private vault not accessible
    
    # Test access without user_id (only public vaults)
    public_only = get_accessible_vaults()
    public_user_ids = [v.user_id for v in public_only]
    assert public_user_ids == ["public_user"]


def test_delete_vault(temp_data_dir):
    """Test deleting a vault."""
    created_time = datetime.now().isoformat()
    vault1 = VaultData(
        user_id="user1",
        stake="Stake 1",
        created_at=created_time,
        updated_at=created_time
    )
    vault2 = VaultData(
        user_id="user2",
        stake="Stake 2",
        created_at=created_time,
        updated_at=created_time
    )
    
    save_vaults([vault1, vault2])
    
    # Delete one vault
    success = delete_vault("user1")
    assert success == True
    
    # Check remaining vaults
    remaining = load_vaults()
    assert len(remaining) == 1
    assert remaining[0].user_id == "user2"
    
    # Try to delete non-existent vault
    no_success = delete_vault("non_existent_user")
    assert no_success == False