"""Tests for vault models."""

import pytest
from models.vault import VaultData, ContractorInfo, SharingSettings, VaultCreateRequest, VaultResponse
from datetime import datetime


def test_contractor_info_creation():
    """Test ContractorInfo model creation."""
    contractor = ContractorInfo(
        name="John Doe",
        contact_info="john@example.com",
        specialization="Web Development",
        notes="Experienced developer"
    )
    assert contractor.name == "John Doe"
    assert contractor.contact_info == "john@example.com"
    assert contractor.specialization == "Web Development"
    assert contractor.notes == "Experienced developer"


def test_contractor_info_minimal():
    """Test ContractorInfo with minimal required fields."""
    contractor = ContractorInfo(name="Jane Smith")
    assert contractor.name == "Jane Smith"
    assert contractor.contact_info is None
    assert contractor.specialization is None
    assert contractor.notes is None


def test_sharing_settings_default():
    """Test SharingSettings with default values."""
    settings = SharingSettings()
    assert settings.is_public == False
    assert settings.shared_with_users == []


def test_sharing_settings_custom():
    """Test SharingSettings with custom values."""
    settings = SharingSettings(
        is_public=True,
        shared_with_users=["user1", "user2"]
    )
    assert settings.is_public == True
    assert settings.shared_with_users == ["user1", "user2"]


def test_vault_data_creation():
    """Test VaultData model creation."""
    contractor = ContractorInfo(name="Test Contractor")
    sharing = SharingSettings(is_public=True)
    created_time = datetime.now().isoformat()
    
    vault = VaultData(
        user_id="test_user_123",
        stake="High stakes project",
        availability="Available Mon-Fri",
        potential_contractors=[contractor],
        sharing_settings=sharing,
        created_at=created_time,
        updated_at=created_time
    )
    
    assert vault.user_id == "test_user_123"
    assert vault.stake == "High stakes project"
    assert vault.availability == "Available Mon-Fri"
    assert len(vault.potential_contractors) == 1
    assert vault.potential_contractors[0].name == "Test Contractor"
    assert vault.sharing_settings.is_public == True
    assert vault.created_at == created_time
    assert vault.updated_at == created_time


def test_vault_create_request():
    """Test VaultCreateRequest model."""
    contractor = ContractorInfo(name="Freelancer")
    sharing = SharingSettings(shared_with_users=["user1"])
    
    request = VaultCreateRequest(
        stake="Medium stakes",
        availability="Part-time",
        potential_contractors=[contractor],
        sharing_settings=sharing
    )
    
    assert request.stake == "Medium stakes"
    assert request.availability == "Part-time"
    assert len(request.potential_contractors) == 1
    assert request.sharing_settings.shared_with_users == ["user1"]


def test_vault_response():
    """Test VaultResponse model."""
    created_time = datetime.now().isoformat()
    vault = VaultData(
        user_id="user123",
        created_at=created_time,
        updated_at=created_time
    )
    
    response = VaultResponse(vault=vault, message="Success")
    assert response.vault.user_id == "user123"
    assert response.success == True
    assert response.message == "Success"