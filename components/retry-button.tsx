'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type RetryButtonProps = {
  caseId: string;
};

export function RetryButton({ caseId }: RetryButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleRetry = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/cases/${caseId}/retry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Retry failed');
      }

      // Refresh the page to show updated results
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to retry');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <button
        onClick={handleRetry}
        disabled={loading}
        style={{
          padding: '0.6rem 1.2rem',
          borderRadius: '0.75rem',
          background: loading ? 'var(--color-border)' : 'var(--color-accent)',
          color: 'white',
          fontWeight: 600,
          fontSize: '0.9rem',
          border: 'none',
          cursor: loading ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}
      >
        {loading ? (
          <>
            <span
              style={{
                width: '1rem',
                height: '1rem',
                border: '2px solid rgba(255,255,255,0.3)',
                borderTopColor: 'white',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}
            />
            Retrying...
          </>
        ) : (
          <>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 2v6h-6" />
              <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
              <path d="M3 22v-6h6" />
              <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
            </svg>
            Retry Analysis
          </>
        )}
      </button>
      {error && (
        <p style={{ margin: 0, color: 'rgb(220, 38, 38)', fontSize: '0.85rem' }}>
          {error}
        </p>
      )}
      <style jsx global>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
