import Header from '../../components/Header';
import ReputationTracker from '../../components/ReputationTracker';

export default function ReputationPage() {
  return (
    <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 text-gray-900 min-h-screen flex flex-col">
      {/* Navigation */}
      <Header />

      {/* Main Content */}
      <main className="flex-grow">
        <ReputationTracker />
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