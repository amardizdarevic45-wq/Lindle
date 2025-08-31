'use client';

import React from 'react';
import { useAuth } from './AuthProvider';

export default function AuthButton() {
  const { user, loading, signIn, signOut } = useAuth();

  if (loading) {
    return <div className="text-sm text-gray-600">Loading...</div>;
  }

  if (user) {
    return (
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          {user.photoURL && (
            <img
              src={user.photoURL}
              alt="Profile"
              className="w-8 h-8 rounded-full"
            />
          )}
          <span className="text-sm text-gray-700">
            {user.displayName || user.email}
          </span>
        </div>
        <button
          onClick={signOut}
          className="text-sm text-red-600 hover:text-red-700 hover:underline"
        >
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={signIn}
      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
    >
      Sign In with Google
    </button>
  );
}