import React, { useState } from 'react';

const ContractAnalysis = () => {
  const [file, setFile] = useState(null);
  const [role, setRole] = useState('freelancer');
  const [riskTolerance, setRiskTolerance] = useState('standard');
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
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
      setLoading(true);
      setStatus('Analyzing…');

      const response = await fetch('http://127.0.0.1:8000/analyze', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
      setAnalysis(data);
      setStatus('');
    } catch (err) {
      setStatus('');
      alert('Failed to analyze contract: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadPdf = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('role', role);
    formData.append('risk_tolerance', riskTolerance);

    try {
      const response = await fetch('http://127.0.0.1:8000/analyze_pdf', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = 'contract_analysis.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to download PDF: ' + err.message);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-4 px-4">
      <div className="flex flex-col items-center mb-8">
        <h1 className="text-3xl font-bold text-[#0066FF]">Smart. Clear. Fun</h1>
        <p className="text-gray-600 text-center mt-2">
          Upload a contract to get a summary, red flags, and pushback suggestions.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md space-y-4">
        <input
          type="file"
          onChange={handleFileChange}
          accept=".pdf,.docx,.txt"
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
            disabled={loading}
            className="bg-blue-600 text-white px-8 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Analyzing...' : 'Analyze Contract'}
          </button>
        </div>
        
        {status && <p className="text-sm text-gray-500">{status}</p>}
      </form>

      {analysis && (
        <div className="mt-8">
          {/* Counterparty Information */}
          {analysis.counterparty && (
            <div className="mb-6 rounded-xl border-l-4 border-[#28C76F] bg-white p-6 shadow-lg">
              <h3 className="font-semibold">Counterparty Information</h3>
              <div className="text-gray-700 mt-2">
                <p><strong>Name:</strong> {analysis.counterparty}</p>
                <p><strong>Type:</strong> {analysis.counterparty_type}</p>
                {analysis.industry && <p><strong>Industry:</strong> {analysis.industry}</p>}
              </div>
            </div>
          )}

          <div className="mb-6 rounded-xl border-l-4 border-[#1d7bf7] bg-white p-6 shadow-lg">
            <h3 className="font-semibold">Summary</h3>
            <p className="text-gray-700">{analysis.summary}</p>
          </div>

          <div className="mb-6 rounded-xl border-l-4 border-[#FFB400] bg-white p-6 shadow-lg">
            <h3 className="font-semibold">Red Flags</h3>
            <ul className="list-disc list-outside pl-5 text-gray-700">
              {analysis.red_flags?.map((flag, index) => (
                <li key={index}>{flag}</li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border-l-4 border-[#28C76F] bg-white p-6 shadow-lg">
            <h3 className="font-semibold">Pushbacks</h3>
            <ul className="list-disc list-outside pl-5 text-gray-700">
              {analysis.pushbacks?.map((pushback, index) => (
                <li key={index}>{pushback}</li>
              ))}
            </ul>
          </div>

          {/* Download Section */}
          <div className="mt-8 text-center">
            <button
              onClick={downloadPdf}
              className="bg-emerald-600 text-white px-6 py-3 rounded hover:bg-emerald-700"
            >
              Download PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContractAnalysis;