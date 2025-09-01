'use client';

import React, { useState, useEffect } from 'react';
import config from '../../config.json';

// Types
interface User {
  id: number;
  name: string;
  email: string;
  role?: string;
  created_at?: string;
}

interface Document {
  id: number;
  title: string;
  description?: string;
  owner_id: number;
  created_at?: string;
  file_type?: string;
  file_size?: number;
}

interface AccessRequest {
  id: number;
  user_id: number;
  document_id: number;
  status: 'pending' | 'approved' | 'rejected';
  reason?: string;
  requested_at: string;
  decided_at?: string;
  decided_by?: number;
  decision_reason?: string;
  user?: User;
  document?: Document;
  approver?: User;
}

const DocumentAccessManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'documents' | 'requests' | 'approvals'>('documents');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [accessRequests, setAccessRequests] = useState<AccessRequest[]>([]);
  const [pendingRequests, setPendingRequests] = useState<AccessRequest[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // For demo purposes, using a hardcoded user ID
  // In a real app, this would come from authentication context
  const currentUserId = 1;

  const apiUrl = config.apps.API.url || 'http://127.0.0.1:8000';

  // Fetch data functions
  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${apiUrl}/access-approval/documents`);
      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents || []);
      } else {
        throw new Error('Failed to fetch documents');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch documents');
    } finally {
      setLoading(false);
    }
  };

  const fetchAccessRequests = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${apiUrl}/access-approval/access-requests`);
      if (response.ok) {
        const data = await response.json();
        setAccessRequests(data.access_requests || []);
      } else {
        throw new Error('Failed to fetch access requests');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch access requests');
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingRequests = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${apiUrl}/access-approval/access-requests?pending_only=true`);
      if (response.ok) {
        const data = await response.json();
        setPendingRequests(data.access_requests || []);
      } else {
        throw new Error('Failed to fetch pending requests');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch pending requests');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${apiUrl}/access-approval/users`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  };

  // Request access to a document
  const requestAccess = async (documentId: number, reason: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${apiUrl}/access-approval/access-requests?user_id=${currentUserId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          document_id: documentId,
          reason: reason,
        }),
      });

      if (response.ok) {
        await fetchAccessRequests();
        alert('Access request submitted successfully!');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create access request');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to request access');
    } finally {
      setLoading(false);
    }
  };

  // Make a decision on an access request
  const makeDecision = async (requestId: number, decision: 'approved' | 'rejected', reason?: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${apiUrl}/access-approval/access-requests/${requestId}/decision?approver_id=${currentUserId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          decision: decision,
          reason: reason || '',
        }),
      });

      if (response.ok) {
        await fetchPendingRequests();
        await fetchAccessRequests();
        alert(`Access request ${decision} successfully!`);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to make decision');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to make decision');
    } finally {
      setLoading(false);
    }
  };

  // Load initial data
  useEffect(() => {
    fetchUsers();
    if (activeTab === 'documents') {
      fetchDocuments();
    } else if (activeTab === 'requests') {
      fetchAccessRequests();
    } else if (activeTab === 'approvals') {
      fetchPendingRequests();
    }
  }, [activeTab]);

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(1)} MB`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
    switch (status) {
      case 'pending':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'approved':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'rejected':
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  return (
    <div className="bg-white/70 backdrop-blur-sm border border-white/30 rounded-2xl shadow-xl">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6 py-4">
          <button
            onClick={() => setActiveTab('documents')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'documents'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Browse Documents
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'requests'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            My Requests
          </button>
          <button
            onClick={() => setActiveTab('approvals')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'approvals'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Pending Approvals
          </button>
        </nav>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mx-6 mt-4 p-4 bg-red-100 border border-red-300 rounded-lg">
          <p className="text-red-700">{error}</p>
          <button
            onClick={() => setError(null)}
            className="mt-2 text-red-600 hover:text-red-800 text-sm"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Loading Indicator */}
      {loading && (
        <div className="p-6 text-center">
          <p className="text-gray-500">Loading...</p>
        </div>
      )}

      {/* Tab Content */}
      <div className="p-6">
        {/* Documents Tab */}
        {activeTab === 'documents' && (
          <DocumentsTab 
            documents={documents} 
            onRequestAccess={requestAccess}
            loading={loading}
          />
        )}

        {/* Requests Tab */}
        {activeTab === 'requests' && (
          <RequestsTab 
            requests={accessRequests} 
            getStatusBadge={getStatusBadge}
            formatDate={formatDate}
            loading={loading}
          />
        )}

        {/* Approvals Tab */}
        {activeTab === 'approvals' && (
          <ApprovalsTab 
            requests={pendingRequests} 
            onMakeDecision={makeDecision}
            getStatusBadge={getStatusBadge}
            formatDate={formatDate}
            loading={loading}
          />
        )}
      </div>
    </div>
  );
};

// Documents Tab Component
const DocumentsTab: React.FC<{
  documents: Document[];
  onRequestAccess: (documentId: number, reason: string) => void;
  loading: boolean;
}> = ({ documents, onRequestAccess, loading }) => {
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [reason, setReason] = useState('');

  const handleRequestAccess = () => {
    if (selectedDoc && reason.trim()) {
      onRequestAccess(selectedDoc.id, reason);
      setSelectedDoc(null);
      setReason('');
    }
  };

  if (loading) return <div>Loading documents...</div>;

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Available Documents</h2>
      
      {documents.length === 0 ? (
        <p className="text-gray-500">No documents available.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc) => (
            <div key={doc.id} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
              <h3 className="font-medium text-gray-900 mb-2">{doc.title}</h3>
              {doc.description && (
                <p className="text-gray-600 text-sm mb-3">{doc.description}</p>
              )}
              <div className="text-xs text-gray-500 mb-3">
                <p>Owner ID: {doc.owner_id}</p>
                {doc.file_type && <p>Type: {doc.file_type}</p>}
                {doc.created_at && <p>Created: {new Date(doc.created_at).toLocaleDateString()}</p>}
              </div>
              <button
                onClick={() => setSelectedDoc(doc)}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                Request Access
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Request Access Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Request Access: {selectedDoc.title}
            </h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for access:
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                rows={3}
                placeholder="Please explain why you need access to this document..."
              />
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleRequestAccess}
                disabled={!reason.trim()}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm font-medium"
              >
                Submit Request
              </button>
              <button
                onClick={() => {
                  setSelectedDoc(null);
                  setReason('');
                }}
                className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Requests Tab Component
const RequestsTab: React.FC<{
  requests: AccessRequest[];
  getStatusBadge: (status: string) => string;
  formatDate: (date?: string) => string;
  loading: boolean;
}> = ({ requests, getStatusBadge, formatDate, loading }) => {
  if (loading) return <div>Loading requests...</div>;

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-4">My Access Requests</h2>
      
      {requests.length === 0 ? (
        <p className="text-gray-500">No access requests found.</p>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <div key={request.id} className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-medium text-gray-900">
                  {request.document?.title || `Document #${request.document_id}`}
                </h3>
                <span className={getStatusBadge(request.status)}>
                  {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                </span>
              </div>
              
              {request.document?.description && (
                <p className="text-gray-600 text-sm mb-2">{request.document.description}</p>
              )}
              
              {request.reason && (
                <div className="mb-2">
                  <span className="text-sm font-medium text-gray-700">Reason: </span>
                  <span className="text-sm text-gray-600">{request.reason}</span>
                </div>
              )}
              
              <div className="text-xs text-gray-500">
                <p>Requested: {formatDate(request.requested_at)}</p>
                {request.decided_at && (
                  <p>Decided: {formatDate(request.decided_at)}</p>
                )}
                {request.decision_reason && (
                  <p>Decision reason: {request.decision_reason}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Approvals Tab Component
const ApprovalsTab: React.FC<{
  requests: AccessRequest[];
  onMakeDecision: (requestId: number, decision: 'approved' | 'rejected', reason?: string) => void;
  getStatusBadge: (status: string) => string;
  formatDate: (date?: string) => string;
  loading: boolean;
}> = ({ requests, onMakeDecision, getStatusBadge, formatDate, loading }) => {
  const [selectedRequest, setSelectedRequest] = useState<AccessRequest | null>(null);
  const [decision, setDecision] = useState<'approved' | 'rejected'>('approved');
  const [decisionReason, setDecisionReason] = useState('');

  const handleMakeDecision = () => {
    if (selectedRequest) {
      onMakeDecision(selectedRequest.id, decision, decisionReason);
      setSelectedRequest(null);
      setDecision('approved');
      setDecisionReason('');
    }
  };

  if (loading) return <div>Loading pending requests...</div>;

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Pending Approvals</h2>
      
      {requests.length === 0 ? (
        <p className="text-gray-500">No pending approvals.</p>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <div key={request.id} className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-medium text-gray-900">
                    {request.document?.title || `Document #${request.document_id}`}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Requested by: {request.user?.name || `User #${request.user_id}`} ({request.user?.email || 'No email'})
                  </p>
                </div>
                <span className={getStatusBadge(request.status)}>
                  {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                </span>
              </div>
              
              {request.document?.description && (
                <p className="text-gray-600 text-sm mb-2">{request.document.description}</p>
              )}
              
              {request.reason && (
                <div className="mb-3">
                  <span className="text-sm font-medium text-gray-700">Reason: </span>
                  <span className="text-sm text-gray-600">{request.reason}</span>
                </div>
              )}
              
              <div className="text-xs text-gray-500 mb-3">
                <p>Requested: {formatDate(request.requested_at)}</p>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    setSelectedRequest(request);
                    setDecision('approved');
                  }}
                  className="bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                >
                  Approve
                </button>
                <button
                  onClick={() => {
                    setSelectedRequest(request);
                    setDecision('rejected');
                  }}
                  className="bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Decision Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {decision === 'approved' ? 'Approve' : 'Reject'} Access Request
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Document: {selectedRequest.document?.title || `#${selectedRequest.document_id}`}
            </p>
            <p className="text-sm text-gray-600 mb-4">
              Requested by: {selectedRequest.user?.name || `User #${selectedRequest.user_id}`}
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {decision === 'approved' ? 'Approval reason (optional):' : 'Rejection reason (optional):'}
              </label>
              <textarea
                value={decisionReason}
                onChange={(e) => setDecisionReason(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                rows={3}
                placeholder={decision === 'approved' ? 'Optional notes about the approval...' : 'Please explain why access is being denied...'}
              />
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={handleMakeDecision}
                className={`flex-1 py-2 px-4 rounded-lg transition-colors text-sm font-medium text-white ${
                  decision === 'approved' 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {decision === 'approved' ? 'Approve' : 'Reject'}
              </button>
              <button
                onClick={() => {
                  setSelectedRequest(null);
                  setDecisionReason('');
                }}
                className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentAccessManager;