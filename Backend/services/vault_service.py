"""Vault service for managing personal clause vault data."""

import json
import os
import uuid
from datetime import datetime
from typing import List, Optional

from models.vault import VaultData, ContractorInfo, SharingSettings


# Data directory and file paths
DATA_DIR = "data"
VAULTS_FILE = os.path.join(DATA_DIR, "vaults.json")


def ensure_data_dir():
    """Ensure data directory exists."""
    os.makedirs(DATA_DIR, exist_ok=True)


def load_vaults() -> List[VaultData]:
    """Load all vaults from JSON file."""
    ensure_data_dir()
    if not os.path.exists(VAULTS_FILE):
        return []
    try:
        with open(VAULTS_FILE, 'r') as f:
            data = json.load(f)
            return [VaultData(**vault) for vault in data]
    except Exception:
        return []


def save_vaults(vaults: List[VaultData]):
    """Save vaults to JSON file."""
    ensure_data_dir()
    with open(VAULTS_FILE, 'w') as f:
        json.dump([vault.model_dump() for vault in vaults], f, indent=2)


def get_vault_by_user_id(user_id: str) -> Optional[VaultData]:
    """Get vault data for a specific user."""
    vaults = load_vaults()
    for vault in vaults:
        if vault.user_id == user_id:
            return vault
    return None


def create_or_update_vault(
    user_id: str,
    stake: Optional[str] = None,
    availability: Optional[str] = None,
    potential_contractors: Optional[List[ContractorInfo]] = None,
    sharing_settings: Optional[SharingSettings] = None
) -> VaultData:
    """Create a new vault or update existing one for a user."""
    vaults = load_vaults()
    existing_vault = None
    vault_index = -1
    
    # Find existing vault for this user
    for i, vault in enumerate(vaults):
        if vault.user_id == user_id:
            existing_vault = vault
            vault_index = i
            break
    
    current_time = datetime.now().isoformat()
    
    if existing_vault:
        # Update existing vault
        updated_vault = VaultData(
            user_id=user_id,
            stake=stake if stake is not None else existing_vault.stake,
            availability=availability if availability is not None else existing_vault.availability,
            potential_contractors=potential_contractors if potential_contractors is not None else existing_vault.potential_contractors,
            sharing_settings=sharing_settings if sharing_settings is not None else existing_vault.sharing_settings,
            created_at=existing_vault.created_at,
            updated_at=current_time
        )
        vaults[vault_index] = updated_vault
    else:
        # Create new vault
        updated_vault = VaultData(
            user_id=user_id,
            stake=stake or "",
            availability=availability or "",
            potential_contractors=potential_contractors or [],
            sharing_settings=sharing_settings or SharingSettings(),
            created_at=current_time,
            updated_at=current_time
        )
        vaults.append(updated_vault)
    
    save_vaults(vaults)
    return updated_vault


def get_accessible_vaults(user_id: Optional[str] = None) -> List[VaultData]:
    """Get vaults that are accessible to a user (public + shared with user + own)."""
    vaults = load_vaults()
    accessible_vaults = []
    
    for vault in vaults:
        # Public vaults are accessible to everyone
        if vault.sharing_settings.is_public:
            accessible_vaults.append(vault)
        # User's own vault
        elif user_id and vault.user_id == user_id:
            accessible_vaults.append(vault)
        # Vaults shared with the user
        elif user_id and user_id in vault.sharing_settings.shared_with_users:
            accessible_vaults.append(vault)
    
    return accessible_vaults


def delete_vault(user_id: str) -> bool:
    """Delete a user's vault."""
    vaults = load_vaults()
    original_count = len(vaults)
    vaults = [vault for vault in vaults if vault.user_id != user_id]
    
    if len(vaults) < original_count:
        save_vaults(vaults)
        return True
    return False