"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import { useAuth } from '@/components/auth-context';
import { formatDateTime } from '@/lib/format';
import { CaseRecord } from '@/lib/types';

type CaseListProps = {
  title: string;
  cases: CaseRecord[];
  showActions?: boolean;
  enablePagination?: boolean;
  pageSize?: number;
};

export function CaseList({
  title,
  cases,
  showActions = true,
  enablePagination = false,
  pageSize = 6
}: CaseListProps) {
  const { user } = useAuth();
  const router = useRouter();
  const isAdmin = user?.role === 'admin';
  const [removingId, setRemovingId] = useState<string | null>(null);

  const orderedCases = useMemo(
    () =>
      [...cases].sort(
        (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
      ),
    [cases]
  );

  const [page, setPage] = useState(1);

  const handleRemoveCase = async (caseId: string) => {
    if (!confirm('Are you sure you want to remove this case? This action cannot be undone.')) {
      return;
    }

    setRemovingId(caseId);
    try {
      const response = await fetch(`/api/cases/${caseId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        router.refresh();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to remove case');
      }
    } catch (error) {
      console.error('Failed to remove case:', error);
      alert('Failed to remove case');
    } finally {
      setRemovingId(null);
    }
  };
  const totalPages = enablePagination
    ? Math.max(1, Math.ceil(orderedCases.length / pageSize))
    : 1;
  const currentPage = Math.min(page, totalPages);
  const startIndex = enablePagination ? (currentPage - 1) * pageSize : 0;
  const endIndex = enablePagination ? startIndex + pageSize : orderedCases.length;
  const displayedCases = orderedCases.slice(startIndex, endIndex);

  return (
    <section
      className="card"
      style={{ padding: 'clamp(1.2rem, 4vw, 1.5rem)', display: 'grid', gap: '1.1rem' }}
    >
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}
      >
        <div>
          <p className="section-title">Case library</p>
          <h2 style={{ margin: '0.35rem 0 0', fontSize: 'clamp(1.15rem, 3.3vw, 1.35rem)', fontWeight: 600 }}>
            {title}
          </h2>
        </div>
        {showActions ? (
          <Link
            href="/cases/new"
            className="pill"
            style={{
              background: 'var(--color-accent)',
              color: 'white'
            }}
          >
            New submission
          </Link>
        ) : null}
      </header>
      <div style={{ display: 'grid', gap: '1rem' }}>
        {displayedCases.map((item) => {
          // Extract inference values
          const inf = item.inference;
          const prob = inf && typeof inf.probability === 'number' ? inf.probability : null;
          const pred = inf
            ? typeof inf.prediction === 'string' ? inf.prediction
              : typeof (inf.prediction as any)?.prediction === 'string' ? (inf.prediction as any).prediction
              : null
            : null;
          const risk = inf ? (inf.riskLevel || (inf as any).risk_level) : null;
          const riskColor = risk === 'high' ? 'rgb(220, 38, 38)'
            : risk === 'medium' ? 'rgb(217, 119, 6)'
            : 'rgb(22, 163, 74)';
          const riskBg = risk === 'high' ? 'rgba(239, 68, 68, 0.1)'
            : risk === 'medium' ? 'rgba(245, 158, 11, 0.1)'
            : 'rgba(34, 197, 94, 0.1)';

          return (
            <article
              key={item.id}
              style={{
                padding: '1.25rem 1.35rem',
                borderRadius: '1rem',
                border: '1px solid var(--color-border)',
                background: 'var(--color-card)',
                display: 'grid',
                gridTemplateColumns: prob !== null ? '1fr auto' : '1fr',
                gap: '1rem',
                alignItems: 'center'
              }}
            >
              {/* Left: Case Info */}
              <div style={{ display: 'grid', gap: '0.6rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                  <strong style={{ fontSize: '1.1rem' }}>{item.demographics.caseLabel}</strong>
                </div>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                  <span>{item.demographics.ageMonths} months</span>
                  <span>{item.demographics.sex}</span>
                  <span>{formatDateTime(item.submittedAt)}</span>
                </div>
                {item.notes && (
                  <p style={{
                    margin: 0,
                    color: 'var(--color-text-secondary)',
                    fontSize: '0.9rem',
                    lineHeight: 1.5,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical'
                  }}>
                    {item.notes}
                  </p>
                )}
                {showActions && (
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <Link
                      href={`/cases/${item.id}`}
                      style={{ fontWeight: 600, color: 'var(--color-accent)', fontSize: '0.9rem' }}
                    >
                      View details →
                    </Link>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => handleRemoveCase(item.id)}
                        disabled={removingId === item.id}
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: 0,
                          fontWeight: 600,
                          color: 'rgb(220, 38, 38)',
                          fontSize: '0.9rem',
                          cursor: removingId === item.id ? 'not-allowed' : 'pointer',
                          opacity: removingId === item.id ? 0.5 : 1
                        }}
                      >
                        {removingId === item.id ? 'Removing...' : 'Remove'}
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Right: Prediction Result */}
              {prob !== null && (
                <div
                  style={{
                    padding: '1rem 1.25rem',
                    borderRadius: '0.85rem',
                    background: riskBg,
                    minWidth: '140px',
                    textAlign: 'center'
                  }}
                >
                  <div style={{
                    fontSize: '0.7rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: 'var(--color-text-secondary)',
                    marginBottom: '0.35rem',
                    fontWeight: 600
                  }}>
                    Prediction
                  </div>
                  <div style={{
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    color: riskColor,
                    marginBottom: '0.5rem'
                  }}>
                    {pred}
                  </div>
                  {/* Mini probability bar */}
                  <div style={{
                    height: '6px',
                    borderRadius: '3px',
                    background: 'rgba(0,0,0,0.08)',
                    overflow: 'hidden',
                    marginBottom: '0.35rem'
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${prob * 100}%`,
                      background: riskColor,
                      borderRadius: '3px',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                  <div style={{
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    color: riskColor
                  }}>
                    {(prob * 100).toFixed(1)}%
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>
      {enablePagination && orderedCases.length > pageSize ? (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '0.2rem',
            flexWrap: 'wrap',
            gap: '0.75rem'
          }}
        >
          <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
            Showing {startIndex + 1}–{Math.min(endIndex, orderedCases.length)} of {orderedCases.length}
          </div>
          <div style={{ display: 'flex', gap: '0.6rem' }}>
            <button
              type="button"
              className="pill"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              style={{
                opacity: currentPage === 1 ? 0.6 : 1,
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
              }}
            >
              ← Prev
            </button>
            <span style={{ alignSelf: 'center', color: 'var(--color-text-secondary)' }}>
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              className="pill"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              style={{
                opacity: currentPage === totalPages ? 0.6 : 1,
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
              }}
            >
              Next →
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
