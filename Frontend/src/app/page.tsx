import Image from "next/image";
import Link from "next/link";
import Header from "../components/Header";

export default function Home() {
  return (
    <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 font-sans min-h-screen flex flex-col">
      {/* Navigation */}
      {/* Main Content Area */}
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="max-w-6xl mx-auto flex flex-col-reverse md:flex-row px-4 md:px-8 py-6">
          {/* Text Content */}
          <div className="flex-1 space-y-6 mt-20">
            <h1 className="text-4xl md:text-5xl font-bold leading-tight">
              <span className="text-gray-800">All your contracts.<br />
              One companion.<br /></span>
              <span className="text-blue-600">Smart. Clear. Fun.</span>
            </h1>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/analyze"
                className="inline-block bg-gradient-to-r from-blue-600 to-blue-700 text-white text-lg font-semibold py-3 px-6 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl text-center backdrop-blur-sm"
              >
                Get Started
              </Link>
              <Link
                href="/waitinglist"
                className="inline-block bg-white/70 backdrop-blur-sm border-2 border-blue-600 text-blue-600 text-lg font-semibold py-3 px-6 rounded-xl hover:bg-blue-600 hover:text-white transition-all duration-200 shadow-lg hover:shadow-xl text-center"
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