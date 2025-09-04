"""Tests for Document Access Approval API routes."""

import pytest
from unittest.mock import AsyncMock, patch
from fastapi.testclient import TestClient
from datetime import datetime

from main import app
from models.access_approval import AccessRequest, Document, User, AccessRequestStatus

client = TestClient(app)


@pytest.fixture
def mock_service():
    """Create a mock DocumentAccessService."""
    service = AsyncMock()
    
    # Mock data
    user = User(id=1, name="John Doe", email="john@example.com")
    document = Document(id=1, title="Test Document", owner_id=2)
    access_request = AccessRequest(
        id=1,
        user_id=1,
        document_id=1,
        status=AccessRequestStatus.PENDING,
        requested_at=datetime.now(),
        user=user,
        document=document
    )
    
    service.get_access_requests.return_value = [access_request]
    service.enrich_access_requests.return_value = [access_request]
    service.create_access_request.return_value = access_request
    service.make_decision.return_value = access_request
    service.get_documents.return_value = [document]
    service.get_document_by_id.return_value = document
    service.get_users.return_value = [user]
    service.get_user_by_id.return_value = user
    
    return service


@patch('routes.access_approval.DocumentAccessService')
def test_get_access_requests(mock_service_class, mock_service):
    """Test getting access requests."""
    mock_service_class.return_value = mock_service
    
    response = client.get("/access-approval/access-requests")
    assert response.status_code == 200
    
    data = response.json()
    assert data["success"] is True
    assert "access_requests" in data
    assert "total" in data
    assert isinstance(data["access_requests"], list)


@patch('routes.access_approval.DocumentAccessService')
def test_get_pending_access_requests(mock_service_class, mock_service):
    """Test getting only pending access requests."""
    mock_service_class.return_value = mock_service
    
    response = client.get("/access-approval/access-requests?pending_only=true")
    assert response.status_code == 200
    
    data = response.json()
    assert data["success"] is True
    assert "access_requests" in data
    # Should only have pending requests
    for request in data["access_requests"]:
        assert request["status"] == "pending"


@patch('routes.access_approval.DocumentAccessService')
def test_create_access_request(mock_service_class, mock_service):
    """Test creating a new access request."""
    mock_service_class.return_value = mock_service
    
    request_data = {
        "document_id": 1,
        "reason": "Need access for project"
    }
    
    response = client.post(
        "/access-approval/access-requests?user_id=1", 
        json=request_data
    )
    assert response.status_code == 200
    
    data = response.json()
    assert data["success"] is True
    assert "Access request created successfully" in data["message"]


@patch('routes.access_approval.DocumentAccessService')
def test_make_access_decision(mock_service_class, mock_service):
    """Test making a decision on an access request."""
    mock_service_class.return_value = mock_service
    
    decision_data = {
        "decision": "approved",
        "reason": "Access granted for project needs"
    }
    
    response = client.put(
        "/access-approval/access-requests/1/decision?approver_id=2",
        json=decision_data
    )
    assert response.status_code == 200
    
    data = response.json()
    assert data["success"] is True


@patch('routes.access_approval.DocumentAccessService')
def test_get_documents(mock_service_class, mock_service):
    """Test getting all documents."""
    mock_service_class.return_value = mock_service
    
    response = client.get("/access-approval/documents")
    assert response.status_code == 200
    
    data = response.json()
    assert data["success"] is True
    assert "documents" in data
    assert "total" in data
    assert isinstance(data["documents"], list)
    assert len(data["documents"]) > 0  # Should have at least some documents


@patch('routes.access_approval.DocumentAccessService')
def test_get_document_by_id(mock_service_class, mock_service):
    """Test getting a specific document."""
    mock_service_class.return_value = mock_service
    
    response = client.get("/access-approval/documents/1")
    assert response.status_code == 200
    
    data = response.json()
    assert data["success"] is True
    assert data["document"]["id"] == 1


@patch('routes.access_approval.DocumentAccessService')
def test_get_document_not_found(mock_service_class, mock_service):
    """Test getting a document that doesn't exist."""
    mock_service_class.return_value = mock_service
    mock_service.get_document_by_id.return_value = None
    
    response = client.get("/access-approval/documents/999")
    assert response.status_code == 404
    assert "Document not found" in response.json()["detail"]


@patch('routes.access_approval.DocumentAccessService')
def test_get_users(mock_service_class, mock_service):
    """Test getting all users."""
    mock_service_class.return_value = mock_service
    
    response = client.get("/access-approval/users")
    assert response.status_code == 200
    
    data = response.json()
    assert data["success"] is True
    assert "users" in data
    assert "total" in data
    assert isinstance(data["users"], list)
    assert len(data["users"]) > 0  # Should have at least some users


@patch('routes.access_approval.DocumentAccessService')
def test_get_user_by_id(mock_service_class, mock_service):
    """Test getting a specific user."""
    mock_service_class.return_value = mock_service
    
    response = client.get("/access-approval/users/1")
    assert response.status_code == 200
    
    data = response.json()
    assert data["success"] is True
    assert data["user"]["id"] == 1


@patch('routes.access_approval.DocumentAccessService')
def test_get_user_not_found(mock_service_class, mock_service):
    """Test getting a user that doesn't exist."""
    mock_service_class.return_value = mock_service
    mock_service.get_user_by_id.return_value = None
    
    response = client.get("/access-approval/users/999")
    assert response.status_code == 404
    assert "User not found" in response.json()["detail"]