import { ENFORCE_MOCK_MODE } from './constants';

const rawDebug = process.env.NODE_ENV !== 'production' || process.env.DEBUG === 'true';

function ensureHttpProtocol(url: string | undefined): string | undefined {
  if (!url) {
    return undefined;
  }
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return `http://${url}`;
}

function parseChainstorePeers(value: string | undefined): string[] {
  const raw = value?.trim();
  if (!raw) {
    return [];
  }

  try {
    let cleaned = raw;

    if (cleaned.startsWith("'") && cleaned.endsWith("'")) {
      cleaned = cleaned.slice(1, -1);
    }

    cleaned = cleaned.replace(/'/g, '"');
    const parsed = JSON.parse(cleaned);

    if (!Array.isArray(parsed)) {
      throw new Error('CHAINSTORE_PEERS must be a JSON array');
    }

    return parsed.map((entry) => {
      if (typeof entry !== 'string') {
        throw new Error('CHAINSTORE_PEERS entries must be strings');
      }
      return entry;
    });
  } catch (error) {
    console.error('Failed to parse CHAINSTORE_PEERS env var:', error);
    throw error;
  }
}

const cstoreApiUrl = ensureHttpProtocol(
  process.env.R1EN_CHAINSTORE_API_URL ||
    process.env.EE_CHAINSTORE_API_URL ||
    process.env.CHAINSTORE_API_URL
);

const r1fsApiUrl = ensureHttpProtocol(
  process.env.R1EN_R1FS_API_URL || process.env.EE_R1FS_API_URL || process.env.R1FS_API_URL
);

const chainstorePeers = parseChainstorePeers(
  process.env.R1EN_CHAINSTORE_PEERS ||
    process.env.EE_CHAINSTORE_PEERS ||
    process.env.CHAINSTORE_PEERS
);

/**
 * Mock mode logic:
 * 1. If MOCK_MODE env variable is set, use its value (takes precedence)
 * 2. If MOCK_MODE env variable is not set, use ENFORCE_MOCK_MODE constant
 */
const mockMode = process.env.MOCK_MODE !== undefined
  ? process.env.MOCK_MODE === 'true'
  : ENFORCE_MOCK_MODE;

if (mockMode) {
  console.log('[config] Mock mode enabled:',
    process.env.MOCK_MODE !== undefined
      ? `via MOCK_MODE env variable (${process.env.MOCK_MODE})`
      : `via ENFORCE_MOCK_MODE constant (${ENFORCE_MOCK_MODE})`
  );
}

// Even in MOCK_MODE, we need endpoints for authentication
if (!cstoreApiUrl || !r1fsApiUrl) {
  if (mockMode) {
    console.warn('[config] MOCK_MODE enabled but endpoints not configured. Authentication will require valid endpoints.');
  }
  throw new Error(
    'Missing Ratio1 endpoints. Set R1EN_CHAINSTORE_API_URL and R1EN_R1FS_API_URL (or EE_/legacy variants).'
  );
}

// Aspire ASD Screening API configuration
const aspireApiUrl = ensureHttpProtocol(process.env.ASPIRE_API_URL) || 'http://localhost:5083';
const aspireApiEnabled = process.env.ASPIRE_API_ENABLED !== 'false';
const aspireApiTimeoutMs = parseInt(process.env.ASPIRE_API_TIMEOUT_MS || '30000', 10);

const authSessionCookieName = process.env.AUTH_SESSION_COOKIE || 'r1-session';
const parsedSessionTtl = parseInt(process.env.AUTH_SESSION_TTL_SECONDS || '86400', 10);
const authSessionTtlSeconds = Number.isFinite(parsedSessionTtl) ? parsedSessionTtl : 86400;
const cstoreAuthHkey =
  process.env.R1EN_CSTORE_AUTH_HKEY ||
  process.env.EE_CSTORE_AUTH_HKEY ||
  process.env.CSTORE_AUTH_HKEY;
const cstoreAuthSecret =
  process.env.R1EN_CSTORE_AUTH_SECRET ||
  process.env.EE_CSTORE_AUTH_SECRET ||
  process.env.CSTORE_AUTH_SECRET;

export const platformConfig = {
  DEBUG: rawDebug,
  MOCK_MODE: mockMode,
  cstoreApiUrl,
  r1fsApiUrl,
  chainstorePeers,
  casesHKey: process.env.RATIO1_CASES_HKEY || 'ratio1-asd-cases',
  jobsHKey: process.env.RATIO1_JOBS_HKEY || 'ratio1-asd-jobs',
  aspire: {
    apiUrl: aspireApiUrl,
    enabled: aspireApiEnabled,
    timeoutMs: aspireApiTimeoutMs
  },
  auth: {
    sessionCookieName: authSessionCookieName,
    sessionTtlSeconds: authSessionTtlSeconds,
    cstore: {
      hkey: cstoreAuthHkey,
      secret: cstoreAuthSecret
    }
  }
} as const;

export type PlatformConfig = typeof platformConfig;
