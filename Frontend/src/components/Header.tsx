'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import { signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import AuthButton from './AuthButton';

export default function Header() {
  const { user, loading } = useAuth();

  const handleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Error signing in:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <header className="bg-transparent backdrop-blur-sm border-b border-white/20 flex items-start justify-between max-w-7xl mx-auto pt-1 pb-2 w-full">
      {/* Logo */}
      <div className="flex items-start -mt-2 -ml-2">
        <Link href="/">
          <Image src="/lindle-logo-transparent.png" alt="Lindle Logo" width={200} height={120} className="" />
        </Link>
      </div>
      {/* Nav Links */}
      <nav className="hidden md:flex items-center space-x-8 text-black pt-2 pr-2 mt-6">
        <Link href="/analyze" className="hover:underline">Analyze</Link>
        <Link href="/vault" className="hover:underline">Vault</Link>
        <Link href="/contracts" className="hover:underline">My Contracts</Link>
        <Link href="/reputation" className="hover:underline">Reputation</Link>
        <Link href="/pricing" className="hover:underline">Subscription</Link>
        
        {!loading && (
          <>
            {user ? (
              <div className="flex items-center space-x-4">
                <Link href="/profile" className="hover:underline">Profile</Link>
                <button
                  onClick={handleSignOut}
                  className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-lg transition-colors"
                >
                  Sign Out
                </button>
                {user.photoURL && (
                  <Image
                    src={user.photoURL}
                    alt="Profile"
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                )}
              </div>
            ) : (
              <button
                onClick={handleSignIn}
                className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg transition-colors"
              >
                Sign In
              </button>
            )}
          </>
        )}
        <Link href="/register" className="hover:underline">Register</Link>
        <Link href="/login" className="hover:underline">Login</Link>
      </nav>
    </header>
  );
} 