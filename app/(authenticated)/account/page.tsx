"use client";

import { FormEvent, useEffect, useState, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/components/auth-context';
import { useToast } from '@/components/toast';

type MutationResponse = {
  success: boolean;
  error?: string;
};

export default function AccountPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [loading, user, router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) {
      return;
    }
    if (!currentPassword.trim() || !newPassword.trim()) {
      toast.show({ title: 'Both password fields are required', tone: 'danger' });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.show({ title: 'New passwords do not match', tone: 'danger' });
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/users', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: user.username,
          currentPassword,
          newPassword
        })
      });
      const data = (await response.json().catch(() => null)) as MutationResponse | null;
      if (!response.ok || !data?.success) {
        throw new Error(data?.error || 'Failed to change password');
      }
      toast.show({ title: 'Password updated', tone: 'success' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to change password';
      toast.show({ title: 'Password change failed', description: message, tone: 'danger' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !user) {
    return null;
  }

  const initials = getInitials(user.displayName || user.username);

  return (
    <main className="page-shell" style={{ gap: '0.9rem' }}>
      <section
        className="card"
        style={{
          padding: 'clamp(1.25rem, 4vw, 1.75rem)',
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(145deg, rgba(221, 233, 255, 0.92), rgba(246, 249, 255, 0.98))'
        }}
      >
        <header
          style={{
            position: 'relative',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'baseline',
            gap: '0.6rem',
            marginBottom: '0.75rem'
          }}
        >
          <span className="section-title">Account</span>
        </header>
        <div style={accentGlowStyle} aria-hidden="true" />
        <div style={accentGlowSecondaryStyle} aria-hidden="true" />
        <div
          style={{
            position: 'relative',
            display: 'grid',
            gap: '1.5rem'
          }}
        >
          <div style={{ display: 'grid', gap: '0.9rem' }}>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '1rem',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div style={{ display: 'grid', gap: '0.4rem' }}>
                <span className="pill">Security control</span>
                <h2 style={{ margin: 0, fontSize: 'clamp(1.2rem, 3vw, 1.45rem)' }}>
                  Credential vault
                </h2>
                <p style={{ margin: 0, color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                  Rotate your password to keep sessions scoped to current access policies.
                </p>
              </div>
              <div style={userCardStyle}>
                <div style={avatarStyle} aria-hidden="true">
                  {initials}
                </div>
                <div>
                  <p style={{ margin: 0, fontWeight: 700 }}>{user.displayName || 'Operator'}</p>
                  <p style={{ margin: '0.25rem 0 0', color: 'var(--color-text-secondary)' }}>
                    {user.username}
                  </p>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
              {securityNotes.map((note) => (
                <div key={note.title} style={noteChipStyle} title={note.detail}>
                  {note.title}
                </div>
              ))}
            </div>
          </div>

          <div>
            <div style={{ display: 'grid', gap: '0.75rem', marginBottom: '1.1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Change password</h3>
              <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
                Provide your current password to rotate credentials for {user.username}.
              </p>
            </div>
            <form
              onSubmit={handleSubmit}
              style={{
                display: 'grid',
                gap: '1rem',
                maxWidth: '520px'
              }}
            >
              <label style={labelStyle}>
                <span>Current password</span>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  placeholder="Current password"
                  style={inputStyle}
                />
              </label>
              <label style={labelStyle}>
                <span>New password</span>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  placeholder="New password"
                  style={inputStyle}
                />
              </label>
              <label style={labelStyle}>
                <span>Confirm new password</span>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Repeat new password"
                  style={inputStyle}
                />
              </label>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    ...buttonStyle,
                    opacity: submitting ? 0.6 : 1
                  }}
                >
                  {submitting ? 'Updating…' : 'Change password'}
                </button>
                <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                  Use 8+ characters with a mix of letters and numbers.
                </p>
              </div>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}

const labelStyle: CSSProperties = {
  display: 'grid',
  gap: '0.35rem',
  fontWeight: 600
};

const inputStyle: CSSProperties = {
  padding: '0.75rem 0.9rem',
  borderRadius: '10px',
  border: '1px solid var(--color-border)',
  background: 'rgba(255, 255, 255, 0.86)',
  fontSize: '0.95rem',
  boxShadow: '0 10px 20px -18px rgba(20, 33, 66, 0.35)'
};

const buttonStyle: CSSProperties = {
  padding: '0.7rem 1.4rem',
  borderRadius: '999px',
  background: 'var(--color-accent)',
  color: 'white',
  fontWeight: 600,
  border: 'none',
  cursor: 'pointer'
};

const userCardStyle: CSSProperties = {
  display: 'flex',
  gap: '0.85rem',
  alignItems: 'center',
  padding: '0.9rem 1rem',
  borderRadius: '14px',
  border: '1px solid rgba(29, 78, 216, 0.18)',
  background: 'rgba(255, 255, 255, 0.8)'
};

const avatarStyle: CSSProperties = {
  width: '44px',
  height: '44px',
  borderRadius: '14px',
  display: 'grid',
  placeItems: 'center',
  fontWeight: 700,
  color: 'white',
  background: 'linear-gradient(135deg, rgba(29,78,216,0.9), rgba(96,165,250,0.95))'
};

const noteChipStyle: CSSProperties = {
  padding: '0.35rem 0.75rem',
  borderRadius: '999px',
  background: 'rgba(237, 244, 255, 0.9)',
  border: '1px solid rgba(29, 78, 216, 0.16)',
  fontSize: '0.8rem',
  fontWeight: 600,
  color: 'var(--color-text-secondary)'
};

const accentGlowStyle: CSSProperties = {
  position: 'absolute',
  top: '-120px',
  right: '-80px',
  width: '260px',
  height: '260px',
  borderRadius: '50%',
  background: 'radial-gradient(circle, rgba(96,165,250,0.4), rgba(96,165,250,0))'
};

const accentGlowSecondaryStyle: CSSProperties = {
  position: 'absolute',
  bottom: '-140px',
  left: '-120px',
  width: '300px',
  height: '300px',
  borderRadius: '50%',
  background: 'radial-gradient(circle, rgba(29,78,216,0.25), rgba(29,78,216,0))'
};

const securityNotes = [
  {
    title: 'CStore-secured credentials',
    detail: 'Passwords are hashed with a server-side secret before they are stored.'
  },
  {
    title: 'Edge node session policy',
    detail: 'Tokens expire on the configured TTL to keep access tightly scoped.'
  },
  {
    title: 'Operator best practice',
    detail: 'Rotate credentials after staffing changes or access reviews.'
  }
];

function getInitials(name: string) {
  if (!name) return 'O';
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const second = parts[1]?.[0] ?? '';
  return (first + second || first || 'O').toUpperCase();
}
