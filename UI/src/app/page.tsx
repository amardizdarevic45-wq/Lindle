import Image from "next/image";
import Link from "next/link";
import Header from "../components/Header";

export default function Home() {
  return (
    <div className="bg-white font-sans min-h-screen flex flex-col">
      {/* Navigation */}
      <Header />

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
      </main>

      {/* Footer */}
      <footer className="bg-gray-100 text-center py-4">
        <p className="text-sm text-gray-600">
          © 2025 Lindle. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
