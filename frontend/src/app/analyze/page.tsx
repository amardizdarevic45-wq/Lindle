'use client';

import React, { useState } from 'react';
import Image from 'next/image';

interface AnalysisResult {
  summary: string;
  red_flags: string[];
  pushbacks: string[];
  tokens_used?: number;
}

export default function AnalyzePage() {
  const [file, setFile] = useState<File | null>(null);
  const [role, setRole] = useState('freelancer');
  const [riskTolerance, setRiskTolerance] = useState('standard');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [status, setStatus] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
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
      setIsDownloading(true);
      setStatus('Analyzing…');

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
      const response = await fetch(`${apiUrl}/analyze`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data: AnalysisResult = await response.json();
      setResult(data);
      setStatus('');
    } catch (err) {
      setStatus('');
      alert('Failed to analyze contract: ' + (err as Error).message);
    } finally {
      setIsAnalyzing(false);
      setIsDownloading(false);
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
      setIsAnalyzing(true);
      setStatus('Generating PDF…');

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
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
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="bg-gray-50 text-gray-900 min-h-screen">
      <div className="max-w-2xl mx-auto py-10 px-4">
        <div className="flex flex-col items-center mb-8">
          <Image 
            src="/lindle-logo-transparent.png" 
            alt="Lindle" 
            width={304} 
            height={144} 
            className="w-76 h-36" 
          />
          <h1 className="text-3xl font-bold text-[#0066FF]">Smart. Clear. Fun</h1>
          <p className="text-gray-600 text-center mt-2">
            Upload a contract to get a summary, red flags, and pushback suggestions.
          </p>
        </div>

        <form onSubmit={handleAnalyze} className="bg-white p-6 rounded-lg shadow-md space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Contract File</label>
            <div className="relative">
              <input
                type="file"
                accept=".pdf,.docx,.txt"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-700 border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-blue-400 focus:border-blue-500 focus:outline-none transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
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
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border-2 ${
                    role === option.value
                      ? 'bg-blue-100 border-blue-500 text-blue-700 shadow-md'
                      : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600'
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
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border-2 ${
                    riskTolerance === option.value
                      ? 'bg-emerald-100 border-emerald-500 text-emerald-700 shadow-md'
                      : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-600'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-center pt-2">
            <button
              type="submit"
              disabled={isAnalyzing}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg"
            >
              {isAnalyzing ? 'Analyzing...' : 'Analyze Contract'}
            </button>
          </div>
          {status && <p className="text-sm text-gray-500">{status}</p>}
        </form>

        {result && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4"></h2>

            <div className="mb-6 rounded-xl border-l-4 border-[#1d7bf7] bg-white p-6 shadow-lg">
              <h3 className="font-semibold">Summary</h3>
              <p className="text-gray-700">{result.summary}</p>
            </div>

            <div className="mb-6 rounded-xl border-l-4 border-[#FFB400] bg-white p-6 shadow-lg">
              <h3 className="font-semibold">Red Flags</h3>
              <ul className="list-disc list-outside pl-5 text-gray-700">
                {result.red_flags.map((flag, index) => (
                  <li key={index}>{flag}</li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border-l-4 border-[#28C76F] bg-white p-6 shadow-lg">
              <h3 className="font-semibold">Pushbacks</h3>
              <ul className="list-disc list-outside pl-5 text-gray-700">
                {result.pushbacks.map((pushback, index) => (
                  <li key={index}>{pushback}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {result && (
          <div className="flex min-h-screen flex-col items-center bg-gradient-to-b from-white to-[#F8FAFC] p-8 font-sans mt-8">
            <Image 
              src="/lindle-logo-transparent.png" 
              alt="Lindle Logo" 
              width={304} 
              height={144} 
              className="w-76 h-36" 
            />
            <h2 className="mb-4 text-2xl font-bold text-[#0066FF]">Download Your Review</h2>
            <div className="flex justify-center">
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={isDownloading}
                className="bg-emerald-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg"
              >
                {isDownloading ? 'Generating PDF...' : 'Download PDF'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}