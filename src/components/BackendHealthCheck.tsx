"use client";

/**
 * Backend Health Check Component
 * Verifies connection to Express backend
 */

import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Loader2, AlertTriangle } from 'lucide-react';

interface HealthStatus {
  status: 'checking' | 'healthy' | 'unhealthy' | 'error';
  message: string;
  details?: any;
}

export function BackendHealthCheck() {
  const [health, setHealth] = useState<HealthStatus>({
    status: 'checking',
    message: 'Checking backend connection...',
  });

  useEffect(() => {
    checkBackendHealth();
  }, []);

  async function checkBackendHealth() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    // Check if API URL is configured
    if (!apiUrl) {
      setHealth({
        status: 'error',
        message: 'NEXT_PUBLIC_API_URL not configured in .env.local',
      });
      return;
    }

    try {
      // Extract base URL (remove /api/v1)
      const baseUrl = apiUrl.replace('/api/v1', '');
      
      const response = await fetch(`${baseUrl}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      setHealth({
        status: 'healthy',
        message: 'Backend is connected and healthy!',
        details: data,
      });
    } catch (error) {
      console.error('Backend health check failed:', error);
      
      setHealth({
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Failed to connect to backend',
        details: {
          apiUrl,
          error: String(error),
          suggestion: 'Make sure backend is running on http://localhost:3001',
        },
      });
    }
  }

  return (
    <div className="p-4 rounded-lg border bg-card">
      <div className="flex items-center gap-3">
        {health.status === 'checking' && (
          <>
            <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
            <span className="text-sm">{health.message}</span>
          </>
        )}

        {health.status === 'healthy' && (
          <>
            <CheckCircle className="h-5 w-5 text-green-500" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-600">{health.message}</p>
              {health.details && (
                <p className="text-xs text-muted-foreground mt-1">
                  Version: {health.details.version} | Uptime: {Math.floor(health.details.uptime)}s
                </p>
              )}
            </div>
          </>
        )}

        {health.status === 'unhealthy' && (
          <>
            <XCircle className="h-5 w-5 text-red-500" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-600">{health.message}</p>
              {health.details?.suggestion && (
                <p className="text-xs text-muted-foreground mt-1">
                  {health.details.suggestion}
                </p>
              )}
            </div>
            <button
              onClick={checkBackendHealth}
              className="text-xs text-blue-500 hover:underline"
            >
              Retry
            </button>
          </>
        )}

        {health.status === 'error' && (
          <>
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-600">{health.message}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Create .env.local with NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
