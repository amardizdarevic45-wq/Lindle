import React, { useState, useEffect } from 'react';
import EntityModal from './EntityModal';

const ReputationTracker = () => {
  const [entities, setEntities] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOutcome, setFilterOutcome] = useState('');
  const [filterRisk, setFilterRisk] = useState('');
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadEntities = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://127.0.0.1:8000/entities');
      if (response.ok) {
        const data = await response.json();
        setEntities(data);
      }
    } catch (err) {
      console.error('Error loading entities:', err);
    } finally {
      setLoading(false);
    }
  };

  const searchEntities = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.append('name', searchQuery);
      if (filterOutcome) params.append('outcome', filterOutcome);
      if (filterRisk) {
        if (filterRisk === 'high') {
          params.append('min_score', '0');
          params.append('max_score', '39');
        } else if (filterRisk === 'low') {
          params.append('min_score', '76');
          params.append('max_score', '100');
        }
      }

      const response = await fetch(`http://127.0.0.1:8000/entities/search?${params}`);
      if (response.ok) {
        const data = await response.json();
        setEntities(data);
      }
    } catch (err) {
      console.error('Error searching entities:', err);
    } finally {
      setLoading(false);
    }
  };

  const getRiskLevel = (score) => {
    if (score < 40) return { level: 'High Risk', color: 'text-red-600', bgColor: 'bg-red-100' };
    if (score < 70) return { level: 'Medium Risk', color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
    return { level: 'Low Risk', color: 'text-green-600', bgColor: 'bg-green-100' };
  };

  const openEntityModal = (entity) => {
    setSelectedEntity(entity);
  };

  const closeEntityModal = () => {
    setSelectedEntity(null);
  };

  useEffect(() => {
    loadEntities();
  }, []);

  return (
    <div className="max-w-6xl mx-auto py-4 px-4">
      <div className="flex flex-col items-center mb-8">
        <h1 className="text-3xl font-bold text-[#0066FF]">Reputation Tracker</h1>
        <p className="text-gray-600 text-center mt-2">
          Track your clients and vendors with contract outcome history.
        </p>
      </div>

      {/* Search and Filter */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="searchQuery" className="block text-sm font-medium mb-1">
              Search Entities
            </label>
            <input
              type="text"
              id="searchQuery"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name..."
              className="w-full border rounded p-2"
            />
          </div>
          <div>
            <label htmlFor="filterOutcome" className="block text-sm font-medium mb-1">
              Filter by Outcome
            </label>
            <select
              id="filterOutcome"
              value={filterOutcome}
              onChange={(e) => setFilterOutcome(e.target.value)}
              className="w-full border rounded p-2"
            >
              <option value="">All Outcomes</option>
              <option value="Successful Completion">Successful Completion</option>
              <option value="Pending">Pending</option>
              <option value="Early Termination">Early Termination</option>
              <option value="Dispute">Dispute</option>
              <option value="Litigation">Litigation</option>
            </select>
          </div>
          <div>
            <label htmlFor="filterRisk" className="block text-sm font-medium mb-1">
              Risk Level
            </label>
            <select
              id="filterRisk"
              value={filterRisk}
              onChange={(e) => setFilterRisk(e.target.value)}
              className="w-full border rounded p-2"
            >
              <option value="">All Risk Levels</option>
              <option value="high">High Risk (&lt;40)</option>
              <option value="low">Low Risk (&gt;75)</option>
            </select>
          </div>
        </div>
        <div className="mt-4">
          <button
            onClick={searchEntities}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 mr-2"
          >
            Search
          </button>
          <button
            onClick={loadEntities}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Entities List */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="px-6 py-4 border-b">
          <h2 className="text-xl font-semibold">Entities</h2>
        </div>
        
        {loading ? (
          <div className="p-6 text-center">
            <p className="text-gray-500">Loading...</p>
          </div>
        ) : entities.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-gray-500">No entities found</p>
          </div>
        ) : (
          <div className="divide-y">
            {entities.map((entity) => {
              const risk = getRiskLevel(entity.reputation_score);
              return (
                <div
                  key={entity.id}
                  className="p-4 hover:bg-gray-50 cursor-pointer"
                  onClick={() => openEntityModal(entity)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-medium text-gray-900">{entity.name}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${risk.bgColor} ${risk.color}`}>
                          {risk.level}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        {entity.entity_type} • {entity.industry || 'No industry specified'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {entity.contract_count} contract{entity.contract_count !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900">
                        {entity.reputation_score}
                      </div>
                      <div className="text-sm text-gray-500">Score</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Entity Modal */}
      {selectedEntity && (
        <EntityModal
          entity={selectedEntity}
          onClose={closeEntityModal}
          onUpdate={loadEntities}
        />
      )}
    </div>
  );
};

export default ReputationTracker;