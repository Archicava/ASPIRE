'use client';

import { FormEvent, useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';

import { Hero } from '@/components/hero';
import { useAuth } from '@/components/auth-context';
import { useToast } from '@/components/toast';

type UserRecord = {
  username: string;
  role?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

type UsersResponse = {
  success: boolean;
  users?: UserRecord[];
  error?: string;
};

type MutationResponse = {
  success: boolean;
  user?: UserRecord;
  error?: string;
};

const roleOptions = ['admin', 'user'] as const;

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [createUsername, setCreateUsername] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [createDisplayName, setCreateDisplayName] = useState('');
  const [createRole, setCreateRole] = useState<(typeof roleOptions)[number]>('user');
  const [creating, setCreating] = useState(false);

  const [editUser, setEditUser] = useState<UserRecord | null>(null);
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editRole, setEditRole] = useState<(typeof roleOptions)[number]>('user');
  const [updating, setUpdating] = useState(false);
  const [passwordUsername, setPasswordUsername] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (!authLoading && user && !isAdmin) {
      router.replace('/workspace');
    }
  }, [authLoading, user, isAdmin, router]);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/users', { credentials: 'include' });
      const data = (await response.json().catch(() => null)) as UsersResponse | null;
      if (!response.ok || !data?.success) {
        throw new Error(data?.error || 'Unable to load users');
      }
      setUsers(data.users ?? []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to load users';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  const handleCreateSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!createUsername.trim() || !createPassword.trim()) {
      toast.show({ title: 'Username and password are required', tone: 'danger' });
      return;
    }
    setCreating(true);
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: createUsername.trim(),
          password: createPassword,
          role: createRole,
          displayName: createDisplayName.trim() || undefined,
        }),
      });
      const data = (await response.json().catch(() => null)) as MutationResponse | null;
      if (!response.ok || !data?.success) {
        throw new Error(data?.error || 'Failed to create user');
      }
      toast.show({ title: 'User created', tone: 'success' });
      setCreateUsername('');
      setCreatePassword('');
      setCreateDisplayName('');
      setCreateRole('user');
      fetchUsers();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create user';
      toast.show({ title: 'Create failed', description: message, tone: 'danger' });
    } finally {
      setCreating(false);
    }
  };

  const handleEditStart = (record: UserRecord) => {
    setEditUser(record);
    setEditDisplayName(
      typeof record.metadata?.displayName === 'string' ? record.metadata.displayName : ''
    );
    setEditRole((record.role === 'admin' ? 'admin' : 'user') as (typeof roleOptions)[number]);
  };

  const handleEditSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editUser) {
      return;
    }
    setUpdating(true);
    try {
      const response = await fetch('/api/users', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: editUser.username,
          role: editRole,
          displayName: editDisplayName,
        }),
      });
      const data = (await response.json().catch(() => null)) as MutationResponse | null;
      if (!response.ok || !data?.success) {
        throw new Error(data?.error || 'Failed to update user');
      }
      toast.show({ title: 'User updated', tone: 'success' });
      setEditUser(null);
      fetchUsers();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update user';
      toast.show({ title: 'Update failed', description: message, tone: 'danger' });
    } finally {
      setUpdating(false);
    }
  };

  const handlePasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!passwordUsername || !currentPassword || !newPassword) {
      toast.show({ title: 'All password fields are required', tone: 'danger' });
      return;
    }
    setChangingPassword(true);
    try {
      const response = await fetch('/api/users', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: passwordUsername,
          currentPassword,
          newPassword,
        }),
      });
      const data = (await response.json().catch(() => null)) as MutationResponse | null;
      if (!response.ok || !data?.success) {
        throw new Error(data?.error || 'Failed to change password');
      }
      toast.show({ title: 'Password updated', tone: 'success' });
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to change password';
      toast.show({ title: 'Password change failed', description: message, tone: 'danger' });
    } finally {
      setChangingPassword(false);
    }
  };

  const formattedUsers = useMemo(() => {
    return users.map((record) => ({
      ...record,
      displayName:
        typeof record.metadata?.displayName === 'string' ? record.metadata.displayName : '',
    }));
  }, [users]);

  useEffect(() => {
    if (!passwordUsername && formattedUsers.length > 0) {
      setPasswordUsername(formattedUsers[0].username);
    }
  }, [formattedUsers, passwordUsername]);

  if (authLoading || !user) {
    return null;
  }

  if (!isAdmin) {
    return (
      <main className="page-shell">
        <Hero
          title="Admin access required"
          subtitle="Your account does not have permission to manage users."
        />
      </main>
    );
  }

  return (
    <main className="page-shell">
      <Hero
        title="Admin console"
        subtitle="Provision and manage operator accounts backed by CStore auth."
      />

      <section className="card" style={{ padding: 'clamp(1.2rem, 4vw, 1.5rem)' }}>
        <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Create user</h2>
        <p style={{ margin: '0.4rem 0 1rem', color: 'var(--color-text-secondary)' }}>
          New credentials are hashed and stored in CStore. Share passwords securely.
        </p>
        <form
          onSubmit={handleCreateSubmit}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1rem',
            alignItems: 'end',
          }}
        >
          <label style={labelStyle}>
            <span>Username</span>
            <input
              value={createUsername}
              onChange={(event) => setCreateUsername(event.target.value)}
              placeholder="operator@clinic"
              style={inputStyle}
            />
          </label>
          <label style={labelStyle}>
            <span>Password</span>
            <input
              type="password"
              value={createPassword}
              onChange={(event) => setCreatePassword(event.target.value)}
              placeholder="Temporary password"
              style={inputStyle}
            />
          </label>
          <label style={labelStyle}>
            <span>Display name</span>
            <input
              value={createDisplayName}
              onChange={(event) => setCreateDisplayName(event.target.value)}
              placeholder="Dr. Ionescu"
              style={inputStyle}
            />
          </label>
          <label style={labelStyle}>
            <span>Role</span>
            <select
              value={createRole}
              onChange={(event) => setCreateRole(event.target.value as (typeof roleOptions)[number])}
              style={inputStyle}
            >
              {roleOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            disabled={creating}
            style={{
              ...buttonStyle,
              opacity: creating ? 0.6 : 1,
            }}
          >
            {creating ? 'Creating…' : 'Create user'}
          </button>
        </form>
      </section>

      <section className="card" style={{ padding: 'clamp(1.2rem, 4vw, 1.5rem)' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Users</h2>
            <p style={{ margin: '0.3rem 0 0', color: 'var(--color-text-secondary)' }}>
              {loading ? 'Loading accounts…' : `${formattedUsers.length} active accounts`}
            </p>
          </div>
          <button
            type="button"
            onClick={fetchUsers}
            style={{
              ...buttonStyle,
              background: 'var(--color-card)',
              color: 'var(--color-text-primary)',
            }}
          >
            Refresh
          </button>
        </header>

        {error ? (
          <div style={{ marginTop: '1rem', color: 'var(--color-danger)' }}>{error}</div>
        ) : (
          <div style={{ marginTop: '1rem', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--color-border)' }}>
                  <th style={thStyle}>Username</th>
                  <th style={thStyle}>Display name</th>
                  <th style={thStyle}>Role</th>
                  <th style={thStyle}>Created</th>
                  <th style={thStyle}>Updated</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {formattedUsers.map((record) => (
                  <tr key={record.username} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={tdStyle}>{record.username}</td>
                    <td style={tdStyle}>{record.displayName || '-'}</td>
                    <td style={tdStyle}>{record.role ?? 'user'}</td>
                    <td style={tdStyle}>{formatDate(record.createdAt)}</td>
                    <td style={tdStyle}>{formatDate(record.updatedAt)}</td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={() => handleEditStart(record)}
                        style={{
                          ...buttonStyle,
                          background: 'transparent',
                          color: 'var(--color-accent)',
                          border: '1px solid transparent',
                        }}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
                {!loading && formattedUsers.length === 0 ? (
                  <tr>
                    <td style={{ ...tdStyle, padding: '1rem 0' }} colSpan={6}>
                      No users found. Create the first account above.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="card" style={{ padding: 'clamp(1.2rem, 4vw, 1.5rem)' }}>
        <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Change password</h2>
        <p style={{ margin: '0.4rem 0 1rem', color: 'var(--color-text-secondary)' }}>
          Provide the current password to rotate credentials. Admins can change any user if they know the current password.
        </p>
        <form
          onSubmit={handlePasswordSubmit}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1rem',
            alignItems: 'end',
          }}
        >
          <label style={labelStyle}>
            <span>User</span>
            <select
              value={passwordUsername}
              onChange={(event) => setPasswordUsername(event.target.value)}
              style={inputStyle}
            >
              {formattedUsers.map((record) => (
                <option key={record.username} value={record.username}>
                  {record.username}
                </option>
              ))}
            </select>
          </label>
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
          <button
            type="submit"
            disabled={changingPassword || formattedUsers.length === 0}
            style={{ ...buttonStyle, opacity: changingPassword ? 0.6 : 1 }}
          >
            {changingPassword ? 'Updating…' : 'Change password'}
          </button>
        </form>
      </section>

      {editUser ? (
        <section className="card" style={{ padding: 'clamp(1.2rem, 4vw, 1.5rem)' }}>
          <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Edit user</h2>
          <p style={{ margin: '0.4rem 0 1rem', color: 'var(--color-text-secondary)' }}>
            Update role or display name for {editUser.username}.
          </p>
          <form
            onSubmit={handleEditSubmit}
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1rem',
              alignItems: 'end',
            }}
          >
            <label style={labelStyle}>
              <span>Display name</span>
              <input
                value={editDisplayName}
                onChange={(event) => setEditDisplayName(event.target.value)}
                placeholder="Operator display name"
                style={inputStyle}
              />
            </label>
            <label style={labelStyle}>
              <span>Role</span>
              <select
                value={editRole}
                onChange={(event) => setEditRole(event.target.value as (typeof roleOptions)[number])}
                style={inputStyle}
              >
                {roleOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setEditUser(null)}
                style={{
                  ...buttonStyle,
                  background: 'transparent',
                  color: 'var(--color-text-primary)',
                }}
              >
                Cancel
              </button>
              <button type="submit" disabled={updating} style={{ ...buttonStyle, opacity: updating ? 0.6 : 1 }}>
                {updating ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </form>
        </section>
      ) : null}
    </main>
  );
}

function formatDate(value: string) {
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

const labelStyle: CSSProperties = {
  display: "grid",
  gap: "0.35rem",
  fontWeight: 600,
};

const inputStyle: CSSProperties = {
  padding: '0.75rem 0.9rem',
  borderRadius: '10px',
  border: '1px solid var(--color-border)',
  background: 'rgba(232, 241, 255, 0.92)',
  fontSize: '0.95rem',
};

const buttonStyle: CSSProperties = {
  padding: '0.7rem 1.4rem',
  borderRadius: '999px',
  background: 'var(--color-accent)',
  color: 'white',
  fontWeight: 600,
  border: 'none',
  cursor: 'pointer',
};

const thStyle: CSSProperties = {
  padding: '0.75rem 0.5rem',
  fontSize: '0.75rem',
  textTransform: 'uppercase',
  color: 'var(--color-text-secondary)',
  letterSpacing: '0.05em',
};

const tdStyle: CSSProperties = {
  padding: '0.8rem 0.5rem',
  color: 'var(--color-text-primary)',
  fontSize: '0.9rem',
};
