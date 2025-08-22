import React from 'react';

const Navigation = ({ activeTab, setActiveTab }) => {
  const handleTabClick = (tab) => {
    setActiveTab(tab);
  };

  return (
    <nav className="bg-white shadow-sm border-b mb-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <img src="/lindle-logo-transparent.png" alt="Lindle" className="w-20 h-8" />
            <div className="flex space-x-6">
              <button
                onClick={() => handleTabClick('analyze')}
                className={`px-4 py-2 text-sm font-medium border-b-2 ${
                  activeTab === 'analyze'
                    ? 'border-[#0066FF] text-[#0066FF]'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Analyze Contract
              </button>
              <button
                onClick={() => handleTabClick('reputation')}
                className={`px-4 py-2 text-sm font-medium border-b-2 ${
                  activeTab === 'reputation'
                    ? 'border-[#0066FF] text-[#0066FF]'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Reputation Tracker
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;