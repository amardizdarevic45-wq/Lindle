import Image from 'next/image';
import Link from 'next/link';
import AuthButton from './AuthButton';

export default function Header() {
  return (
    <header className="bg-transparent backdrop-blur-sm border-b border-white/20 flex items-start justify-between max-w-7xl mx-auto pt-1 pb-2 w-full">
      {/* Logo */}
      <div className="flex items-start -mt-2 -ml-2">
        <Link href="/">
          <Image src="/lindle-logo-transparent.png" alt="Lindle Logo" width={200} height={120} className="" />
        </Link>
      </div>
      {/* Nav Links and Auth */}
      <div className="flex items-center space-x-8 pt-2 pr-2 mt-6">
        <nav className="hidden md:flex space-x-8 text-black">
          <Link href="/analyze" className="hover:underline">Analyze</Link>
          <Link href="/contracts" className="hover:underline">My Contracts</Link>
          <Link href="/reputation" className="hover:underline">Reputation</Link>
          <Link href="/pricing" className="hover:underline">Subscription</Link>
        </nav>
        <AuthButton />
      </div>
    </header>
  );
} 