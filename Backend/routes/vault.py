"""Vault API endpoints for personal clause vault functionality."""

from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List

from models.vault import (
    VaultCreateRequest, VaultResponse, VaultListResponse, SharingSettings,
    ClauseCreateRequest, ClauseUpdateRequest, ClauseResponse,
    CategoryCreateRequest, CategoryUpdateRequest, CategoryResponse,
    PreferenceLevel
)
from services.vault_service import (
    get_vault_by_user_id,
    create_or_update_vault,
    get_accessible_vaults,
    delete_vault,
    add_category_to_vault,
    update_category,
    delete_category,
    add_clause_to_category,
    update_clause,
    delete_clause,
    search_clauses
)

router = APIRouter(prefix="/vault", tags=["Vault"])


# Vault management endpoints
@router.get("/{user_id}", response_model=VaultResponse)
async def get_user_vault(user_id: str):
    """Get vault data for a specific user."""
    vault = get_vault_by_user_id(user_id)
    if not vault:
        # Create empty vault with default categories if none exists
        vault = create_or_update_vault(user_id)
    
    return VaultResponse(vault=vault)


@router.post("/{user_id}", response_model=VaultResponse)
async def create_or_update_user_vault(user_id: str, request: VaultCreateRequest):
    """Create or update vault data for a user."""
    try:
        vault = create_or_update_vault(
            user_id=user_id,
            clause_categories=request.clause_categories,
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


# Category management endpoints
@router.post("/{user_id}/categories", response_model=CategoryResponse)
async def create_category(user_id: str, request: CategoryCreateRequest):
    """Add a new category to a user's vault."""
    try:
        category = add_category_to_vault(user_id, request)
        return CategoryResponse(category=category, message="Category created successfully")
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create category: {str(e)}")


@router.put("/{user_id}/categories/{category_id}", response_model=CategoryResponse)
async def update_category_endpoint(user_id: str, category_id: str, request: CategoryUpdateRequest):
    """Update an existing category in a user's vault."""
    try:
        category = update_category(user_id, category_id, request)
        return CategoryResponse(category=category, message="Category updated successfully")
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update category: {str(e)}")


@router.delete("/{user_id}/categories/{category_id}")
async def delete_category_endpoint(user_id: str, category_id: str):
    """Delete a category from a user's vault."""
    try:
        success = delete_category(user_id, category_id)
        if success:
            return {"success": True, "message": "Category deleted successfully"}
        else:
            raise HTTPException(status_code=404, detail="Category not found")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete category: {str(e)}")


# Clause management endpoints
@router.post("/{user_id}/categories/{category_id}/clauses", response_model=ClauseResponse)
async def create_clause(user_id: str, category_id: str, request: ClauseCreateRequest):
    """Add a new clause to a category in a user's vault."""
    try:
        clause = add_clause_to_category(user_id, category_id, request)
        return ClauseResponse(clause=clause, message="Clause created successfully")
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create clause: {str(e)}")


@router.put("/{user_id}/categories/{category_id}/clauses/{clause_id}", response_model=ClauseResponse)
async def update_clause_endpoint(user_id: str, category_id: str, clause_id: str, request: ClauseUpdateRequest):
    """Update an existing clause in a user's vault."""
    try:
        clause = update_clause(user_id, category_id, clause_id, request)
        return ClauseResponse(clause=clause, message="Clause updated successfully")
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update clause: {str(e)}")


@router.delete("/{user_id}/categories/{category_id}/clauses/{clause_id}")
async def delete_clause_endpoint(user_id: str, category_id: str, clause_id: str):
    """Delete a clause from a category in a user's vault."""
    try:
        success = delete_clause(user_id, category_id, clause_id)
        if success:
            return {"success": True, "message": "Clause deleted successfully"}
        else:
            raise HTTPException(status_code=404, detail="Clause not found")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete clause: {str(e)}")


# Search endpoint
@router.get("/{user_id}/search")
async def search_clauses_endpoint(
    user_id: str,
    query: Optional[str] = Query(None, description="Search query for title and content"),
    tags: Optional[List[str]] = Query(None, description="Filter by tags"),
    preference_level: Optional[PreferenceLevel] = Query(None, description="Filter by preference level")
):
    """Search for clauses in a user's vault."""
    try:
        clauses = search_clauses(user_id, query or "", tags or [], preference_level)
        return {
            "clauses": clauses,
            "total": len(clauses),
            "success": True
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to search clauses: {str(e)}")