"""Vault models for personal clause vault functionality."""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from enum import Enum


class PreferenceLevel(str, Enum):
    """Enum for clause preference levels."""
    PREFERRED = "preferred"
    LESS_PREFERRED = "less_preferred"
    NEUTRAL = "neutral"


class Clause(BaseModel):
    """Model for individual contract clause."""
    id: str  # Unique identifier for the clause
    title: str  # User-given title (e.g., "NET 15", "NET 30 (PREFERRED)")
    content: str  # The actual clause text
    tags: List[str] = []  # Tags for easier search (e.g., ["payment", "invoicing"])
    preference_level: PreferenceLevel = PreferenceLevel.NEUTRAL
    created_at: str
    updated_at: str


class ClauseCategory(BaseModel):
    """Model for clause category (e.g., Payment Terms, Termination, etc.)."""
    id: str  # Unique identifier for the category
    name: str  # Category name (e.g., "Payment Terms", "Liability", "Termination")
    description: Optional[str] = None  # Optional description of the category
    clauses: List[Clause] = []  # List of clauses in this category
    created_at: str
    updated_at: str


class SharingSettings(BaseModel):
    """Model for vault sharing settings."""
    is_public: bool = False
    shared_with_users: List[str] = []  # List of user_ids who can access the vault


class VaultData(BaseModel):
    """Model for personal clause vault data."""
    user_id: str
    clause_categories: List[ClauseCategory] = []
    sharing_settings: SharingSettings = SharingSettings()
    created_at: str
    updated_at: str


class VaultCreateRequest(BaseModel):
    """Request model for creating/updating vault data."""
    clause_categories: List[ClauseCategory] = []
    sharing_settings: SharingSettings = SharingSettings()


class ClauseCreateRequest(BaseModel):
    """Request model for creating a new clause."""
    title: str
    content: str
    tags: List[str] = []
    preference_level: PreferenceLevel = PreferenceLevel.NEUTRAL


class ClauseUpdateRequest(BaseModel):
    """Request model for updating an existing clause."""
    title: Optional[str] = None
    content: Optional[str] = None
    tags: Optional[List[str]] = None
    preference_level: Optional[PreferenceLevel] = None


class CategoryCreateRequest(BaseModel):
    """Request model for creating a new category."""
    name: str
    description: Optional[str] = None


class CategoryUpdateRequest(BaseModel):
    """Request model for updating an existing category."""
    name: Optional[str] = None
    description: Optional[str] = None


class VaultResponse(BaseModel):
    """Response model for vault operations."""
    vault: VaultData
    success: bool = True
    message: Optional[str] = None


class ClauseResponse(BaseModel):
    """Response model for clause operations."""
    clause: Clause
    success: bool = True
    message: Optional[str] = None


class CategoryResponse(BaseModel):
    """Response model for category operations."""
    category: ClauseCategory
    success: bool = True
    message: Optional[str] = None


class VaultListResponse(BaseModel):
    """Response model for listing vaults."""
    vaults: List[VaultData]
    total: int
    success: bool = True