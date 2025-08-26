'use client';

import { useAuth } from '../../contexts/AuthContext';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../../firebase';
import Header from '../../components/Header';
import { useState, useEffect } from 'react';

interface UserStats {
  totalContracts: number;
  pendingContracts: number;
  successfulContracts: number;
  averageScore: number;
}

export default function Profile() {
  const { user, loading } = useAuth();
  const [userStats, setUserStats] = useState<UserStats>({
    totalContracts: 0,
    pendingContracts: 0,
    successfulContracts: 0,
    averageScore: 0
  });
  const [settings, setSettings] = useState({
    emailNotifications: true,
    contractAlerts: true,
    theme: 'light',
    language: 'en'
  });

  useEffect(() => {
    // Load user statistics (mock data for now)
    if (user) {
      // In a real app, this would fetch from your backend API
      setUserStats({
        totalContracts: 15,
        pendingContracts: 3,
        successfulContracts: 11,
        averageScore: 85
      });
    }
  }, [user]);

  const handleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Error signing in:', error);
    }
  };

  const handleSettingChange = (setting: string, value: any) => {
    setSettings(prev => ({ ...prev, [setting]: value }));
    // In a real app, this would save to your backend
    console.log(`Updated ${setting} to ${value}`);
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 font-sans min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 font-sans min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <div className="bg-white/70 backdrop-blur-sm border border-white/30 rounded-2xl shadow-xl p-8 text-center max-w-md mx-4">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Sign in Required</h1>
            <p className="text-gray-600 mb-6">
              Please sign in to access your profile and manage your contracts.
            </p>
            <button
              onClick={handleSignIn}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl transition-colors font-medium"
            >
              Sign In with Google
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 font-sans min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow max-w-6xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">User Profile</h1>
          <p className="text-gray-600">
            Manage your account, contracts, and system preferences
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* User Information */}
          <div className="lg:col-span-1">
            <div className="bg-white/70 backdrop-blur-sm border border-white/30 rounded-2xl shadow-xl p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Profile Information</h2>
              
              <div className="text-center mb-6">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt="Profile"
                    className="w-20 h-20 rounded-full mx-auto mb-4 border-4 border-white shadow-lg"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full mx-auto mb-4 bg-blue-600 flex items-center justify-center">
                    <span className="text-2xl text-white font-bold">
                      {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
                    </span>
                  </div>
                )}
                <h3 className="text-lg font-medium text-gray-900">
                  {user.displayName || 'User'}
                </h3>
                <p className="text-gray-600">{user.email}</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={user.displayName || ''}
                    className="w-full border border-gray-300 rounded-lg p-2 text-gray-900 bg-white/50"
                    placeholder="Enter your name"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={user.email || ''}
                    className="w-full border border-gray-300 rounded-lg p-2 text-gray-900 bg-gray-100"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Member Since
                  </label>
                  <input
                    type="text"
                    value={user.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : 'Unknown'}
                    className="w-full border border-gray-300 rounded-lg p-2 text-gray-900 bg-gray-100"
                    readOnly
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Contract Statistics */}
            <div className="bg-white/70 backdrop-blur-sm border border-white/30 rounded-2xl shadow-xl p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Contract Overview</h2>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-blue-50 rounded-xl">
                  <div className="text-2xl font-bold text-blue-600">{userStats.totalContracts}</div>
                  <div className="text-sm text-gray-600">Total Contracts</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-xl">
                  <div className="text-2xl font-bold text-yellow-600">{userStats.pendingContracts}</div>
                  <div className="text-sm text-gray-600">Pending</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-xl">
                  <div className="text-2xl font-bold text-green-600">{userStats.successfulContracts}</div>
                  <div className="text-sm text-gray-600">Successful</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-xl">
                  <div className="text-2xl font-bold text-purple-600">{userStats.averageScore}</div>
                  <div className="text-sm text-gray-600">Avg Score</div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
                  <a href="/analyze" className="block">Analyze New Contract</a>
                </button>
                <button className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors">
                  <a href="/reputation" className="block">View All Contracts</a>
                </button>
              </div>
            </div>

            {/* Account Settings */}
            <div className="bg-white/70 backdrop-blur-sm border border-white/30 rounded-2xl shadow-xl p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Account Settings</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between py-2">
                  <div>
                    <h4 className="font-medium text-gray-900">Email Notifications</h4>
                    <p className="text-sm text-gray-600">Receive updates about your contracts</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.emailNotifications}
                      onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between py-2">
                  <div>
                    <h4 className="font-medium text-gray-900">Contract Alerts</h4>
                    <p className="text-sm text-gray-600">Get notified about contract status changes</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.contractAlerts}
                      onChange={(e) => handleSettingChange('contractAlerts', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="py-2">
                  <label className="block font-medium text-gray-900 mb-2">Theme</label>
                  <select
                    value={settings.theme}
                    onChange={(e) => handleSettingChange('theme', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2 text-gray-900 bg-white"
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="auto">Auto</option>
                  </select>
                </div>

                <div className="py-2">
                  <label className="block font-medium text-gray-900 mb-2">Language</label>
                  <select
                    value={settings.language}
                    onChange={(e) => handleSettingChange('language', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2 text-gray-900 bg-white"
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Subscription */}
            <div className="bg-white/70 backdrop-blur-sm border border-white/30 rounded-2xl shadow-xl p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Subscription</h2>
              
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-medium text-gray-900">Current Plan</h4>
                  <p className="text-sm text-gray-600">Free Plan</p>
                </div>
                <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
                  Active
                </span>
              </div>
              
              <p className="text-gray-600 mb-4">
                Upgrade to unlock more features and get unlimited contract analysis.
              </p>
              
              <button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200">
                <a href="/pricing" className="block">Upgrade Subscription</a>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white/80 backdrop-blur-sm border-t border-white/20 text-center py-4">
        <p className="text-sm text-gray-600">
          © 2025 Lindle. All rights reserved.
        </p>
      </footer>
    </div>
  );
}