"""Models for Document Access Approval API integration."""

from datetime import datetime
from enum import Enum
from typing import List, Optional
from pydantic import BaseModel


class AccessRequestStatus(str, Enum):
    """Status of an access request."""
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class User(BaseModel):
    """User model for Document Access API."""
    id: int
    name: str
    email: str
    role: Optional[str] = None
    created_at: Optional[datetime] = None


class Document(BaseModel):
    """Document model for Document Access API."""
    id: int
    title: str
    description: Optional[str] = None
    owner_id: int
    created_at: Optional[datetime] = None
    file_type: Optional[str] = None
    file_size: Optional[int] = None


class AccessRequest(BaseModel):
    """Access request model for Document Access API."""
    id: int
    user_id: int
    document_id: int
    status: AccessRequestStatus
    reason: Optional[str] = None
    requested_at: datetime
    decided_at: Optional[datetime] = None
    decided_by: Optional[int] = None
    decision_reason: Optional[str] = None
    
    # Related objects (populated by service layer)
    user: Optional[User] = None
    document: Optional[Document] = None
    approver: Optional[User] = None


class CreateAccessRequestRequest(BaseModel):
    """Request to create a new access request."""
    document_id: int
    reason: Optional[str] = None


class AccessRequestDecisionRequest(BaseModel):
    """Request to make a decision on an access request."""
    decision: AccessRequestStatus  # approve or reject
    reason: Optional[str] = None


# Response models
class AccessRequestResponse(BaseModel):
    """Response for access request operations."""
    access_request: AccessRequest
    success: bool = True
    message: Optional[str] = None


class AccessRequestListResponse(BaseModel):
    """Response for listing access requests."""
    access_requests: List[AccessRequest]
    total: int
    success: bool = True
    message: Optional[str] = None


class DocumentListResponse(BaseModel):
    """Response for listing documents."""
    documents: List[Document]
    total: int
    success: bool = True
    message: Optional[str] = None


class UserListResponse(BaseModel):
    """Response for listing users."""
    users: List[User]
    total: int
    success: bool = True
    message: Optional[str] = None