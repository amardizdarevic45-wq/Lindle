'use client';

import { useState, useEffect } from 'react';
import Header from '../../components/Header';
import DocumentAccessManager from '../../components/DocumentAccessManager';

export default function AccessApprovalPage() {
  return (
    <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 min-h-screen">
      <main className="max-w-7xl mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Document Access Management
          </h1>
          <p className="text-gray-600">
            Request access to documents and manage approval workflows
          </p>
        </div>
        <DocumentAccessManager />
      </main>
    </div>
  );
}