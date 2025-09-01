"""API routes for Document Access Approval functionality."""

from fastapi import APIRouter, HTTPException, Query, Path
from typing import List, Optional
import httpx

from models.access_approval import (
    AccessRequest, Document, User, CreateAccessRequestRequest, 
    AccessRequestDecisionRequest, AccessRequestResponse,
    AccessRequestListResponse, DocumentListResponse, UserListResponse
)
from services.document_access_service import DocumentAccessService
from services.mock_document_access_service import MockDocumentAccessService

router = APIRouter(prefix="/access-approval")


async def get_service():
    """Get the appropriate service (real or mock) based on availability."""
    try:
        # Try to connect to the external API first
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get("https://daas-backend-946555989276.europe-central2.run.app/api/Documents")
            response.raise_for_status()
        return DocumentAccessService()
    except (httpx.HTTPError, httpx.ConnectError, httpx.TimeoutException):
        # If external API is not available, use mock service
        return MockDocumentAccessService()


@router.get("/access-requests", response_model=AccessRequestListResponse)
async def get_access_requests(
    pending_only: bool = Query(False, description="Get only pending requests for approvers")
):
    """Get all access requests or only pending ones for approvers."""
    try:
        service = await get_service()
        access_requests = await service.get_access_requests(pending_only=pending_only)
        
        # Enrich with related data
        enriched_requests = await service.enrich_access_requests(access_requests)
        
        return AccessRequestListResponse(
            access_requests=enriched_requests,
            total=len(enriched_requests),
            success=True
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get access requests: {str(e)}")


@router.post("/access-requests", response_model=AccessRequestResponse)
async def create_access_request(
    request_data: CreateAccessRequestRequest,
    user_id: int = Query(..., description="ID of the user making the request")
):
    """Create a new access request for a document."""
    try:
        service = await get_service()
        access_request = await service.create_access_request(user_id, request_data)
        
        # Enrich with related data
        enriched_requests = await service.enrich_access_requests([access_request])
        
        return AccessRequestResponse(
            access_request=enriched_requests[0] if enriched_requests else access_request,
            success=True,
            message="Access request created successfully"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create access request: {str(e)}")


@router.put("/access-requests/{request_id}/decision", response_model=AccessRequestResponse)
async def make_access_decision(
    request_id: int = Path(..., description="ID of the access request"),
    decision_data: AccessRequestDecisionRequest = ...,
    approver_id: int = Query(..., description="ID of the user making the decision")
):
    """Make a decision (approve/reject) on an access request."""
    try:
        service = await get_service()
        access_request = await service.make_decision(request_id, decision_data, approver_id)
        
        # Enrich with related data
        enriched_requests = await service.enrich_access_requests([access_request])
        
        return AccessRequestResponse(
            access_request=enriched_requests[0] if enriched_requests else access_request,
            success=True,
            message=f"Access request {decision_data.decision.value} successfully"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to make decision: {str(e)}")


@router.get("/documents", response_model=DocumentListResponse)
async def get_documents():
    """Get all available documents."""
    try:
        service = await get_service()
        documents = await service.get_documents()
        
        return DocumentListResponse(
            documents=documents,
            total=len(documents),
            success=True
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get documents: {str(e)}")


@router.get("/documents/{document_id}")
async def get_document_by_id(
    document_id: int = Path(..., description="ID of the document")
):
    """Get a specific document by ID."""
    try:
        service = await get_service()
        document = await service.get_document_by_id(document_id)
        
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
        
        return {
            "document": document,
            "success": True
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get document: {str(e)}")


@router.get("/users", response_model=UserListResponse)
async def get_users():
    """Get all users."""
    try:
        service = await get_service()
        users = await service.get_users()
        
        return UserListResponse(
            users=users,
            total=len(users),
            success=True
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get users: {str(e)}")


@router.get("/users/{user_id}")
async def get_user_by_id(
    user_id: int = Path(..., description="ID of the user")
):
    """Get a specific user by ID."""
    try:
        service = await get_service()
        user = await service.get_user_by_id(user_id)
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        return {
            "user": user,
            "success": True
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get user: {str(e)}")