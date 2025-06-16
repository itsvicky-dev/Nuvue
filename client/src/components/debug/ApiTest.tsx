'use client';

import { useState } from 'react';
import { api } from '@/lib/api';

export function ApiTest() {
  const [testResult, setTestResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const testApiConnection = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/health');
      setTestResult(`✅ API Connected: ${JSON.stringify(response.data)}`);
    } catch (error: any) {
      setTestResult(`❌ API Error: ${error.message} - ${error.response?.status || 'No response'}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <div className="fixed top-4 left-4 bg-white dark:bg-dark-surface border p-4 rounded shadow-lg z-50 max-w-md">
      <h3 className="font-bold mb-2">API Connection Test</h3>
      <button 
        onClick={testApiConnection}
        disabled={isLoading}
        className="btn-primary mb-2"
      >
        {isLoading ? 'Testing...' : 'Test API'}
      </button>
      {testResult && (
        <div className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded">
          {testResult}
        </div>
      )}
    </div>
  );
}