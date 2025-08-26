"""Vault models for personal clause vault functionality."""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel


class ContractorInfo(BaseModel):
    """Model for potential contractor information."""
    name: str
    contact_info: Optional[str] = None
    specialization: Optional[str] = None
    notes: Optional[str] = None


class SharingSettings(BaseModel):
    """Model for vault sharing settings."""
    is_public: bool = False
    shared_with_users: List[str] = []  # List of user_ids who can access the vault


class VaultData(BaseModel):
    """Model for personal clause vault data."""
    user_id: str
    stake: Optional[str] = None  # Information about stakes/investments
    availability: Optional[str] = None  # Availability information
    potential_contractors: List[ContractorInfo] = []
    sharing_settings: SharingSettings = SharingSettings()
    created_at: str
    updated_at: str


class VaultCreateRequest(BaseModel):
    """Request model for creating/updating vault data."""
    stake: Optional[str] = None
    availability: Optional[str] = None
    potential_contractors: List[ContractorInfo] = []
    sharing_settings: SharingSettings = SharingSettings()


class VaultResponse(BaseModel):
    """Response model for vault operations."""
    vault: VaultData
    success: bool = True
    message: Optional[str] = None


class VaultListResponse(BaseModel):
    """Response model for listing vaults."""
    vaults: List[VaultData]
    total: int
    success: bool = True