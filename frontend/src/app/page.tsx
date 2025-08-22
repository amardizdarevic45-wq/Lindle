'use client';

import React, { useState } from 'react';
import Image from 'next/image';

interface AnalysisResult {
  summary: string;
  red_flags: string[];
  pushbacks: string[];
  tokens_used?: number;
}

export default function Home() {
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

  const roleOptions = [
    { value: 'freelancer', label: 'Freelancer' },
    { value: 'consultant', label: 'Consultant' },
    { value: 'agency', label: 'Agency' }
  ];

  const riskToleranceOptions = [
    { value: 'cautious', label: 'Cautious' },
    { value: 'standard', label: 'Standard' },
    { value: 'bold', label: 'Bold' }
  ];

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
          {/* File Upload */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Upload Contract
            </label>
            <div className="relative">
              <input
                type="file"
                accept=".pdf,.docx,.txt"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-600 file:mr-4 file:py-3 file:px-6 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 file:cursor-pointer border-2 border-dashed border-gray-300 rounded-lg p-3 hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                required
              />
              {file && (
                <p className="mt-2 text-sm text-green-600 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {file.name} selected
                </p>
              )}
            </div>
          </div>

          {/* Role Selection */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Your Role
            </label>
            <div className="flex flex-wrap gap-2">
              {roleOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setRole(option.value)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    role === option.value
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Risk Tolerance Selection */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Risk Tolerance
            </label>
            <div className="flex flex-wrap gap-2">
              {riskToleranceOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setRiskTolerance(option.value)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    riskTolerance === option.value
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={isAnalyzing}
              className="w-full bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
            >
              {isAnalyzing ? 'Analyzing...' : 'Analyze Contract'}
            </button>
          </div>
          {status && <p className="text-sm text-gray-500 text-center">{status}</p>}
        </form>

        {result && (
          <div className="mt-8 space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Analysis Results</h2>

            <div className="rounded-xl border-l-4 border-[#1d7bf7] bg-white p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Summary</h3>
              <p className="text-gray-700 leading-relaxed">{result.summary}</p>
            </div>

            <div className="rounded-xl border-l-4 border-[#FFB400] bg-white p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Red Flags</h3>
              <ul className="list-disc list-outside pl-5 text-gray-700 space-y-1">
                {result.red_flags.map((flag, index) => (
                  <li key={index}>{flag}</li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border-l-4 border-[#28C76F] bg-white p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Pushbacks</h3>
              <ul className="list-disc list-outside pl-5 text-gray-700 space-y-1">
                {result.pushbacks.map((pushback, index) => (
                  <li key={index}>{pushback}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {result && (
          <div className="mt-8 bg-gradient-to-b from-white to-[#F8FAFC] p-8 rounded-xl shadow-lg text-center">
            <Image 
              src="/lindle-logo-transparent.png" 
              alt="Lindle Logo" 
              width={150} 
              height={71} 
              className="mx-auto mb-4" 
            />
            <h2 className="mb-4 text-xl font-bold text-[#0066FF]">Download Your Review</h2>
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isDownloading}
              className="bg-emerald-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
            >
              {isDownloading ? 'Generating PDF...' : 'Download PDF Report'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
