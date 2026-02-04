'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import { useAuth } from '@/components/auth-context';

const navLinks = [
  { href: '/predict', label: 'Predictive Lab' },
  { href: '/cases', label: 'Case Library' },
  { href: '/research/insights', label: 'Research' },
  { href: '/download', label: 'Download' },
];

const publicLinks = [{ href: '/download', label: 'Download' }];

export function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isAdmin = user?.role === 'admin';
  const baseLinks = user ? navLinks : publicLinks;
  const links = isAdmin ? [...baseLinks, { href: '/admin', label: 'Admin' }] : baseLinks;
  const brandHref = user ? '/workspace' : '/';
  const ctaHref = user ? '/cases/new' : '/login';
  const ctaLabel = user ? 'New case' : 'Enter workspace';

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  return (
    <nav className={`card nav-shell ${isMenuOpen ? 'nav-open' : ''}`}>
      <div className="nav-left">
        <Link href={brandHref} className="nav-brand">
          <img
            src="/AspireLogo.svg"
            alt="Aspire logo"
            style={{
              height: '52px',
              width: 'auto',
              objectFit: 'contain',
              display: 'block'
            }}
          />
        </Link>
      </div>
      <button
        type="button"
        className="nav-toggle"
        aria-expanded={isMenuOpen}
        aria-controls="nav-menu"
        aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
        onClick={() => setIsMenuOpen((open) => !open)}
      >
        <span className="nav-toggle-bar" />
        <span className="nav-toggle-bar" />
        <span className="nav-toggle-bar" />
      </button>
      <div className="nav-menu" id="nav-menu">
        <div className="nav-links">
          <div className="nav-divider" aria-hidden="true" />
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="nav-link"
                style={{
                  padding: 'clamp(0.45rem, 2.3vw, 0.5rem) clamp(0.65rem, 3vw, 0.85rem)',
                  borderRadius: '0.75rem',
                  fontWeight: 600,
                  fontSize: 'clamp(0.85rem, 2.4vw, 0.95rem)',
                  color: isActive ? 'white' : 'var(--color-text-secondary)',
                  background: isActive ? 'var(--color-accent)' : 'transparent',
                  transition: 'background 150ms ease, color 150ms ease'
                }}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
        <div className="nav-right">
          {user ? (
            <div className="nav-user-card">
              <Link
                href="/account"
                className="nav-user"
                style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}
              >
                <div
                  aria-hidden="true"
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    display: 'grid',
                    placeItems: 'center',
                    background: 'linear-gradient(135deg, rgba(29,78,216,0.9), rgba(96,165,250,0.95))',
                    color: 'white',
                    fontWeight: 700,
                    letterSpacing: '0.03em'
                  }}
                  title={user.displayName || 'Operator'}
                >
                  {getInitials(user.displayName || 'Operator')}
                </div>
                <p style={{ margin: 0, fontWeight: 700, fontSize: 'clamp(0.85rem, 2.4vw, 0.95rem)' }}>
                  {user.displayName || 'Operator'}
                </p>
              </Link>
              <button
                type="button"
                onClick={() => {
                  logout();
                  router.replace('/login');
                }}
                style={{
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-card)',
                  padding: 'clamp(0.45rem, 2.3vw, 0.5rem) clamp(0.75rem, 3.2vw, 1.0rem)',
                  borderRadius: '0.75rem',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: 'clamp(0.85rem, 2.4vw, 0.95rem)',
                  whiteSpace: 'nowrap'
                }}
              >
                Log out
              </button>
            </div>
          ) : null}
          <Link href={ctaHref} className="nav-cta">
            {ctaLabel}
          </Link>
        </div>
      </div>
    </nav>
  );
}

function getInitials(name: string) {
  if (!name) return 'O';
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const second = parts[1]?.[0] ?? '';
  return (first + second || first || 'O').toUpperCase();
}
