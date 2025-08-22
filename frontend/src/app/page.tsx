import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="bg-white font-sans">
      {/* Navigation */}
      <header className="flex items-center justify-between max-w-6xl mx-auto py-2 px-4">
        {/* Logo */}
        <div className="flex items-center space-x-2">
          <Image src="/lindle-logo.png" alt="Lindle Logo" width={304} height={144} className="w-76 h-36" />
        </div>
        {/* Nav Links */}
        <nav className="hidden md:flex space-x-8 text-black">
          <Link href="/analyze" className="hover:underline">Analyze</Link>
          <Link href="/waitinglist" className="hover:underline">Join Waiting List</Link>
          <a href="#" className="hover:underline">Contact</a>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto flex flex-col-reverse md:flex-row px-4 md:px-8 py-6">
        {/* Text Content */}
        <div className="flex-1 space-y-6 mt-20">
          <h1 className="text-4xl md:text-5xl font-bold leading-tight">
            All your contracts.<br />
            One companion.<br />
            <span className="text-blue-600">Smart. Clear. Fun.</span>
          </h1>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/analyze"
              className="inline-block bg-blue-600 text-white text-lg font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 transition text-center"
            >
              Get Started
            </Link>
            <Link
              href="/waitinglist"
              className="inline-block bg-transparent border-2 border-blue-600 text-blue-600 text-lg font-semibold py-3 px-6 rounded-lg hover:bg-blue-600 hover:text-white transition text-center"
            >
              Join Waiting List
            </Link>
          </div>
        </div>
        {/* Image */}
        <div className="flex-1 flex justify-center items-start md:mt-[-50px]">
          <Image src="/illustration.png" alt="Person at laptop" width={400} height={400} className="max-w-full h-auto" />
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-100 text-center py-4 mt-12">
        <p className="text-sm text-gray-600">
          © 2025 Lindle. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
