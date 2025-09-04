'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useAuth } from '../../components/AuthProvider';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import config from '../../../config.json'

interface AnalysisResult {
  summary: string;
  red_flags: string[];
  pushbacks: string[];
  tokens_used?: number;
  gcs_file_path?: string;
  gcs_file_url?: string;
  contract_id?: string;
}

export default function AnalyzePage() {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [role, setRole] = useState('freelancer');
  const [riskTolerance, setRiskTolerance] = useState('standard');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [status, setStatus] = useState('');
  const [contractStatus, setContractStatus] = useState<'draft' | 'negotiating' | 'signed in' | 'in progress' | 'completed'>('draft');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  // Keep the old function for backward compatibility with existing analyses
  const saveAnalysisToFirebase = async (analysisData: AnalysisResult, fileName: string) => {
    try {
      await addDoc(collection(db, 'contractAnalyses'), {
        fileName: fileName,
        role: role,
        riskTolerance: riskTolerance,
        summary: analysisData.summary,
        redFlags: analysisData.red_flags,
        pushbacks: analysisData.pushbacks,
        tokensUsed: analysisData.tokens_used,
        timestamp: new Date(),
        createdAt: new Date().toISOString(),
        userId: user?.uid || null,
        userEmail: user?.email || null,
        gcsFilePath: analysisData.gcs_file_path,  // Add GCS file path
        gcsFileUrl: analysisData.gcs_file_url,    // Add GCS file URL
      });
      console.log('Analysis saved to Firebase successfully');
    } catch (error) {
      console.error('Error saving analysis to Firebase:', error);
      // Don't throw error to avoid disrupting user experience
    }
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      alert('Please upload a file');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('role', role);
    formData.append('risk_tolerance', riskTolerance);

    try {
      setIsAnalyzing(true);
      setStatus('Analyzing…');

      const apiUrl = config.apps.API.url || 'http://127.0.0.1:8000';
      
      // Use the new endpoint that saves to Firebase if user is authenticated
      const endpoint = user ? '/analyze_with_user' : '/analyze';
      if (user) {
        formData.append('user_id', user.uid);
      }
      
      const response = await fetch(`${apiUrl}${endpoint}`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data: AnalysisResult = await response.json();
      setResult(data);
      setStatus('');

      // Only save to Firebase from frontend if not already saved by backend
      if (!user) {
        await saveAnalysisToFirebase(data, file.name);
      } else {
        // Show success message for authenticated users
        alert('Contract analyzed and saved to your dashboard! You can view it in "My Contracts"');
      }

    } catch (err) {
      setStatus('');
      alert('Failed to analyze contract: ' + (err as Error).message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!file) {
      alert('Please upload a file first.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('role', role);
    formData.append('risk_tolerance', riskTolerance);

    try {
      setIsDownloading(true);
      setStatus('Generating PDF…');

      const apiUrl = config.apps.API.url || 'http://127.0.0.1:8000';
      const response = await fetch(`${apiUrl}/analyze_pdf`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        setStatus('');
        alert('Failed to generate PDF');
        return;
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'contract_analysis.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setStatus('');
    } catch (err) {
      setStatus('');
      alert('Error downloading PDF: ' + (err as Error).message);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Desktop Layout: Form on left, Results on right */}
        <div className="flex flex-col lg:flex-row gap-8">
            {/* Form Section */}
            <div className="w-full lg:w-1/2">
              <div className="bg-white/70 backdrop-blur-sm border border-white/30 rounded-2xl shadow-xl p-6 space-y-6 sticky top-8">
                <form onSubmit={handleAnalyze} className="space-y-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Contract File</label>
                    <div className="relative">
                      <input
                        type="file"
                        accept=".pdf,.docx,.txt"
                        onChange={handleFileChange}
                        className="block w-full text-sm text-gray-700 border-2 border-dashed border-blue-200/50 bg-white/50 backdrop-blur-sm rounded-xl p-4 hover:border-blue-400/70 focus:border-blue-500 focus:outline-none transition-all file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        required
                      />
                      {file && (
                        <div className="mt-2 flex items-center text-sm text-green-600">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          {file.name}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700">Your Role</label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { value: 'freelancer', label: 'Freelancer' },
                        { value: 'consultant', label: 'Consultant' },
                        { value: 'agency', label: 'Agency' }
                      ].map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setRole(option.value)}
                          className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 backdrop-blur-sm ${
                            role === option.value
                              ? 'bg-blue-500/20 border-2 border-blue-400/50 text-blue-700 shadow-lg'
                              : 'bg-white/50 border-2 border-white/30 text-gray-700 hover:bg-blue-50/70 hover:border-blue-300/50 hover:text-blue-600'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700">Risk Tolerance</label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { value: 'cautious', label: 'Cautious' },
                        { value: 'standard', label: 'Standard' },
                        { value: 'bold', label: 'Bold' }
                      ].map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setRiskTolerance(option.value)}
                          className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 backdrop-blur-sm ${
                            riskTolerance === option.value
                              ? 'bg-emerald-500/20 border-2 border-emerald-400/50 text-emerald-700 shadow-lg'
                              : 'bg-white/50 border-2 border-white/30 text-gray-700 hover:bg-emerald-50/70 hover:border-emerald-300/50 hover:text-emerald-600'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700">Contract Status</label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { value: 'draft', label: 'Draft' },
                        { value: 'negotiating', label: 'Negotiating' },
                        { value: 'signed in', label: 'Signed In' },
                        { value: 'in progress', label: 'In Progress' },
                        { value: 'completed', label: 'Completed' }
                      ].map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setContractStatus(option.value as any)}
                          className={`px-3 py-2 rounded-full text-xs font-medium transition-all duration-200 backdrop-blur-sm ${
                            contractStatus === option.value
                              ? 'bg-purple-500/20 border-2 border-purple-400/50 text-purple-700 shadow-lg'
                              : 'bg-white/50 border-2 border-white/30 text-gray-700 hover:bg-purple-50/70 hover:border-purple-300/50 hover:text-purple-600'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-start pt-2">
                    <button
                      type="submit"
                      disabled={isAnalyzing}
                      className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-3 rounded-xl font-medium hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl backdrop-blur-sm"
                    >
                      {isAnalyzing ? 'Analyzing...' : 'Analyze Contract'}
                    </button>
                  </div>
                  {status && <p className="text-sm text-gray-500 text-left">{status}</p>}
                </form>

                {/* Authentication Notice */}
                {!user && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mt-4">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-yellow-800">
                          <strong>Sign in to save your contracts!</strong> Without signing in, you can analyze contracts but won't be able to save them to your dashboard or track their progress.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* PDF Download Section */}
                {result && (
                  <div className="pt-6 border-t border-white/30">
                    <div className="text-center">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Download Your Review</h3>
                      <button
                        type="button"
                        onClick={handleDownloadPdf}
                        disabled={isDownloading}
                        className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-6 py-3 rounded-xl font-medium hover:from-emerald-700 hover:to-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl backdrop-blur-sm"
                      >
                        {isDownloading ? 'Generating PDF...' : 'Download PDF'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Results Section */}
            <div className="w-full lg:w-1/2">
              {result ? (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900">Analysis Results</h2>

                  <div className="rounded-2xl border-l-4 border-[#1d7bf7] bg-white/70 backdrop-blur-sm border border-white/30 p-6 shadow-xl">
                    <h3 className="font-semibold text-lg mb-3 text-[#1d7bf7]">Summary</h3>
                    <p className="text-gray-700 leading-relaxed">{result.summary}</p>
                  </div>

                  <div className="rounded-2xl border-l-4 border-[#FFB400] bg-white/70 backdrop-blur-sm border border-white/30 p-6 shadow-xl">
                    <h3 className="font-semibold text-lg mb-3 text-[#FFB400]">Red Flags</h3>
                    <ul className="list-disc list-outside pl-5 text-gray-700 space-y-1">
                      {result.red_flags.map((flag, index) => (
                        <li key={index}>{flag}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-2xl border-l-4 border-[#28C76F] bg-white/70 backdrop-blur-sm border border-white/30 p-6 shadow-xl">
                    <h3 className="font-semibold text-lg mb-3 text-[#28C76F]">Pushbacks</h3>
                    <ul className="list-disc list-outside pl-5 text-gray-700 space-y-1">
                      {result.pushbacks.map((pushback, index) => (
                        <li key={index}>{pushback}</li>
                      ))}
                    </ul>
                  </div>

                  {/* File Storage Information */}
                  {result.gcs_file_url && (
                    <div className="rounded-2xl border-l-4 border-[#6F42C1] bg-white/70 backdrop-blur-sm border border-white/30 p-6 shadow-xl">
                      <h3 className="font-semibold text-lg mb-3 text-[#6F42C1]">Original File</h3>
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                          <p>File stored securely in Google Cloud Storage</p>
                          <p className="text-xs mt-1">ID: {result.gcs_file_path}</p>
                        </div>
                        <a
                          href={result.gcs_file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-purple-700 hover:to-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl"
                        >
                          Download Original
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white/70 backdrop-blur-sm border border-white/30 rounded-2xl shadow-xl p-8 text-center">
                  <div className="text-gray-400 mb-4">
                    <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Analysis Yet</h3>
                  <p className="text-gray-500">Upload a contract and click "Analyze Contract" to see results here.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
  );
} 