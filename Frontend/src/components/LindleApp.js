import React, { useState } from 'react';
import Navigation from './Navigation';
import ContractAnalysis from './ContractAnalysis';
import ReputationTracker from './ReputationTracker';

const LindleApp = () => {
  const [activeTab, setActiveTab] = useState('analyze');

  return (
    <div className="bg-gray-50 text-gray-900">
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
      
      {activeTab === 'analyze' ? (
        <ContractAnalysis />
      ) : (
        <ReputationTracker />
      )}
    </div>
  );
};

export default LindleApp;