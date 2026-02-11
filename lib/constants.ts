/**
 * Application-wide constants
 */

/**
 * ENFORCE_MOCK_MODE
 *
 * Controls whether API calls are mocked (default: false).
 * When true, predictions use generateMockPredictionResponse instead of calling the real API.
 *
 * For displaying seed/demo data in the case library, use MOCK_DATA instead.
 */
export const ENFORCE_MOCK_MODE = false;

/**
 * DEFAULT_MOCK_DATA
 *
 * Controls whether seed/demo cases are shown in the case library (default: true).
 * When true, the case library shows seed cases alongside any real user-created cases.
 * When false, only real cases from storage are shown.
 *
 * This is separate from MOCK_MODE which controls API call behavior.
 */
export const DEFAULT_MOCK_DATA = true;

/**
 * Application version
 */
export const APP_VERSION = '1.0.0';

/**
 * Application name
 */
export const APP_NAME = 'ASPIRE Lab';

/**
 * Default pagination settings
 */
export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 100;

/**
 * Session defaults (can be overridden by environment)
 */
export const DEFAULT_SESSION_TTL_SECONDS = 86400; // 24 hours
export const MAX_SESSION_TTL_SECONDS = 604800; // 7 days

/**
 * Job status refresh interval (milliseconds)
 */
export const JOB_POLLING_INTERVAL_MS = 5000; // 5 seconds

/**
 * Health check interval (milliseconds)
 */
export const HEALTH_CHECK_INTERVAL_MS = 30000; // 30 seconds

/**
 * DEFAULT_USE_LOCAL_STORAGE
 *
 * Controls the default storage backend when USE_LOCAL_STORAGE environment variable is not set.
 *
 * When true (default): Uses JSON files for local storage of cases and jobs
 * When false: Uses CSTORE (distributed storage) for cases and jobs
 *
 * Note: Authentication always uses CSTORE regardless of this setting.
 */
export const DEFAULT_USE_LOCAL_STORAGE = true;

/**
 * Default data directory for local JSON storage
 */
export const DEFAULT_DATA_DIR = './data';
