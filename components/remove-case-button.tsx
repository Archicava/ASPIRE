'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { useAuth } from '@/components/auth-context';

type RemoveCaseButtonProps = {
  caseId: string;
};

export function RemoveCaseButton({ caseId }: RemoveCaseButtonProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [removing, setRemoving] = useState(false);

  const isAdmin = user?.role === 'admin';

  if (!isAdmin) {
    return null;
  }

  const handleRemove = async () => {
    if (!confirm('Are you sure you want to remove this case? This action cannot be undone.')) {
      return;
    }

    setRemoving(true);
    try {
      const response = await fetch(`/api/cases/${caseId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        router.push('/cases');
        router.refresh();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to remove case');
      }
    } catch (error) {
      console.error('Failed to remove case:', error);
      alert('Failed to remove case');
    } finally {
      setRemoving(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleRemove}
      disabled={removing}
      style={{
        padding: '0.6rem 1.1rem',
        borderRadius: '0.75rem',
        border: '1px solid rgba(220, 38, 38, 0.3)',
        background: 'rgba(239, 68, 68, 0.1)',
        fontWeight: 600,
        fontSize: '0.9rem',
        color: 'rgb(220, 38, 38)',
        cursor: removing ? 'not-allowed' : 'pointer',
        opacity: removing ? 0.5 : 1
      }}
    >
      {removing ? 'Removing...' : 'Remove case'}
    </button>
  );
}
