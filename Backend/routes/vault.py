"""Vault API endpoints for personal clause vault functionality."""

from fastapi import APIRouter, HTTPException, Query
from typing import Optional

from models.vault import VaultCreateRequest, VaultResponse, VaultListResponse, ContractorInfo, SharingSettings
from services.vault_service import (
    get_vault_by_user_id,
    create_or_update_vault,
    get_accessible_vaults,
    delete_vault
)

router = APIRouter(prefix="/vault", tags=["Vault"])


@router.get("/{user_id}", response_model=VaultResponse)
async def get_user_vault(user_id: str):
    """Get vault data for a specific user."""
    vault = get_vault_by_user_id(user_id)
    if not vault:
        # Return empty vault structure if none exists
        from datetime import datetime
        vault = create_or_update_vault(user_id)
    
    return VaultResponse(vault=vault)


@router.post("/{user_id}", response_model=VaultResponse)
async def create_or_update_user_vault(user_id: str, request: VaultCreateRequest):
    """Create or update vault data for a user."""
    try:
        vault = create_or_update_vault(
            user_id=user_id,
            stake=request.stake,
            availability=request.availability,
            potential_contractors=request.potential_contractors,
            sharing_settings=request.sharing_settings
        )
        return VaultResponse(vault=vault, message="Vault updated successfully")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update vault: {str(e)}")


@router.get("/", response_model=VaultListResponse)
async def get_accessible_vaults_endpoint(
    user_id: Optional[str] = Query(None, description="User ID to filter accessible vaults")
):
    """Get all vaults accessible to a user (public + shared + own)."""
    try:
        vaults = get_accessible_vaults(user_id)
        return VaultListResponse(vaults=vaults, total=len(vaults))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch vaults: {str(e)}")


@router.delete("/{user_id}")
async def delete_user_vault(user_id: str):
    """Delete a user's vault."""
    try:
        success = delete_vault(user_id)
        if success:
            return {"success": True, "message": "Vault deleted successfully"}
        else:
            raise HTTPException(status_code=404, detail="Vault not found")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete vault: {str(e)}")


@router.put("/{user_id}/share")
async def update_vault_sharing(user_id: str, sharing_settings: SharingSettings):
    """Update sharing settings for a user's vault."""
    try:
        vault = get_vault_by_user_id(user_id)
        if not vault:
            raise HTTPException(status_code=404, detail="Vault not found")
        
        updated_vault = create_or_update_vault(
            user_id=user_id,
            sharing_settings=sharing_settings
        )
        return VaultResponse(vault=updated_vault, message="Sharing settings updated successfully")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update sharing settings: {str(e)}")