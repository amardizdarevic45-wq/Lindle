'use client';

import { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import Image from 'next/image';
import Link from 'next/link';

interface WaitingListFormData {
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
}

export default function WaitingListPage() {
  const [formData, setFormData] = useState<WaitingListFormData>({
    email: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Add document to Firebase
      const docRef = await addDoc(collection(db, 'waitingList'), {
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phoneNumber: formData.phoneNumber || null,
        timestamp: new Date(),
      });

      console.log('Document written with ID: ', docRef.id);
      setIsSubmitted(true);
    } catch (err) {
      console.error('Error adding document: ', err);
      // Check if it's a network or Firebase connection error
      if (err && typeof err === 'object' && 'code' in err) {
        const firebaseError = err as { code: string; message: string };
        if (firebaseError.code === 'unavailable' || firebaseError.code === 'permission-denied') {
          setError('Unable to connect to the database. Please check your internet connection and try again.');
        } else {
          setError('Failed to submit form. Please try again.');
        }
      } else {
        setError('Failed to submit form. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="bg-white font-sans min-h-screen">
        {/* Navigation */}
        <header className="flex items-center justify-between max-w-6xl mx-auto py-2 px-4">
          <div className="flex items-center space-x-2">
            <Link href="/">
              <Image src="/lindle-logo.png" alt="Lindle Logo" width={304} height={144} className="w-76 h-36" />
            </Link>
          </div>
        </header>

        <div className="max-w-2xl mx-auto py-20 px-4 text-center">
          <div className="bg-green-50 border border-green-200 rounded-lg p-8">
            <div className="text-green-600 text-6xl mb-4">✓</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Thank You!</h1>
            <p className="text-lg text-gray-600 mb-6">
              You&apos;ve successfully joined our waiting list. We&apos;ll notify you when Lindle is ready for you!
            </p>
            <Link
              href="/"
              className="inline-block bg-blue-600 text-white text-lg font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 transition"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white font-sans min-h-screen">
      {/* Navigation */}
      <header className="flex items-center justify-between max-w-6xl mx-auto py-2 px-4">
        <div className="flex items-center space-x-2">
          <Link href="/">
            <Image src="/lindle-logo.png" alt="Lindle Logo" width={304} height={144} className="w-76 h-36" />
          </Link>
        </div>
        <nav className="hidden md:flex space-x-8 text-black">
          <Link href="/" className="hover:underline">Home</Link>
          <Link href="/analyze" className="hover:underline">Analyze</Link>
        </nav>
      </header>

      <div className="max-w-2xl mx-auto py-10 px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Join the Waiting List</h1>
          <p className="text-lg text-gray-600">
            Be the first to know when Lindle is ready to revolutionize your contract analysis experience.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md border space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                First Name *
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                required
                value={formData.firstName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your first name"
              />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                Last Name *
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                required
                value={formData.lastName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your last name"
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              value={formData.email}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your email address"
            />
          </div>

          <div>
            <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number (Optional)
            </label>
            <input
              type="tel"
              id="phoneNumber"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your phone number"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 text-white text-lg font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Joining...' : 'Join Waiting List'}
          </button>

          <p className="text-sm text-gray-500 text-center">
            We respect your privacy and will only use your information to notify you about Lindle updates.
          </p>
        </form>
      </div>
    </div>
  );
}