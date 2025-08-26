'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';

interface ContractorInfo {
  name: string;
  contact_info?: string;
  specialization?: string;
  notes?: string;
}

interface SharingSettings {
  is_public: boolean;
  shared_with_users: string[];
}

interface VaultData {
  user_id: string;
  stake?: string;
  availability?: string;
  potential_contractors: ContractorInfo[];
  sharing_settings: SharingSettings;
  created_at: string;
  updated_at: string;
}

interface VaultResponse {
  vault: VaultData;
  success: boolean;
  message?: string;
}

export default function VaultPage() {
  const [vault, setVault] = useState<VaultData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form states
  const [stake, setStake] = useState('');
  const [availability, setAvailability] = useState('');
  const [contractors, setContractors] = useState<ContractorInfo[]>([]);
  const [isPublic, setIsPublic] = useState(false);
  const [sharedUsers, setSharedUsers] = useState<string>('');
  
  // Current user (in a real app, this would come from authentication)
  const userId = 'demo_user';

  useEffect(() => {
    loadVault();
  }, []);

  const loadVault = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`http://localhost:8000/vault/${userId}`);
      if (!response.ok) throw new Error('Failed to load vault');
      
      const data: VaultResponse = await response.json();
      setVault(data.vault);
      setStake(data.vault.stake || '');
      setAvailability(data.vault.availability || '');
      setContractors(data.vault.potential_contractors || []);
      setIsPublic(data.vault.sharing_settings.is_public);
      setSharedUsers(data.vault.sharing_settings.shared_with_users.join(', '));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load vault');
    } finally {
      setLoading(false);
    }
  };

  const saveVault = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const vaultData = {
        stake,
        availability,
        potential_contractors: contractors,
        sharing_settings: {
          is_public: isPublic,
          shared_with_users: sharedUsers.split(',').map(u => u.trim()).filter(u => u)
        }
      };
      
      const response = await fetch(`http://localhost:8000/vault/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(vaultData)
      });
      
      if (!response.ok) throw new Error('Failed to save vault');
      
      const data: VaultResponse = await response.json();
      setVault(data.vault);
      setSuccess('Vault saved successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save vault');
    } finally {
      setLoading(false);
    }
  };

  const addContractor = () => {
    setContractors([...contractors, { name: '', contact_info: '', specialization: '', notes: '' }]);
  };

  const removeContractor = (index: number) => {
    setContractors(contractors.filter((_, i) => i !== index));
  };

  const updateContractor = (index: number, field: keyof ContractorInfo, value: string) => {
    const updated = [...contractors];
    updated[index] = { ...updated[index], [field]: value };
    setContractors(updated);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-lg p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Personal Clause Vault</h1>
            <p className="text-gray-600">
              Store and manage your contract data, availability, stakes, and potential contractors.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
              {success}
            </div>
          )}

          <div className="space-y-8">
            {/* Stake Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stake Information
              </label>
              <textarea
                value={stake}
                onChange={(e) => setStake(e.target.value)}
                placeholder="Describe your stakes, investments, or project commitment..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
              />
            </div>

            {/* Availability Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Availability
              </label>
              <textarea
                value={availability}
                onChange={(e) => setAvailability(e.target.value)}
                placeholder="Describe your availability, schedule, and capacity..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
              />
            </div>

            {/* Contractors Section */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Potential Contractors
                </label>
                <button
                  onClick={addContractor}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add Contractor
                </button>
              </div>
              
              {contractors.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  No contractors added yet. Click "Add Contractor" to get started.
                </p>
              ) : (
                <div className="space-y-4">
                  {contractors.map((contractor, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="font-medium text-gray-900">Contractor {index + 1}</h4>
                        <button
                          onClick={() => removeContractor(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                          type="text"
                          value={contractor.name}
                          onChange={(e) => updateContractor(index, 'name', e.target.value)}
                          placeholder="Contractor name"
                          className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <input
                          type="text"
                          value={contractor.contact_info || ''}
                          onChange={(e) => updateContractor(index, 'contact_info', e.target.value)}
                          placeholder="Contact info"
                          className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <input
                          type="text"
                          value={contractor.specialization || ''}
                          onChange={(e) => updateContractor(index, 'specialization', e.target.value)}
                          placeholder="Specialization"
                          className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <input
                          type="text"
                          value={contractor.notes || ''}
                          onChange={(e) => updateContractor(index, 'notes', e.target.value)}
                          placeholder="Notes"
                          className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sharing Section */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Sharing Settings</h3>
              
              <div className="space-y-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    className="mr-3 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-gray-700">Make vault publicly visible</span>
                </label>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Share with specific users (comma-separated user IDs)
                  </label>
                  <input
                    type="text"
                    value={sharedUsers}
                    onChange={(e) => setSharedUsers(e.target.value)}
                    placeholder="user1, user2, user3"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-6 border-t border-gray-200">
              <button
                onClick={saveVault}
                disabled={loading}
                className="w-full md:w-auto px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Saving...' : 'Save Vault'}
              </button>
            </div>

            {/* Vault Info */}
            {vault && (
              <div className="pt-6 border-t border-gray-200 text-sm text-gray-500">
                <p>Last updated: {new Date(vault.updated_at).toLocaleString()}</p>
                <p>Created: {new Date(vault.created_at).toLocaleString()}</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}