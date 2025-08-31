"""Vault service for managing personal clause vault data."""

import json
import os
import uuid
from datetime import datetime
from typing import List, Optional

from models.vault import (
    VaultData, ClauseCategory, Clause, SharingSettings, 
    PreferenceLevel, ClauseCreateRequest, ClauseUpdateRequest,
    CategoryCreateRequest, CategoryUpdateRequest
)


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
    clause_categories: Optional[List[ClauseCategory]] = None,
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
            clause_categories=clause_categories if clause_categories is not None else existing_vault.clause_categories,
            sharing_settings=sharing_settings if sharing_settings is not None else existing_vault.sharing_settings,
            created_at=existing_vault.created_at,
            updated_at=current_time
        )
        vaults[vault_index] = updated_vault
    else:
        # Create new vault with default categories
        default_categories = _create_default_categories()
        updated_vault = VaultData(
            user_id=user_id,
            clause_categories=clause_categories or default_categories,
            sharing_settings=sharing_settings or SharingSettings(),
            created_at=current_time,
            updated_at=current_time
        )
        vaults.append(updated_vault)
    
    save_vaults(vaults)
    return updated_vault


def _create_default_categories() -> List[ClauseCategory]:
    """Create default clause categories for a new vault."""
    current_time = datetime.now().isoformat()
    
    default_categories = [
        ClauseCategory(
            id=str(uuid.uuid4()),
            name="Payment Terms",
            description="Clauses related to payment schedules, invoicing, and financial terms",
            clauses=[],
            created_at=current_time,
            updated_at=current_time
        ),
        ClauseCategory(
            id=str(uuid.uuid4()),
            name="Termination",
            description="Clauses related to contract termination conditions and procedures",
            clauses=[],
            created_at=current_time,
            updated_at=current_time
        ),
        ClauseCategory(
            id=str(uuid.uuid4()),
            name="Liability",
            description="Clauses related to liability limitations and indemnification",
            clauses=[],
            created_at=current_time,
            updated_at=current_time
        ),
        ClauseCategory(
            id=str(uuid.uuid4()),
            name="Intellectual Property",
            description="Clauses related to IP ownership, licensing, and protection",
            clauses=[],
            created_at=current_time,
            updated_at=current_time
        ),
        ClauseCategory(
            id=str(uuid.uuid4()),
            name="Confidentiality",
            description="Clauses related to non-disclosure and confidentiality",
            clauses=[],
            created_at=current_time,
            updated_at=current_time
        )
    ]
    
    return default_categories


def add_category_to_vault(user_id: str, request: CategoryCreateRequest) -> ClauseCategory:
    """Add a new category to a user's vault."""
    vault = get_vault_by_user_id(user_id)
    if not vault:
        raise ValueError("Vault not found for user")
    
    current_time = datetime.now().isoformat()
    new_category = ClauseCategory(
        id=str(uuid.uuid4()),
        name=request.name,
        description=request.description,
        clauses=[],
        created_at=current_time,
        updated_at=current_time
    )
    
    vault.clause_categories.append(new_category)
    vault.updated_at = current_time
    
    # Save the updated vault
    vaults = load_vaults()
    for i, v in enumerate(vaults):
        if v.user_id == user_id:
            vaults[i] = vault
            break
    
    save_vaults(vaults)
    return new_category


def update_category(user_id: str, category_id: str, request: CategoryUpdateRequest) -> ClauseCategory:
    """Update an existing category in a user's vault."""
    vault = get_vault_by_user_id(user_id)
    if not vault:
        raise ValueError("Vault not found for user")
    
    category = None
    for cat in vault.clause_categories:
        if cat.id == category_id:
            category = cat
            break
    
    if not category:
        raise ValueError("Category not found")
    
    current_time = datetime.now().isoformat()
    
    # Update category fields if provided
    if request.name is not None:
        category.name = request.name
    if request.description is not None:
        category.description = request.description
    
    category.updated_at = current_time
    vault.updated_at = current_time
    
    # Save the updated vault
    vaults = load_vaults()
    for i, v in enumerate(vaults):
        if v.user_id == user_id:
            vaults[i] = vault
            break
    
    save_vaults(vaults)
    return category


def delete_category(user_id: str, category_id: str) -> bool:
    """Delete a category from a user's vault."""
    vault = get_vault_by_user_id(user_id)
    if not vault:
        return False
    
    original_count = len(vault.clause_categories)
    vault.clause_categories = [cat for cat in vault.clause_categories if cat.id != category_id]
    
    if len(vault.clause_categories) < original_count:
        vault.updated_at = datetime.now().isoformat()
        
        # Save the updated vault
        vaults = load_vaults()
        for i, v in enumerate(vaults):
            if v.user_id == user_id:
                vaults[i] = vault
                break
        
        save_vaults(vaults)
        return True
    return False


def add_clause_to_category(user_id: str, category_id: str, request: ClauseCreateRequest) -> Clause:
    """Add a new clause to a category in a user's vault."""
    vault = get_vault_by_user_id(user_id)
    if not vault:
        raise ValueError("Vault not found for user")
    
    category = None
    for cat in vault.clause_categories:
        if cat.id == category_id:
            category = cat
            break
    
    if not category:
        raise ValueError("Category not found")
    
    current_time = datetime.now().isoformat()
    new_clause = Clause(
        id=str(uuid.uuid4()),
        title=request.title,
        content=request.content,
        tags=request.tags,
        preference_level=request.preference_level,
        created_at=current_time,
        updated_at=current_time
    )
    
    category.clauses.append(new_clause)
    category.updated_at = current_time
    vault.updated_at = current_time
    
    # Save the updated vault
    vaults = load_vaults()
    for i, v in enumerate(vaults):
        if v.user_id == user_id:
            vaults[i] = vault
            break
    
    save_vaults(vaults)
    return new_clause


def update_clause(user_id: str, category_id: str, clause_id: str, request: ClauseUpdateRequest) -> Clause:
    """Update an existing clause in a user's vault."""
    vault = get_vault_by_user_id(user_id)
    if not vault:
        raise ValueError("Vault not found for user")
    
    category = None
    for cat in vault.clause_categories:
        if cat.id == category_id:
            category = cat
            break
    
    if not category:
        raise ValueError("Category not found")
    
    clause = None
    for cl in category.clauses:
        if cl.id == clause_id:
            clause = cl
            break
    
    if not clause:
        raise ValueError("Clause not found")
    
    current_time = datetime.now().isoformat()
    
    # Update clause fields if provided
    if request.title is not None:
        clause.title = request.title
    if request.content is not None:
        clause.content = request.content
    if request.tags is not None:
        clause.tags = request.tags
    if request.preference_level is not None:
        clause.preference_level = request.preference_level
    
    clause.updated_at = current_time
    category.updated_at = current_time
    vault.updated_at = current_time
    
    # Save the updated vault
    vaults = load_vaults()
    for i, v in enumerate(vaults):
        if v.user_id == user_id:
            vaults[i] = vault
            break
    
    save_vaults(vaults)
    return clause


def delete_clause(user_id: str, category_id: str, clause_id: str) -> bool:
    """Delete a clause from a category in a user's vault."""
    vault = get_vault_by_user_id(user_id)
    if not vault:
        return False
    
    category = None
    for cat in vault.clause_categories:
        if cat.id == category_id:
            category = cat
            break
    
    if not category:
        return False
    
    original_count = len(category.clauses)
    category.clauses = [cl for cl in category.clauses if cl.id != clause_id]
    
    if len(category.clauses) < original_count:
        category.updated_at = datetime.now().isoformat()
        vault.updated_at = datetime.now().isoformat()
        
        # Save the updated vault
        vaults = load_vaults()
        for i, v in enumerate(vaults):
            if v.user_id == user_id:
                vaults[i] = vault
                break
        
        save_vaults(vaults)
        return True
    return False


def search_clauses(user_id: str, query: str = "", tags: List[str] = None, preference_level: PreferenceLevel = None) -> List[Clause]:
    """Search for clauses in a user's vault based on query, tags, or preference level."""
    vault = get_vault_by_user_id(user_id)
    if not vault:
        return []
    
    matching_clauses = []
    query_lower = query.lower() if query else ""
    
    for category in vault.clause_categories:
        for clause in category.clauses:
            # Check if clause matches the search criteria
            matches = True
            
            # Text search in title or content
            if query_lower:
                if (query_lower not in clause.title.lower() and 
                    query_lower not in clause.content.lower()):
                    matches = False
            
            # Tag filtering
            if tags and matches:
                clause_tags_lower = [tag.lower() for tag in clause.tags]
                for tag in tags:
                    if tag.lower() not in clause_tags_lower:
                        matches = False
                        break
            
            # Preference level filtering
            if preference_level and matches:
                if clause.preference_level != preference_level:
                    matches = False
            
            if matches:
                matching_clauses.append(clause)
    
    return matching_clauses


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