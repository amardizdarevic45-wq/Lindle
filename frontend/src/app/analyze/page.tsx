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

        <form onSubmit={handleAnalyze} className="bg-white p-6 rounded-lg shadow-md space-y-4">
          <input
            type="file"
            accept=".pdf,.docx,.txt"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-700"
            required
          />

          <label htmlFor="role" className="block text-sm font-medium">
            Your Role
          </label>
          <select
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="block w-full border rounded p-2"
          >
            <option value="freelancer">Freelancer</option>
            <option value="consultant">Consultant</option>
            <option value="agency">Agency</option>
          </select>

          <label htmlFor="risk_tolerance" className="block text-sm font-medium">
            Risk Tolerance
          </label>
          <select
            id="risk_tolerance"
            value={riskTolerance}
            onChange={(e) => setRiskTolerance(e.target.value)}
            className="block w-full border rounded p-2"
          >
            <option value="cautious">Cautious</option>
            <option value="standard">Standard</option>
            <option value="bold">Bold</option>
          </select>

          <div className="grid grid-cols-1 justify-center">
            <button
              type="submit"
              disabled={isAnalyzing}
              className="bg-blue-600 text-white px-8 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              Analyze Contract
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
            <div className="grid grid-cols-1 justify-center">
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={isDownloading}
                className="bg-emerald-600 text-white px-6 py-3 rounded hover:bg-emerald-700 disabled:opacity-50"
              >
                Download PDF
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}