import React, { useState, useEffect } from 'react';
import config from '../../config.json';

interface Entity {
  id: string;
  name: string;
  entity_type: string;
  industry?: string;
  reputation_score: number;
  contract_count: number;
}

interface Contract {
  contract_id: string;
  outcome: string;
  contract_date: string;
  completion_date?: string;
  notes?: string;
}

interface EntityDetails {
  id: string;
  name: string;
  entity_type: string;
  industry?: string;
  contact_email?: string;
  contact_phone?: string;
  reputation_score: number;
  total_contracts: number;
  successful_contracts: number;
  failed_contracts: number;
  pending_contracts: number;
  contracts?: Contract[];
}

interface RiskLevel {
  level: string;
  color: string;
  bgColor: string;
}

interface EntityModalProps {
  entity: Entity;
  onClose: () => void;
  onUpdate: () => void;
}

const getRiskLevel = (score: number): RiskLevel => {
  if (score < 40) return { level: 'High Risk', color: 'text-red-600', bgColor: 'bg-red-100' };
  if (score < 70) return { level: 'Medium Risk', color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
  return { level: 'Low Risk', color: 'text-green-600', bgColor: 'bg-green-100' };
};

const getOutcomeColor = (outcome: string): string => {
  switch (outcome) {
    case 'Successful Completion':
      return 'text-green-600 bg-green-100';
    case 'Pending':
      return 'text-blue-600 bg-blue-100';
    case 'Early Termination':
      return 'text-yellow-600 bg-yellow-100';
    case 'Dispute':
      return 'text-orange-600 bg-orange-100';
    case 'Litigation':
      return 'text-red-600 bg-red-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
};

const EntityModal: React.FC<EntityModalProps> = ({ entity, onClose, onUpdate }) => {
  const [entityDetails, setEntityDetails] = useState<EntityDetails | null>(null);
  const [loading, setLoading] = useState(false);

  const apiUrl = config.apps.API.url || 'http://127.0.0.1:8000';

  const updateContractOutcome = async (contractId: string, outcome: string) => {
    try {
      const response = await fetch(`${apiUrl}/contract/${contractId}/outcome`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ outcome }),
      });

      if (response.ok) {
        // Reload entity details to get updated reputation score
        const loadResponse = await fetch(`${apiUrl}/entity/${entity.id}`);
        if (loadResponse.ok) {
          const data = await loadResponse.json();
          setEntityDetails(data);
        }
        // Also update the parent list
        onUpdate();
      }
    } catch (err) {
      console.error('Error updating contract outcome:', err);
    }
  };

  useEffect(() => {
    const loadEntityDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${apiUrl}/entity/${entity.id}`);
        if (response.ok) {
          const data = await response.json();
          setEntityDetails(data);
        }
      } catch (err) {
        console.error('Error loading entity details:', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadEntityDetails();
  }, [entity.id, apiUrl]);

  if (!entityDetails && loading) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl max-w-4xl w-full mx-4 max-h-screen overflow-y-auto shadow-2xl">
          <div className="p-6 text-center">
            <p className="text-gray-500">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!entityDetails) return null;

  const risk = getRiskLevel(entityDetails.reputation_score);

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl max-w-4xl w-full mx-4 max-h-screen overflow-y-auto shadow-2xl">
        <div className="px-6 py-4 border-b border-white/30 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">Entity Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl transition-colors"
          >
            ×
          </button>
        </div>
        
        <div className="p-6">
          {/* Entity Summary */}
          <div className="mb-6 p-4 bg-white/50 backdrop-blur-sm rounded-2xl border border-white/30">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{entityDetails.name}</h3>
                <p className="text-gray-600">
                  {entityDetails.entity_type} • {entityDetails.industry || 'No industry specified'}
                </p>
                {entityDetails.contact_email && (
                  <p className="text-sm text-gray-500">Email: {entityDetails.contact_email}</p>
                )}
                {entityDetails.contact_phone && (
                  <p className="text-sm text-gray-500">Phone: {entityDetails.contact_phone}</p>
                )}
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-gray-900 mb-1">
                  {entityDetails.reputation_score}
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${risk.bgColor} ${risk.color}`}>
                  {risk.level}
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-gray-900">{entityDetails.total_contracts}</div>
                <div className="text-sm text-gray-500">Total Contracts</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{entityDetails.successful_contracts}</div>
                <div className="text-sm text-gray-500">Successful</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">{entityDetails.failed_contracts}</div>
                <div className="text-sm text-gray-500">Failed</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">{entityDetails.pending_contracts}</div>
                <div className="text-sm text-gray-500">Pending</div>
              </div>
            </div>
          </div>

          {/* Contract History */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-gray-900">Contract History</h4>
            {entityDetails.contracts && entityDetails.contracts.length > 0 ? (
              <div className="space-y-3">
                {entityDetails.contracts.map((contract) => (
                  <div key={contract.contract_id} className="bg-white/50 backdrop-blur-sm border border-white/30 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className="font-medium text-gray-900">Contract #{contract.contract_id}</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getOutcomeColor(contract.outcome)}`}>
                            {contract.outcome}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          Created: {new Date(contract.contract_date).toLocaleDateString()}
                        </p>
                        {contract.completion_date && (
                          <p className="text-sm text-gray-600">
                            Completed: {new Date(contract.completion_date).toLocaleDateString()}
                          </p>
                        )}
                        {contract.notes && (
                          <p className="text-sm text-gray-600 mt-1">
                            Notes: {contract.notes}
                          </p>
                        )}
                      </div>
                      <div>
                        <select
                          value={contract.outcome}
                          onChange={(e) => updateContractOutcome(contract.contract_id, e.target.value)}
                          className="text-sm border border-gray-300 rounded-lg p-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="Pending">Pending</option>
                          <option value="Successful Completion">Successful Completion</option>
                          <option value="Early Termination">Early Termination</option>
                          <option value="Dispute">Dispute</option>
                          <option value="Litigation">Litigation</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No contract history available</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EntityModal; 