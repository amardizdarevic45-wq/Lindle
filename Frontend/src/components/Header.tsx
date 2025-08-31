'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from './AuthProvider';
import AuthButton from './AuthButton';

export default function Header() {
  const { user, loading, signIn, signOut } = useAuth();

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
        <Link href="/reputation" className="hover:underline">Reputation</Link>
        <Link href="/pricing" className="hover:underline">Subscription</Link>

        {/* Only show Vault and My Contracts for registered users */}
        {!loading && user && (
          <>
            <Link href="/vault" className="hover:underline">Vault</Link>
            <Link href="/contracts" className="hover:underline">My Contracts</Link>
          </>
        )}

        <>
          {user ? (
            <div className="flex items-center space-x-4">
              <Link href="/profile" className="hover:underline">Profile</Link>
                              <button
                  onClick={signOut}
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
            <div className="flex items-center space-x-4">
              <Link href="/register" className="hover:underline">Register</Link>
              <Link href="/login" className="hover:underline">Login</Link>
            </div>
          )}
        </>

      </nav>
    </header>
  );
} 