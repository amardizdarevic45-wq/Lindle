'use client';

import { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import Image from 'next/image';
import Link from 'next/link';
import Header from '../../components/Header';

interface WaitingListFormData {
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
}

interface ValidationErrors {
  email?: string;
  firstName?: string;
  lastName?: string;
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
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

  const validateEmail = (email: string): string | undefined => {
    if (!email) return 'Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return 'Please enter a valid email address';
    return undefined;
  };

  const validateName = (name: string, fieldName: string): string | undefined => {
    if (!name.trim()) return `${fieldName} is required`;
    if (name.trim().length < 2) return `${fieldName} must be at least 2 characters`;
    if (!/^[a-zA-Z\s-']+$/.test(name)) return `${fieldName} can only contain letters, spaces, hyphens, and apostrophes`;
    return undefined;
  };

  const validatePhoneNumber = (phone: string): string | undefined => {
    if (!phone) return undefined; // Optional field
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    if (!phoneRegex.test(phone.replace(/[\s-()]/g, ''))) {
      return 'Please enter a valid phone number';
    }
    return undefined;
  };

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};
    
    errors.email = validateEmail(formData.email);
    errors.firstName = validateName(formData.firstName, 'First name');
    errors.lastName = validateName(formData.lastName, 'Last name');
    errors.phoneNumber = validatePhoneNumber(formData.phoneNumber || '');

    setValidationErrors(errors);
    
    // Return true if no errors
    return !Object.values(errors).some(error => error !== undefined);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear validation error for this field when user starts typing
    if (validationErrors[name as keyof ValidationErrors]) {
      setValidationErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const errors = { ...validationErrors };
    
    switch (name) {
      case 'email':
        errors.email = validateEmail(value);
        break;
      case 'firstName':
        errors.firstName = validateName(value, 'First name');
        break;
      case 'lastName':
        errors.lastName = validateName(value, 'Last name');
        break;
      case 'phoneNumber':
        errors.phoneNumber = validatePhoneNumber(value);
        break;
    }
    
    setValidationErrors(errors);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form before submission
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    setError(null);

    try {
      // Add document to Firebase
      const docRef = await addDoc(collection(db, 'waitingList'), {
        email: formData.email.trim(),
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        phoneNumber: formData.phoneNumber?.trim() || null,
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
      <div className="bg-white font-sans min-h-screen flex flex-col">
        {/* Navigation */}
        <Header />

        <main className="flex-grow">
          <div className="max-w-2xl mx-auto py-20 px-4 text-center">
            <div className="bg-green-50 border border-green-200 rounded-lg p-8">
              <div className="text-green-600 text-6xl mb-4">🎉</div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Welcome to the Lindle Family!</h1>
              <p className="text-lg text-gray-600 mb-6">
                You&apos;re now part of an exclusive group of <span className="font-semibold text-green-600">2,500+</span> professionals 
                waiting for the future of contract analysis.
              </p>
              <div className="bg-white rounded-lg p-4 mb-6 border border-green-100">
                <h3 className="font-semibold text-gray-900 mb-2">What happens next?</h3>
                <div className="text-sm text-gray-600 space-y-2">
                  <div className="flex items-center justify-center space-x-2">
                    <span className="text-blue-600">📧</span>
                    <span>Confirmation email sent to your inbox</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2">
                    <span className="text-blue-600">🔔</span>
                    <span>Updates on beta access and launch date</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2">
                    <span className="text-blue-600">🎁</span>
                    <span>Exclusive early access benefits reserved</span>
                  </div>
                </div>
              </div>
              <Link
                href="/"
                className="inline-block bg-blue-600 text-white text-lg font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 transition"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </main>

        <footer className="bg-gray-100 text-center py-4">
          <p className="text-sm text-gray-600">
            © 2025 Lindle. All rights reserved.
          </p>
        </footer>
      </div>
    );
  }

  return (
    <div className="bg-white font-sans min-h-screen flex flex-col">
      {/* Navigation */}
      <Header />

      <main className="flex-grow">
        <div className="max-w-2xl mx-auto py-10 px-4">
          <div className="text-center mb-8">
            <p className="text-lg text-gray-600 mb-6">
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
              <h2 className="text-xl font-semibold text-blue-900 mb-3">🚀 Join Early Adapters</h2>
              <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-800">
                <div className="flex items-start space-x-2">
                  <span className="text-blue-600 font-bold">✓</span>
                  <span>Priority access when we launch</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-blue-600 font-bold">✓</span>
                  <span>Exclusive beta features preview</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-blue-600 font-bold">✓</span>
                  <span>50% discount on your first month</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-blue-600 font-bold">✓</span>
                  <span>Direct feedback channel to our team</span>
                </div>
              </div>
            </div>
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
                  onBlur={handleBlur}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500 ${
                    validationErrors.firstName ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter your first name"
                />
                {validationErrors.firstName && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.firstName}</p>
                )}
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
                  onBlur={handleBlur}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500 ${
                    validationErrors.lastName ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter your last name"
                />
                {validationErrors.lastName && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.lastName}</p>
                )}
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
                onBlur={handleBlur}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500 ${
                  validationErrors.email ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter your email address"
              />
              {validationErrors.email && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.email}</p>
              )}
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
                onBlur={handleBlur}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500 ${
                  validationErrors.phoneNumber ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter your phone number (e.g., +1234567890)"
              />
              {validationErrors.phoneNumber && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.phoneNumber}</p>
              )}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || Object.values(validationErrors).some(error => error !== undefined)}
              className="w-full bg-blue-600 text-white text-lg font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Joining...' : 'Secure My Early Access'}
            </button>

            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 mb-2">
                <span>🔒</span>
                <span>SSL Secured • GDPR Compliant • No Spam</span>
              </div>
              <p className="text-sm text-gray-500">
                We respect your privacy and will only use your information to notify you about Lindle updates. 
                <br />Unsubscribe anytime with one click.
              </p>
            </div>
          </form>
        </div>
      </main>

      <footer className="bg-gray-100 text-center py-4">
        <p className="text-sm text-gray-600">
          © 2025 Lindle. All rights reserved.
        </p>
      </footer>
    </div>
  );
} 