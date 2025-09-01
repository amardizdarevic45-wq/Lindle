"""Service for integrating with Document Access Approval API."""

import httpx
from typing import List, Optional
from datetime import datetime

from models.access_approval import (
    AccessRequest, Document, User, AccessRequestStatus,
    CreateAccessRequestRequest, AccessRequestDecisionRequest
)


class DocumentAccessService:
    """Service to interact with the Document Access Approval API."""
    
    def __init__(self):
        self.base_url = "https://daas-backend-946555989276.europe-central2.run.app"
        self.timeout = 30.0
    
    async def _make_request(self, method: str, endpoint: str, **kwargs) -> httpx.Response:
        """Make HTTP request to the external API."""
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            url = f"{self.base_url}{endpoint}"
            response = await client.request(method, url, **kwargs)
            response.raise_for_status()
            return response
    
    # Access Requests endpoints
    async def get_access_requests(self, pending_only: bool = False) -> List[AccessRequest]:
        """Get all access requests or only pending ones."""
        params = {"pending": "true"} if pending_only else {}
        response = await self._make_request("GET", "/api/AccessRequests", params=params)
        data = response.json()
        
        # Convert response to our models
        requests = []
        for item in data if isinstance(data, list) else data.get("requests", []):
            # Parse datetime strings
            requested_at = datetime.fromisoformat(item["requested_at"].replace("Z", "+00:00")) if item.get("requested_at") else datetime.now()
            decided_at = None
            if item.get("decided_at"):
                decided_at = datetime.fromisoformat(item["decided_at"].replace("Z", "+00:00"))
            
            access_request = AccessRequest(
                id=item["id"],
                user_id=item["user_id"],
                document_id=item["document_id"],
                status=AccessRequestStatus(item["status"]),
                reason=item.get("reason"),
                requested_at=requested_at,
                decided_at=decided_at,
                decided_by=item.get("decided_by"),
                decision_reason=item.get("decision_reason")
            )
            requests.append(access_request)
        
        return requests
    
    async def create_access_request(self, user_id: int, request_data: CreateAccessRequestRequest) -> AccessRequest:
        """Create a new access request."""
        payload = {
            "user_id": user_id,
            "document_id": request_data.document_id,
            "reason": request_data.reason
        }
        
        response = await self._make_request("POST", "/api/AccessRequests", json=payload)
        data = response.json()
        
        requested_at = datetime.fromisoformat(data["requested_at"].replace("Z", "+00:00")) if data.get("requested_at") else datetime.now()
        
        return AccessRequest(
            id=data["id"],
            user_id=data["user_id"],
            document_id=data["document_id"],
            status=AccessRequestStatus(data["status"]),
            reason=data.get("reason"),
            requested_at=requested_at,
            decided_at=None,
            decided_by=None,
            decision_reason=None
        )
    
    async def make_decision(self, request_id: int, decision_data: AccessRequestDecisionRequest, approver_id: int) -> AccessRequest:
        """Make a decision (approve/reject) on an access request."""
        payload = {
            "decision": decision_data.decision.value,
            "reason": decision_data.reason,
            "decided_by": approver_id
        }
        
        response = await self._make_request("PUT", f"/api/AccessRequests/{request_id}/decision", json=payload)
        data = response.json()
        
        requested_at = datetime.fromisoformat(data["requested_at"].replace("Z", "+00:00")) if data.get("requested_at") else datetime.now()
        decided_at = None
        if data.get("decided_at"):
            decided_at = datetime.fromisoformat(data["decided_at"].replace("Z", "+00:00"))
        
        return AccessRequest(
            id=data["id"],
            user_id=data["user_id"],
            document_id=data["document_id"],
            status=AccessRequestStatus(data["status"]),
            reason=data.get("reason"),
            requested_at=requested_at,
            decided_at=decided_at,
            decided_by=data.get("decided_by"),
            decision_reason=data.get("decision_reason")
        )
    
    # Documents endpoints
    async def get_documents(self) -> List[Document]:
        """Get all documents."""
        response = await self._make_request("GET", "/api/Documents")
        data = response.json()
        
        documents = []
        for item in data if isinstance(data, list) else data.get("documents", []):
            created_at = None
            if item.get("created_at"):
                created_at = datetime.fromisoformat(item["created_at"].replace("Z", "+00:00"))
            
            document = Document(
                id=item["id"],
                title=item["title"],
                description=item.get("description"),
                owner_id=item["owner_id"],
                created_at=created_at,
                file_type=item.get("file_type"),
                file_size=item.get("file_size")
            )
            documents.append(document)
        
        return documents
    
    async def get_document_by_id(self, document_id: int) -> Optional[Document]:
        """Get a document by ID."""
        try:
            response = await self._make_request("GET", f"/api/Documents/{document_id}")
            data = response.json()
            
            created_at = None
            if data.get("created_at"):
                created_at = datetime.fromisoformat(data["created_at"].replace("Z", "+00:00"))
            
            return Document(
                id=data["id"],
                title=data["title"],
                description=data.get("description"),
                owner_id=data["owner_id"],
                created_at=created_at,
                file_type=data.get("file_type"),
                file_size=data.get("file_size")
            )
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                return None
            raise
    
    # Users endpoints
    async def get_users(self) -> List[User]:
        """Get all users."""
        response = await self._make_request("GET", "/api/Users")
        data = response.json()
        
        users = []
        for item in data if isinstance(data, list) else data.get("users", []):
            created_at = None
            if item.get("created_at"):
                created_at = datetime.fromisoformat(item["created_at"].replace("Z", "+00:00"))
            
            user = User(
                id=item["id"],
                name=item["name"],
                email=item["email"],
                role=item.get("role"),
                created_at=created_at
            )
            users.append(user)
        
        return users
    
    async def get_user_by_id(self, user_id: int) -> Optional[User]:
        """Get a user by ID."""
        try:
            response = await self._make_request("GET", f"/api/Users/{user_id}")
            data = response.json()
            
            created_at = None
            if data.get("created_at"):
                created_at = datetime.fromisoformat(data["created_at"].replace("Z", "+00:00"))
            
            return User(
                id=data["id"],
                name=data["name"],
                email=data["email"],
                role=data.get("role"),
                created_at=created_at
            )
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                return None
            raise
    
    # Helper method to enrich access requests with related data
    async def enrich_access_requests(self, access_requests: List[AccessRequest]) -> List[AccessRequest]:
        """Enrich access requests with user and document information."""
        # Get all users and documents to avoid multiple API calls
        users = await self.get_users()
        documents = await self.get_documents()
        
        # Create lookup dictionaries
        users_dict = {user.id: user for user in users}
        documents_dict = {doc.id: doc for doc in documents}
        
        # Enrich each access request
        enriched_requests = []
        for request in access_requests:
            request.user = users_dict.get(request.user_id)
            request.document = documents_dict.get(request.document_id)
            if request.decided_by:
                request.approver = users_dict.get(request.decided_by)
            enriched_requests.append(request)
        
        return enriched_requests