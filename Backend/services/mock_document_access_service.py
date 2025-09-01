"""Mock service for testing Document Access Approval API when external API is not available."""

from typing import List, Optional
from datetime import datetime

from models.access_approval import (
    AccessRequest, Document, User, AccessRequestStatus,
    CreateAccessRequestRequest, AccessRequestDecisionRequest
)


class MockDocumentAccessService:
    """Mock service for testing when external API is not available."""
    
    def __init__(self):
        # Mock data
        self.users = [
            User(id=1, name="John Doe", email="john@example.com", role="User"),
            User(id=2, name="Jane Smith", email="jane@example.com", role="Admin"),
            User(id=3, name="Bob Wilson", email="bob@example.com", role="Manager"),
        ]
        
        self.documents = [
            Document(id=1, title="Project Requirements", description="Initial project requirements document", owner_id=2, file_type="PDF"),
            Document(id=2, title="API Specification", description="Technical API specification document", owner_id=2, file_type="DOCX"),
            Document(id=3, title="Budget Analysis", description="Q4 budget analysis report", owner_id=3, file_type="XLSX"),
            Document(id=4, title="Security Guidelines", description="Company security policies and guidelines", owner_id=2, file_type="PDF"),
        ]
        
        self.access_requests = [
            AccessRequest(
                id=1, user_id=1, document_id=1, status=AccessRequestStatus.PENDING,
                reason="Need to review requirements for new project",
                requested_at=datetime(2025, 1, 1, 10, 0, 0)
            ),
            AccessRequest(
                id=2, user_id=3, document_id=2, status=AccessRequestStatus.APPROVED,
                reason="Required for API integration work",
                requested_at=datetime(2024, 12, 28, 14, 30, 0),
                decided_at=datetime(2024, 12, 29, 9, 15, 0),
                decided_by=2, decision_reason="Approved for technical implementation"
            ),
            AccessRequest(
                id=3, user_id=1, document_id=4, status=AccessRequestStatus.REJECTED,
                reason="Need access for security review",
                requested_at=datetime(2024, 12, 25, 11, 20, 0),
                decided_at=datetime(2024, 12, 26, 16, 45, 0),
                decided_by=2, decision_reason="Security clearance required first"
            ),
        ]
        
        self.next_request_id = 4
    
    async def get_access_requests(self, pending_only: bool = False) -> List[AccessRequest]:
        """Get all access requests or only pending ones."""
        if pending_only:
            return [req for req in self.access_requests if req.status == AccessRequestStatus.PENDING]
        return self.access_requests.copy()
    
    async def create_access_request(self, user_id: int, request_data: CreateAccessRequestRequest) -> AccessRequest:
        """Create a new access request."""
        new_request = AccessRequest(
            id=self.next_request_id,
            user_id=user_id,
            document_id=request_data.document_id,
            status=AccessRequestStatus.PENDING,
            reason=request_data.reason,
            requested_at=datetime.now()
        )
        self.access_requests.append(new_request)
        self.next_request_id += 1
        return new_request
    
    async def make_decision(self, request_id: int, decision_data: AccessRequestDecisionRequest, approver_id: int) -> AccessRequest:
        """Make a decision (approve/reject) on an access request."""
        for request in self.access_requests:
            if request.id == request_id:
                request.status = decision_data.decision
                request.decided_at = datetime.now()
                request.decided_by = approver_id
                request.decision_reason = decision_data.reason
                return request
        
        raise ValueError(f"Access request {request_id} not found")
    
    async def get_documents(self) -> List[Document]:
        """Get all documents."""
        return self.documents.copy()
    
    async def get_document_by_id(self, document_id: int) -> Optional[Document]:
        """Get a document by ID."""
        for doc in self.documents:
            if doc.id == document_id:
                return doc
        return None
    
    async def get_users(self) -> List[User]:
        """Get all users."""
        return self.users.copy()
    
    async def get_user_by_id(self, user_id: int) -> Optional[User]:
        """Get a user by ID."""
        for user in self.users:
            if user.id == user_id:
                return user
        return None
    
    async def enrich_access_requests(self, access_requests: List[AccessRequest]) -> List[AccessRequest]:
        """Enrich access requests with user and document information."""
        users_dict = {user.id: user for user in self.users}
        documents_dict = {doc.id: doc for doc in self.documents}
        
        enriched_requests = []
        for request in access_requests:
            request.user = users_dict.get(request.user_id)
            request.document = documents_dict.get(request.document_id)
            if request.decided_by:
                request.approver = users_dict.get(request.decided_by)
            enriched_requests.append(request)
        
        return enriched_requests