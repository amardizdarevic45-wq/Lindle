import Image from 'next/image';
import Link from 'next/link';

export default function Header() {
  return (
    <header className="bg-transparent backdrop-blur-sm border-b border-white/20 flex items-start justify-between max-w-7xl mx-auto pt-1 pb-2 w-full">
      {/* Logo */}
      <div className="flex items-start -mt-2 -ml-2">
        <Link href="/">
          <Image src="/lindle-logo-transparent.png" alt="Lindle Logo" width={200} height={120} className="" />
        </Link>
      </div>
      {/* Nav Links */}
      <nav className="hidden md:flex space-x-8 text-black pt-2 pr-2 mt-6">
        <Link href="/analyze" className="hover:underline">Analyze</Link>
        <Link href="/reputation" className="hover:underline">Reputation</Link>
        <Link href="/pricing" className="hover:underline">Subscription</Link>
        <Link href="/register" className="hover:underline">Register</Link>
        <Link href="/login" className="hover:underline">Login</Link>
      </nav>
    </header>
  );
} 