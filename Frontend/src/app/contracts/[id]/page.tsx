'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '../../../components/Header';
import Breadcrumb from '../../../components/Breadcrumb';
import { useAuth } from '../../../components/AuthProvider';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../../firebase';

interface Contract {
  id: string;
  fileName: string;
  status: 'draft' | 'negotiating' | 'signed in' | 'in progress' | 'completed';
  role: string;
  riskTolerance: string;
  summary: string;
  redFlags: string[];
  pushbacks: string[];
  tokensUsed?: number;
  createdAt: string;
  updatedAt?: string;
  userId: string;
  gcsFilePath?: string;
  gcsFileUrl?: string;
  aiReminder?: string;
  aiSuggestion?: string;
}

interface TimelineEvent {
  id: string;
  status: Contract['status'];
  timestamp: string;
  description: string;
  icon: string;
  color: string;
}

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft', color: 'bg-gray-100 text-gray-800', icon: '📝' },
  { value: 'negotiating', label: 'Negotiating', color: 'bg-yellow-100 text-yellow-800', icon: '💬' },
  { value: 'signed in', label: 'Signed In', color: 'bg-blue-100 text-blue-800', icon: '✍️' },
  { value: 'in progress', label: 'In Progress', color: 'bg-purple-100 text-purple-800', icon: '🚀' },
  { value: 'completed', label: 'Completed', color: 'bg-green-100 text-green-800', icon: '✅' },
] as const;

const STATUS_ORDER = ['draft', 'negotiating', 'signed in', 'in progress', 'completed'] as const;

export default function SingleContractPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, loading } = useAuth();
  const [contract, setContract] = useState<Contract | null>(null);
  const [loadingContract, setLoadingContract] = useState(true);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);

  useEffect(() => {
    if (user && id) {
      loadContract();
    }
  }, [user, id]);

  const loadContract = async () => {
    if (!user || !id) return;

    try {
      const contractRef = doc(db, 'contracts', id as string);
      const contractSnap = await getDoc(contractRef);

      if (!contractSnap.exists()) {
        alert('Contract not found');
        router.push('/contracts');
        return;
      }

      const contractData = {
        id: contractSnap.id,
        ...contractSnap.data()
      } as Contract;

      // Verify user owns this contract
      if (contractData.userId !== user.uid) {
        alert('Access denied');
        router.push('/contracts');
        return;
      }

      setContract(contractData);
      generateTimeline(contractData);
    } catch (error) {
      console.error('Error loading contract:', error);
      alert('Error loading contract');
    } finally {
      setLoadingContract(false);
    }
  };

  const generateTimeline = (contractData: Contract) => {
    const events: TimelineEvent[] = [];
    
    // Contract creation
    events.push({
      id: 'created',
      status: 'draft',
      timestamp: contractData.createdAt,
      description: 'Contract uploaded and analyzed',
      icon: '📄',
      color: 'bg-blue-500'
    });

    // Status changes
    if (contractData.updatedAt && contractData.updatedAt !== contractData.createdAt) {
      events.push({
        id: 'updated',
        status: contractData.status,
        timestamp: contractData.updatedAt,
        description: `Status updated to ${contractData.status}`,
        icon: STATUS_OPTIONS.find(opt => opt.value === contractData.status)?.icon || '📊',
        color: 'bg-purple-500'
      });
    }

    // Add milestone events based on current status
    const currentIndex = STATUS_ORDER.indexOf(contractData.status);
    
    STATUS_ORDER.forEach((status, index) => {
      if (index <= currentIndex) {
        const isCompleted = index < currentIndex;
        const isCurrent = index === currentIndex;
        
        if (isCompleted) {
          events.push({
            id: `milestone-${status}`,
            status: status as Contract['status'],
            timestamp: contractData.createdAt, // Placeholder - in real app you'd track actual milestone dates
            description: `${STATUS_OPTIONS.find(opt => opt.value === status)?.label} completed`,
            icon: STATUS_OPTIONS.find(opt => opt.value === status)?.icon || '🎯',
            color: 'bg-green-500'
          });
        } else if (isCurrent) {
          events.push({
            id: `milestone-${status}`,
            status: status as Contract['status'],
            timestamp: contractData.updatedAt || contractData.createdAt,
            description: `Currently in ${STATUS_OPTIONS.find(opt => opt.value === status)?.label} phase`,
            icon: STATUS_OPTIONS.find(opt => opt.value === status)?.icon || '🎯',
            color: 'bg-yellow-500'
          });
        }
      }
    });

    // Sort by timestamp
    events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    setTimeline(events);
  };

  const updateContractStatus = async (newStatus: Contract['status']) => {
    if (!contract) return;

    try {
      const contractRef = doc(db, 'contracts', contract.id);
      await updateDoc(contractRef, {
        status: newStatus,
        updatedAt: new Date().toISOString(),
      });

      // Update local state
      const updatedContract = { ...contract, status: newStatus, updatedAt: new Date().toISOString() };
      setContract(updatedContract);
      generateTimeline(updatedContract);
    } catch (error) {
      console.error('Error updating contract status:', error);
      alert('Error updating contract status');
    }
  };

  const getStatusBadge = (status: Contract['status']) => {
    const statusInfo = STATUS_OPTIONS.find(option => option.value === status);
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo?.color || 'bg-gray-100 text-gray-800'}`}>
        {statusInfo?.icon} {statusInfo?.label || status}
      </span>
    );
  };

  if (loading || loadingContract) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="container mx-auto px-4 py-8">
          <Header />
          <div className="text-center py-16">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Contract Details</h1>
            <p className="text-gray-600 mb-8">Please sign in to view contract details.</p>
          </div>
        </div>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="container mx-auto px-4 py-8">
          <Header />
          <div className="text-center py-16">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Contract Not Found</h1>
            <p className="text-gray-600 mb-8">The contract you're looking for doesn't exist.</p>
            <button
              onClick={() => router.push('/contracts')}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Back to Contracts
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        
        <div className="mt-8">
          {/* Breadcrumb */}
          <Breadcrumb
            items={[
              { label: 'Contracts', href: '/contracts' },
              { label: contract.fileName }
            ]}
          />
          
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{contract.fileName}</h1>
              <div className="flex items-center space-x-4 mt-2">
                {getStatusBadge(contract.status)}
                <span className="text-gray-500">•</span>
                <span className="text-gray-600">Role: {contract.role}</span>
                <span className="text-gray-500">•</span>
                <span className="text-gray-600">Risk: {contract.riskTolerance}</span>
              </div>
            </div>
            
            <div className="flex flex-col space-y-2">
              <select
                value={contract.status}
                onChange={(e) => updateContractStatus(e.target.value as Contract['status'])}
                className="border rounded-lg px-3 py-2 text-sm bg-white"
              >
                {STATUS_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow-sm p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{contract.redFlags.length}</div>
              <div className="text-sm text-gray-600">Red Flags</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{contract.pushbacks.length}</div>
              <div className="text-sm text-gray-600">Pushbacks</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{contract.tokensUsed || 'N/A'}</div>
              <div className="text-sm text-gray-600">Tokens Used</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4 text-center">
              <div className="text-2xl font-bold text-gray-600">
                {Math.ceil((Date.now() - new Date(contract.createdAt).getTime()) / (1000 * 60 * 60 * 24))}
              </div>
              <div className="text-sm text-gray-600">Days Active</div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => updateContractStatus('negotiating')}
                disabled={contract.status === 'negotiating'}
                className="px-4 py-2 bg-yellow-600 text-white text-sm font-medium rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Start Negotiation
              </button>
              <button
                onClick={() => updateContractStatus('signed in')}
                disabled={contract.status === 'signed in'}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Mark as Signed
              </button>
              <button
                onClick={() => updateContractStatus('in progress')}
                disabled={contract.status === 'in progress'}
                className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Start Execution
              </button>
              <button
                onClick={() => updateContractStatus('completed')}
                disabled={contract.status === 'completed'}
                className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Mark Complete
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content - Left Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Summary */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Summary</h2>
                <p className="text-gray-700 leading-relaxed">{contract.summary}</p>
              </div>

              {/* Red Flags */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <span className="text-red-500 mr-2">⚠️</span>
                  Red Flags ({contract.redFlags.length})
                </h2>
                {contract.redFlags.length > 0 ? (
                  <ul className="space-y-2">
                    {contract.redFlags.map((flag, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-red-500 mr-2">•</span>
                        <span className="text-gray-700">{flag}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500">No red flags identified. Great contract! 🎉</p>
                )}
              </div>

              {/* Pushbacks */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <span className="text-green-500 mr-2">💡</span>
                  Pushbacks ({contract.pushbacks.length})
                </h2>
                {contract.pushbacks.length > 0 ? (
                  <ul className="space-y-2">
                    {contract.pushbacks.map((pushback, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-green-500 mr-2">•</span>
                        <span className="text-gray-700">{pushback}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500">No pushbacks suggested. Contract looks solid! 👍</p>
                )}
              </div>
            </div>

            {/* Sidebar - Right Column */}
            <div className="space-y-6">
              {/* File Information */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">File Information</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">Original File</label>
                    {contract.gcsFileUrl ? (
                      <div className="space-y-2">
                        <a
                          href={contract.gcsFileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Download Original
                        </a>
                        <p className="text-xs text-gray-500">File stored securely in Google Cloud Storage</p>
                      </div>
                    ) : (
                      <div className="text-gray-500 text-sm">
                        <span className="inline-flex items-center px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          File not available
                        </span>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">File ID</label>
                    <span className="text-gray-900 text-sm font-mono break-all bg-gray-50 px-2 py-1 rounded">
                      {contract.gcsFilePath || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Analysis Tokens</label>
                    <span className="text-gray-900 text-sm">{contract.tokensUsed || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Contract Details */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Contract Details</h2>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Created</label>
                    <span className="text-gray-900 text-sm">
                      {new Date(contract.createdAt).toLocaleDateString()} at {new Date(contract.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                  {contract.updatedAt && (
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Last Updated</label>
                      <span className="text-gray-900 text-sm">
                        {new Date(contract.updatedAt).toLocaleDateString()} at {new Date(contract.updatedAt).toLocaleTimeString()}
                      </span>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Contract ID</label>
                    <span className="text-gray-900 text-sm font-mono break-all">{contract.id}</span>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Contract Timeline</h2>
                <div className="space-y-4">
                  {timeline.map((event, index) => (
                    <div key={event.id} className="relative">
                      {index < timeline.length - 1 && (
                        <div className="absolute left-1.5 top-6 w-0.5 h-8 bg-gray-200"></div>
                      )}
                      <div className="flex items-start space-x-3">
                        <div className={`w-3 h-3 rounded-full ${event.color} mt-2 flex-shrink-0 z-10 relative`}></div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <span className="text-lg">{event.icon}</span>
                            <p className="text-sm font-medium text-gray-900">{event.description}</p>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(event.timestamp).toLocaleDateString()} at {new Date(event.timestamp).toLocaleTimeString()}
                          </p>
                          {event.status === contract.status && (
                            <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full mt-2">
                              Current Status
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Progress Bar */}
                <div className="mt-6">
                  <div className="flex justify-between text-xs text-gray-600 mb-2">
                    <span>Progress</span>
                    <span>{Math.round(((STATUS_ORDER.indexOf(contract.status) + 1) / STATUS_ORDER.length) * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${((STATUS_ORDER.indexOf(contract.status) + 1) / STATUS_ORDER.length) * 100}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    {STATUS_ORDER.map((status, index) => (
                      <span key={status} className={index <= STATUS_ORDER.indexOf(contract.status) ? 'text-blue-600 font-medium' : ''}>
                        {STATUS_OPTIONS.find(opt => opt.value === status)?.label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 