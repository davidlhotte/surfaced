'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error);
  }, [error]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '20px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        textAlign: 'center',
      }}
    >
      <h1 style={{ fontSize: '72px', margin: '0', color: '#d32f2f' }}>Error</h1>
      <h2 style={{ fontSize: '24px', margin: '16px 0', color: '#333' }}>
        Something went wrong
      </h2>
      <p style={{ color: '#666', maxWidth: '400px', marginBottom: '24px' }}>
        An unexpected error occurred. Please try again or contact support if the problem persists.
      </p>
      <button
        onClick={reset}
        style={{
          backgroundColor: '#5c6ac4',
          color: 'white',
          padding: '12px 24px',
          borderRadius: '8px',
          border: 'none',
          fontWeight: '500',
          cursor: 'pointer',
          fontSize: '16px',
        }}
      >
        Try Again
      </button>
    </div>
  );
}
