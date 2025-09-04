'use client';

import React, { useState } from 'react';
import { useAuth } from '../components/AuthProvider';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';

interface LayoutWrapperProps {
  children: React.ReactNode;
}

export default function LayoutWrapper({ children }: LayoutWrapperProps) {
  const { user, loading } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header 
        onSidebarToggle={toggleSidebar}
        showSidebarToggle={!!user}
      />
      
      {/* Main Content with Sidebar */}
      <div className="flex min-h-screen pt-16">
        {/* Sidebar - only show for authenticated users */}
        {user && (
          <Sidebar 
            isOpen={isSidebarOpen}
            onToggle={toggleSidebar}
          />
        )}
        
        {/* Main Content */}
        <main className={`flex-1 transition-all duration-300 ${
          user ? 'lg:ml-64' : ''
        }`}>
          {children}
        </main>
      </div>
    </div>
  );
} 