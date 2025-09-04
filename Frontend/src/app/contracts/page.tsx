'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../components/AuthProvider';
import { collection, query, where, getDocs, doc, updateDoc, addDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useRouter } from 'next/navigation';

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

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft', color: 'bg-gray-100 text-gray-800' },
  { value: 'negotiating', label: 'Negotiating', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'signed in', label: 'Signed In', color: 'bg-blue-100 text-blue-800' },
  { value: 'in progress', label: 'In Progress', color: 'bg-purple-100 text-purple-800' },
  { value: 'completed', label: 'Completed', color: 'bg-green-100 text-green-800' },
] as const;

export default function ContractsPage() {
  const { user, loading } = useAuth();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loadingContracts, setLoadingContracts] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [aiReminders, setAiReminders] = useState<{ [contractId: string]: string }>({});
  const router = useRouter();

  useEffect(() => {
    if (user) {
      loadContracts();
      generateAIReminders();
    }
  }, [user]);

  const loadContracts = async () => {
    if (!user) return;

    try {
      const q = query(
        collection(db, 'contracts'),
        where('userId', '==', user.uid)
      );
      const querySnapshot = await getDocs(q);
      
      const contractsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Contract[];

      setContracts(contractsList);
    } catch (error) {
      console.error('Error loading contracts:', error);
    } finally {
      setLoadingContracts(false);
    }
  };

  const generateAIReminders = async () => {
    if (!user) return;

    try {
      const q = query(
        collection(db, 'contracts'),
        where('userId', '==', user.uid)
      );
      const querySnapshot = await getDocs(q);
      
      const reminders: { [contractId: string]: string } = {};
      
      querySnapshot.docs.forEach(doc => {
        const contract = doc.data() as Contract;
        const daysSinceCreated = Math.floor((Date.now() - new Date(contract.createdAt).getTime()) / (1000 * 60 * 60 * 24));
        
        // Generate AI-like reminders based on contract status and time
        switch (contract.status) {
          case 'draft':
            if (daysSinceCreated > 3) {
              reminders[doc.id] = `📝 This draft has been sitting for ${daysSinceCreated} days. Consider reviewing and moving to negotiation.`;
            }
            break;
          case 'negotiating':
            if (daysSinceCreated > 7) {
              reminders[doc.id] = `💬 Negotiation ongoing for ${daysSinceCreated} days. Time to follow up with the counterparty?`;
            }
            break;
          case 'signed in':
            if (daysSinceCreated > 14) {
              reminders[doc.id] = `🔥 Hey, there's possibility to move this deal forward - it's been signed for ${daysSinceCreated} days. Time to start execution!`;
            }
            break;
          case 'in progress':
            if (daysSinceCreated > 30) {
              reminders[doc.id] = `⏰ This contract has been in progress for ${daysSinceCreated} days. Check if milestones are being met.`;
            }
            break;
          case 'completed':
            reminders[doc.id] = `✅ Great job completing this contract! Consider asking for testimonials or referrals.`;
            break;
        }
      });

      setAiReminders(reminders);
    } catch (error) {
      console.error('Error generating AI reminders:', error);
    }
  };

  const updateContractStatus = async (contractId: string, newStatus: Contract['status']) => {
    try {
      const contractRef = doc(db, 'contracts', contractId);
      await updateDoc(contractRef, {
        status: newStatus,
        updatedAt: new Date().toISOString(),
      });

      // Update local state
      setContracts(prev => prev.map(contract => 
        contract.id === contractId 
          ? { ...contract, status: newStatus, updatedAt: new Date().toISOString() }
          : contract
      ));

      // Refresh AI reminders
      generateAIReminders();
    } catch (error) {
      console.error('Error updating contract status:', error);
    }
  };

  const getStatusBadge = (status: Contract['status']) => {
    const statusInfo = STATUS_OPTIONS.find(option => option.value === status);
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo?.color || 'bg-gray-100 text-gray-800'}`}>
        {statusInfo?.label || status}
      </span>
    );
  };

  const filteredContracts = selectedStatus === 'all' 
    ? contracts 
    : contracts.filter(contract => contract.status === selectedStatus);

  if (loading) {
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
          <div className="text-center py-16">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">My Contracts</h1>
            <p className="text-gray-600 mb-8">Please sign in to view your contract history and manage your deals.</p>
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
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">My Contracts</h1>
            <div className="flex items-center space-x-4">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="border rounded-lg px-3 py-2 text-sm"
              >
                <option value="all">All Statuses</option>
                {STATUS_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* AI Insights Section */}
          <div className="mb-6 bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              🤖 AI Contract Assistant
            </h2>
            <div className="space-y-3">
              {Object.entries(aiReminders).length === 0 ? (
                <p className="text-gray-600">No active reminders. Your contracts are looking good! 🎉</p>
              ) : (
                Object.entries(aiReminders).map(([contractId, reminder]) => {
                  const contract = contracts.find(c => c.id === contractId);
                  return (
                    <div key={contractId} className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
                      <div className="flex justify-between items-start">
                        <div>
                          <button
                            onClick={() => router.push(`/contracts/${contractId}`)}
                            className="font-medium text-blue-900 hover:text-blue-700 hover:underline cursor-pointer"
                          >
                            {contract?.fileName}
                          </button>
                          <p className="text-blue-700 mt-1">{reminder}</p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Contracts List */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            {loadingContracts ? (
              <div className="p-6 text-center">Loading contracts...</div>
            ) : filteredContracts.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                {selectedStatus === 'all' 
                  ? "No contracts found. Start by analyzing your first contract!"
                  : `No contracts with status "${selectedStatus}" found.`}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contract
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Red Flags
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        File Storage
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredContracts.map((contract) => (
                      <tr key={contract.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            <button
                              onClick={() => router.push(`/contracts/${contract.id}`)}
                              className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                            >
                              {contract.fileName}
                            </button>
                          </div>
                          <div className="text-sm text-gray-500 truncate max-w-md">
                            {contract.summary}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(contract.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {contract.role}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-sm ${contract.redFlags?.length > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {contract.redFlags?.length || 0}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {contract.gcsFilePath ? (
                            <span className="text-green-600">✓</span>
                          ) : (
                            <span className="text-red-600">✗</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(contract.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex space-x-2">
                            <select
                              value={contract.status}
                              onChange={(e) => updateContractStatus(contract.id, e.target.value as Contract['status'])}
                              className="border rounded px-2 py-1 text-xs"
                            >
                              {STATUS_OPTIONS.map(option => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                            <button
                              onClick={() => router.push(`/contracts/${contract.id}`)}
                              className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700 transition-colors"
                            >
                              View Details
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}